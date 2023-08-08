# D3Hiring API Server

API server powered by Node.js, TypeScript, Prisma, and MySQL, designed for the D3Hiring project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Using Docker](#using-docker)
  - [Locally Without Docker](#locally-without-docker)
- [Running the Server](#running-the-server)
- [Deploying to Google Cloud Run](#deploying-to-google-cloud-run)
- [Running Tests](#running-tests)
- [Hosted API](#hosted-api)
- [API Documentation](#api-documentation)
- [Authors](#authors)
- [License](#license)

## Prerequisites

Ensure you have the following installed on your system:

- Docker & Docker Compose (for Docker installation)
- MySQL (for local installation)
- Node.js 
- Git

## Installation

### Using Docker

1. **Clone the Repository:**
   
   ```bash
    git clone https://github.com/alexaung/d3hiring.git
    cd d3hiring
    ```

2. **Set Up Docker Containers:**

    ```bash
    docker-compose up -d
    ```

    This command will start the API server and MySQL database as described in the docker-compose.yml file. 

3. **Database Migrations:**

    After the services are up, you can execute migrations with:

    ```bash
    docker-compose exec app npx prisma migrate deploy
    ```

### Locally Without Docker

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/alexaung/d3hiring.git
    cd d3hiring
    ```

2. **Install Dependencies:**

    ```bash 
    npm install
    ```

3. **Generate Prisma Client:**

    This will generate necessary client files for Prisma.

    ```bash
    npx prisma generate
    ```

4. **Run Database Migrations:**

    First, ensure your MySQL service is running. Then, run:

    ```bash
    npx prisma migrate deploy
    ```

## Running the Server

With the containers up and running, the API server will be accessible at:

```bash
http://localhost:3000
```

## Deploying to Google Cloud Run

This guide outlines the steps to deploy a Docker containerized application to Google Cloud Run using the Google Cloud SDK (`gcloud`) and Docker.

### Prerequisites

Before you begin, make sure you have the following:

- A Google Cloud Platform (GCP) account
- Docker installed on your local machine
- Google Cloud SDK (`gcloud`) installed on your local machine

### Deployment Steps

1. **Authenticate with Google Cloud:**
   
   ```bash
   gcloud auth login
    ```
   This command will open a browser window and prompt you to log in to your GCP account. Follow the instructions to authenticate.

2. **Set Project Configuration:**

    ```bash
    gcloud config set project <PROJECT_ID>
    ```
    
    Replace `<PROJECT_ID>` with your actual GCP project ID. This sets the active project for the `gcloud`` command-line tool.

3. **Build and Push Docker Image::**

    Build a Docker image for your application and push it to Google Container Registry (GCR). Run the following commands in your project directory:

    ```bash
    docker build -t gcr.io/PROJECT_ID/IMAGE_NAME:latest .
    docker push gcr.io/PROJECT_ID/IMAGE_NAME:latest
    ```
    
    Replace `PROJECT_ID` with your GCP project ID and `IMAGE_NAME` with a name for your Docker image.

4. **Deploy to Google Cloud Run:**
    Deploy your application to Google Cloud Run using the following command:

    ```bash
    gcloud run deploy SERVICE_NAME --image gcr.io/PROJECT_ID/IMAGE_NAME:latest --platform managed --region REGION --allow-unauthenticated
    ```

    Replace `SERVICE_NAME`, `PROJECT_ID`, `IMAGE_NAME`, and `REGION` with appropriate values. The --allow-unauthenticated flag allows public access to the deployed service.

## Running Tests

To run the unit tests for the API, use the following command:

```bash
npm test
```

## Hosted API

The API is hosted on Google Cloud Run and uses Cloud SQL for the database. Please note that this hosted version is configured with minimum capacity for testing purposes only.

- API Base URL: `https://d3hiring-dwx6gkx3sq-uc.a.run.app/`

Please use this link for testing and evaluation purposes. If you intend to deploy the API for production use, make sure to adjust the configuration and capacity accordingly.

## API Documentation

Here's a detailed overview of the available endpoints:

1. **Register Students to a Teacher*** (`POST /api/register`)

    **Description**: This endpoint allows a teacher to register one or more students to their class.

    **Request:**

    ```json
    {
      "teacher": "teacherken@gmail.com",
      "students": [
        "studentjon@gmail.com",
        "studenthon@gmail.com"
      ]
    }
    ```

    **Response:**

    - Status Code: `204 No Content`
    - Description: The request was successful.

2. **Retrieve Common Students*** (`GET /api/commonstudents`)

    **Description**: This endpoint retrieves a list of students who are common to the given list of teachers.

    **Request:**

    - Method: GET
    - Query Parameters:
      - `teacher`: Teacher's email (multiple values allowed).
    - Example: `GET /api/commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjoe%40gmail.com`

    **Response:**
    - Status Code: `200 OK`
    - Body:

    ```json
    {
      "students": [
        "commonstudent1@gmail.com",
        "commonstudent2@gmail.com"
      ]
    }
    ```

3. **Suspend a Student*** (`POST /api/suspend`)

    **Description**: This endpoint allows a teacher to suspend a specified student.

    **Request:**

    ```json
    {
      "student" : "studentmary@gmail.com"
    }
    ```

    **Response:**
    - Status Code: `204 No Content`
    - Description: The request was successful.

4. **Retrieve Student Recipients for a Notification*** (`POST /api/retrievefornotifications`)

    **Description**: This endpoint allows a teacher to retrieve a list of students who can receive a given notification.

    **Request:**

    ```json
    {
      "teacher": "teacherken@gmail.com",
      "notification": "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com"
    }
    ```

    **Response:**
    - Status Code: `200 OK`
    - Body:

    ```json
    {
      "recipients": [
        "studentbob@gmail.com",
        "studentagnes@gmail.com",
        "studentmiche@gmail.com"
      ]
    }
    ```

## Authors

Alex Aung Myo OO

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.