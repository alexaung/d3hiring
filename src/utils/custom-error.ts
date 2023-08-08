export default class CustomError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; // 400 or 500
        this.isOperational = true; // Operational errors are errors that we can predict and handle

        Error.captureStackTrace(this, this.constructor); // This will not appear in the stack trace.
    }
}