import express, { Request, Response, NextFunction } from 'express';
import teachersRouter from './routes/teachers-route';
import globalErrorHandler from "./middlewares/global-error-middleware";
import CustomError from "./utils/custom-error";
require('dotenv').config()
const app = express();

app.use(express.json());

// Mounting the router on the app at the root level
app.use('/', teachersRouter);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new CustomError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(err);
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;

