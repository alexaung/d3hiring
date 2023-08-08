// Desc: Handlers for teachers routes
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncErrorHandler from '../utils/async-error-handler';
import CustomError from '../utils/custom-error';
import { isValidEmail, parseMentionedEmails } from '../utils/utils';

const prisma = new PrismaClient();

const register = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { teacher, students } = req.body;
    if (!teacher || !students || !Array.isArray(students)) {
        return next(new CustomError('Missing teacher or students', 400));
    }
    // Validate teacher email format
    if (!isValidEmail(teacher)) {
        return next(new CustomError('Invalid teacher email format', 400));
    }

    // Validate student email formats
    students.forEach((studentEmail) => {
        if (!isValidEmail(studentEmail)) {
            return next(new CustomError('Invalid student email format', 400));
        }
    });

    // Check if teacher exists, if not, create the teacher
    let existingTeacher = await prisma.teacher.findUnique({
        where: {
            email: teacher
        },
    });

    if (!existingTeacher) {
        existingTeacher = await prisma.teacher.create({
            data: {
                email: teacher
            }
        });
    }

    // Get the students connected to the teacher
    const currentStudents = await prisma.student.findMany({
        where: {
            teachers: {
                some: {
                    email: teacher,
                },
            },
        },
    });

    await Promise.all(students.map(async (studentEmail: string) => {

        // Check if student is already connected to the teacher
        if (currentStudents.some((student) => student.email === studentEmail)) {
            return;
        }

        // Check if student exists, if not, create the student
        let student = await prisma.student.findUnique({
            where: { email: studentEmail },
        });

        if (!student) {
            student = await prisma.student.create({
                data: { email: studentEmail },
            });
        }

        await prisma.teacher.update({
            where: { email: teacher },
            data: {
                students: {
                    connect: { id: student.id },
                },
            },
        });
    }));

    res.status(204).json();
});

const commonstudents = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { teacher } = req.query;

    // Validate the presence of teacher query and ensure it is an array or a single string
    if (!teacher || !Array.isArray(teacher) && teacher.length === 0) {
        return next(new CustomError('No teachers specified', 400));
    }

    // Convert teacher to an array if it is a single string
    const teachersArray = Array.isArray(teacher) ? teacher : [teacher];

    let commonstudents: string[] = [];

    for (const teacherEmail of teachersArray) {
        // Check if the teacher exists
        const teacherExists = await prisma.teacher.findUnique({
            where: { email: teacherEmail as string }
        });

        // If the teacher doesn't exist, return a 404 error
        if (!teacherExists) {
            return next(new CustomError('Teacher does not exist', 404));
        }
        // Get the students connected to the teacher
        const studentsOfTeacher = await prisma.student.findMany({
            where: {
                teachers: {
                    some: {
                        email: teacherEmail,
                    },
                },
            },
            select: {
                email: true,
            },
        });

        // Get the emails of the students connected to the teacher
        const emails = studentsOfTeacher.map((student) => student.email);

        // If commonstudents is empty, set it to the emails, else intersect with existing commonstudents
        if (commonstudents.length === 0) {
            commonstudents = emails;
        } else {
            commonstudents = commonstudents.filter((email) => emails.includes(email));
        }

        // If commonstudents is empty, break out of the loop
        if (commonstudents.length === 0) {
            break;
        }
    }

    res.status(200).json({
        status: 'success',
        students: commonstudents
    });

});

const suspend = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { student } = req.body;

    if (!student) {
        return next(new CustomError('No student specified', 400));
    }

    // Check if student exists, if not, throw error
    const studentExists = await prisma.student.findUnique({
        where: { email: student },
    });

    if (!studentExists) {
        return next(new CustomError('Student does not exist', 400));
    }

    await prisma.student.update({
        where: { email: student },
        data: { suspended: true },
    });

    res.status(204).json();
});

const retrievefornotifications = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { teacher, notification } = req.body;

    if (!teacher || !notification) {
        return next(new CustomError('Missing teacher or notification', 400));
    }

    // Parse the notification to find any valid @mentioned students' emails
    const mentionedStudents = parseMentionedEmails(notification);


    const mentionedStudentObjects = await prisma.student.findMany({
        where: {
            suspended: false,
            email: {
                in: mentionedStudents,
            },
        },
    });

    const activeMentionedStudents = mentionedStudentObjects.map(student => student.email);

    const teacherExist = await prisma.teacher.findUnique({
        where: { email: teacher },
    });

    if (!teacherExist) {
        return next(new CustomError('Teacher does not exist', 400));
    }

    // Get all students who are registered with the given teacher and are not suspended
    const studentsOfTeacher = await prisma.student.findMany({
        where: {
            suspended: false,
            teachers: {
                some: {
                    email: teacher,
                },
            },
        },
        select: {
            email: true,
        },
    });

    // Combine the mentioned students and students of the teacher and remove duplicates
    const recipients = [...new Set([...studentsOfTeacher.map((student) => student.email), ...activeMentionedStudents])];

    res.status(200).json({
        status: 'success',
        recipients
    });
});

export default {
    register,
    commonstudents,
    suspend,
    retrievefornotifications,
};