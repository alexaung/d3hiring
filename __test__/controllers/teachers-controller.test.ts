import request from 'supertest';
import app from "../../src/app";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {

    // Disconnect and delete the many-to-many relationships between teachers and students:
    const teachers = await prisma.teacher.findMany({ include: { students: true } });
    for (let teacher of teachers) {
        for (let student of teacher.students) {
            await prisma.teacher.update({
                where: { id: teacher.id },
                data: {
                    students: {
                        disconnect: { id: student.id }
                    }
                }
            });
        }
    }

    // Now that relations are disconnected, we can delete main entities:
    await prisma.teacher.deleteMany();
    await prisma.student.deleteMany();
});

// After all tests have finished, close the Prisma connection
afterAll(async () => {
    await prisma.$disconnect();
});

describe('POST /api/register', () => {
    //1. checks if a teacher and students can be registered successfully:
    it('responds with 204 and registers the teacher and students', async () => {
        const teacherEmail = 'teacher1@example.com';
        const studentsEmails = ['student1@example.com', 'student2@example.com'];

        const response = await request(app)
            .post('/api/register')
            .send({
                teacher: teacherEmail,
                students: studentsEmails,
            });

        expect(response.status).toBe(204);

        // Verify that the teacher and students were inserted into the database
        const teacher = await prisma.teacher.findUnique({
            where: { email: teacherEmail },
            include: { students: true },
        });

        expect(teacher).toBeDefined();

        const students = teacher?.students.map((student) => student.email) || [];

        expect(students).toEqual(expect.arrayContaining(studentsEmails));
    });

    //2. Test when the request body is missing parameters:
    it('responds with 400 if teacher is missing from request body', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                students: ['student1@example.com']
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing teacher or students');
    });

    //3. Test when students or teacher data is not in the form of an email:
    it('responds with 400 if students are missing from request body', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher1@example.com'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing teacher or students');
    });

    //4. Test when students or teacher data is not in the form of an email:
    it('responds with 400 if teacher is not a valid email', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                teacher: 'invalidteacher',
                students: ['student1@example.com']
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid teacher email format');
    });

    //5. Test when students or teacher data is not in the form of an email:
    it('responds with 400 if a student is not a valid email', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher1@example.com',
                students: ['invalidstudent']
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid student email format');
    });

    //6. Test the case when a student is registered with another teacher:
    it('can register a student who is already registered with another teacher', async () => {
        // First, ensure the student is registered with teacher1
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher1@example.com',
                students: ['student1@example.com']
            });

        // Register the same student with teacher2
        const response = await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher2@example.com',
                students: ['student1@example.com']
            });

        expect(response.status).toBe(204);

        const teacher2 = await prisma.teacher.findUnique({
            where: { email: 'teacher2@example.com' },
            include: { students: true }
        });

        expect(teacher2?.students).toBeDefined();
        expect(teacher2?.students[0].email).toBe('student1@example.com');
    });
});

describe('GET /api/commonstudents', () => {
    //1. Retrieve the list of students common to a single teacher:
    it('responds wtih 200 and retrieves students registered to a single teacher', async () => {

        // First, ensure the student is registered with teacherken@gmail.com
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacherken@gmail.com',
                students: [
                    'commonstudent1@gmail.com',
                    'commonstudent2@gmail.com',
                    'student_only_under_teacher_ken@gmail.com'
                ]
            });

        const response = await request(app)
            .get('/api/commonstudents?teacher=teacherken%40gmail.com');

        expect(response.status).toBe(200);
        expect(response.body.students).toEqual(expect.arrayContaining([
            'commonstudent1@gmail.com',
            'commonstudent2@gmail.com',
            'student_only_under_teacher_ken@gmail.com'
        ]));
    });

    //2. Retrieve the list of students common to multiple teachers:
    it('responds wtih 200 and retrieves students registered to multiple teachers', async () => {

        // First, ensure the student is registered with
        // teacherken@gmail and teacherjoe@
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacherken@gmail.com',
                students: [
                    'commonstudent1@gmail.com',
                    'commonstudent2@gmail.com',
                    'student_only_under_teacher_ken@gmail.com'
                ]
            });

        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacherjoe@gmail.com',
                students: [
                    'commonstudent1@gmail.com',
                    'commonstudent2@gmail.com'
                ]
            });

        const response = await request(app)
            .get('/api/commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjoe%40gmail.com');

        expect(response.status).toBe(200);
        expect(response.body.students).toEqual(expect.arrayContaining([
            'commonstudent1@gmail.com',
            'commonstudent2@gmail.com'
        ]));

    });

    //3. Test when the request query is missing parameters:
    it('responds with 400 if teacher is missing from request query', async () => {
        const response = await request(app)
            .get('/api/commonstudents');
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('No teachers specified');
    });

    //4. Test when an invalid/non-existent teacher is specified:
    it('responds with 400 if teacher does not exist', async () => {
        const response = await request(app)
            .get('/api/commonstudents?teacher=invalidteacher%40gmail.com');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Teacher does not exist');
    });

    //5. Test where there are no common students between the teachers:
    it('responds with 200 and empty list if no common students', async () => {

        // First, ensure the student is registered with teacher1@gmail and teacher2@gmail.com
        // Register teacher1 with students
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher1@gmail.com',
                students: [
                    'studentA1@gmail.com',
                    'studentA2@gmail.com',
                    'studentA3@gmail.com'
                ]
            });

        // Register teacher2 with different students
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher2@gmail.com',
                students: [
                    'studentB1@gmail.com',
                    'studentB2@gmail.com',
                    'studentB3@gmail.com'
                ]
            });

        const response = await request(app)
            .get('/api/commonstudents?teacher=teacher1%40gmail.com&teacher=teacher2%40gmail.com');
        expect(response.status).toBe(200);
        expect(response.body.students).toEqual([]);
    });
});

