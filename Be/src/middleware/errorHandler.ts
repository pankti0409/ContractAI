import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CustomError } from '../utils/errors';
import { ApiResponse } from '../types';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      message: errorMessages.join(', ')
    };
    res.status(400).json(response);
    return;
  }
  next();
};

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Handle custom errors
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }
  // Handle database errors
  else if (error.name === 'QueryFailedError' || (error as any).code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
    isOperational = true;
  }
  else if ((error as any).code === '23503') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
    isOperational = true;
  }
  else if ((error as any).code === '23502') {
    statusCode = 400;
    message = 'Required field is missing';
    isOperational = true;
  }
  // Handle file upload errors
  else if ((error as any).code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
    isOperational = true;
  }
  else if ((error as any).code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    isOperational = true;
  }

  const response: ApiResponse = {
    success: false,
    error: message
  };

  // In development, include stack trace for operational errors
  if (process.env.NODE_ENV === 'development' && isOperational) {
    response.message = error.stack;
  }

  res.status(statusCode).json(response);

  // If it's not an operational error, we might want to restart the process
  if (!isOperational) {
    console.error('Non-operational error occurred. Consider restarting the application.');
    // In production, you might want to implement graceful shutdown
    // process.exit(1);
  }
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  };
  res.status(404).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};