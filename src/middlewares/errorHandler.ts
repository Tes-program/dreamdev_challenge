import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { Prisma } from '../generated/prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {


  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Prisma errors - these was created to handle database related errors gracefully
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      message: 'Database request error',
      error: err.message,
    });
  }

  // Handle database connection errors or issues
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable — could not connect',
    });
  }

  // Handle unknown errors
  console.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};