describe('POST /api/suspend', () => {

    //1. Test when a student is successfully suspended:
    it('responds with 204 and successfully suspends a valid student', async () => {
        // First, ensure the student is registered with teacher1@gmail and is not suspended
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher1@gmail.com',
                students: [
                    'studentmary@gmail.com',
                ]
            });

        const response = await request(app)
            .post('/api/suspend')
            .send({
                student: 'studentmary@gmail.com',
            });
        expect(response.status).toBe(204);
    });

    //2. Test when a student is not found:
    it('responds with 400 when trying to suspend a student who does not exist', async () => {
        const response = await request(app)
            .post('/api/suspend')
            .send({
                student: 'nonexistentstudent@gmail.com',
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Student does not exist');
    });

    //3. Test when no student is specified:
    it('responds with 400 when no student email is specified', async () => {
        const response = await request(app).post('/api/suspend').send({});
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('No student specified');
    });

    //4. Test when a student is already suspended:
    it('responds with 204 when suspending an already suspended student', async () => {
        // First, ensure the student is registered with teacher1@gmail and is not suspended
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacher1@gmail.com',
                students: [
                    'studentmary@gmail.com',
                ]
            });

        // Suspend the student
        const response1 = await request(app)
            .post('/api/suspend')
            .send({
                student: 'studentmary@gmail.com',
            });

        const response = await request(app)
            .post('/api/suspend')
            .send({
                student: 'studentmary@gmail.com',
            });
        expect(response.status).toBe(204);
    });
});

describe('POST /api/retrievefornotifications', () => {
    
    // Setup necessary data before running the tests
    beforeEach(async () => {
        // Register a teacher
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacherken@gmail.com',
                students: [
                    'studentbob@gmail.com',
                    'studentagnes@gmail.com'
                ]
            });

        // Register another teacher and students for other test cases
        await request(app)
            .post('/api/register')
            .send({
                teacher: 'teacheralice@gmail.com',
                students: [
                    'studentmiche@gmail.com'
                ]
            });
    });

    
    it('responds with 200 and retrieves students who can receive a notification with @mentions', async () => {
        const response = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                teacher: 'teacherken@gmail.com',
                notification: 'Hello students! @studentagnes@gmail.com @studentmiche@gmail.com'
            });
        expect(response.status).toBe(200);
        expect(response.body.recipients).toEqual(expect.arrayContaining([
            "studentbob@gmail.com",
            "studentagnes@gmail.com",
            "studentmiche@gmail.com"
        ]));
    });

    it('responds with 200 and retrieves students who can receive a notification without any @mentions', async () => {
        const response = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                teacher: 'teacherken@gmail.com',
                notification: 'Hey everybody'
            });
        expect(response.status).toBe(200);
        expect(response.body.recipients).toEqual(expect.arrayContaining([
            "studentbob@gmail.com"
        ]));
    });

    it('responds with 400 when no teacher is specified', async () => {
        const response = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                notification: 'Hey everybody'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing teacher or notification');
    });

    it('responds with 400 when no notification text is specified', async () => {
        const response = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                teacher: 'teacherken@gmail.com'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing teacher or notification');
    });

    it('responds with 400 when a non-existent teacher sends a notification', async () => {
        const response = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                teacher: 'nonexistentteacher@gmail.com',
                notification: 'Hello'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Teacher does not exist');
    });

    // To test the case for a suspended student, we first need to suspend a student.
    it('responds with 200 but does not include a suspended student in the recipients list', async () => {
        
        // Suspend the student first
        await request(app)
            .post('/api/suspend')
            .send({ student: 'studentmiche@gmail.com' });
        
        // Now send a notification mentioning the suspended student
        const response = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                teacher: 'teacherken@gmail.com',
                notification: 'Hello @studentmiche@gmail.com'
            });

        expect(response.status).toBe(200);
        expect(response.body.recipients).not.toContain('studentmiche@gmail.com');
    });
});
