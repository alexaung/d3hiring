import { Request, Response, NextFunction } from 'express';

// This module exports a higher-order function that wraps an asynchronous function (fn)
// with Express request, response, and next function parameters.
// The purpose of this wrapper is to handle any rejected Promises that occur within fn,
// and pass the error to the next middleware in the Express pipeline.
export default (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {

  // Returns a new function that will be called when the corresponding route is hit.
  return (req: Request, res: Response, next: NextFunction) => {

    // Calls the provided asynchronous function (fn) and catches any errors.
    // If an error occurs, it's passed to the next middleware function in the Express pipeline.
    fn(req, res, next).catch((err: Error) => next(err));
  };
};
