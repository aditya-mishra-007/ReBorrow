// backend/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}.`;
    err = new AppError(message, 400);
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'field value';
    const message = `Duplicate field value: ${value}. Please use another value!`;
    err = new AppError(message, 400);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    err = new AppError(message, 400);
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production: Don't leak leak details for programming errors
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
};