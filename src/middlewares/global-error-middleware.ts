import { Request, Response, NextFunction } from 'express';
import CustomError from "../utils/custom-error";
import { Prisma } from '@prisma/client'

const devError = (err: CustomError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
    });
};

const prodError = (err: CustomError, res: Response) => {
    // Production error
    let error = { ...err };
    error.message = err.message;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (err.code === 'P2002') {
            const message = 'There is a unique constraint violation, a new user cannot be created with this email';
            error = new CustomError(message, 401);
        }
    }

    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token. Please log in again.";
        error = new CustomError(message, 401);
    }

    if (err.name === "TokenExpiredError") {
        const message = "Your token has expired. Please log in again.";
        error = new CustomError(message, 401);
    }

    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message || "Internal Server Error",
        });

        // Programming or other unknown error: don't leak error details
    } else {
        // 1) Log error
        console.error("ERROR", err);

        // 2) Send generic message
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred. Please try again later."
        });
    }
}

// This is a global error handling middleware
export default (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        devError(err, res);
    } else if (process.env.NODE_ENV === "production") {
        prodError(err, res);
    }
}
