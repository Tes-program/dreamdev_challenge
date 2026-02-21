export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Stack Trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common errors
export const NotFoundError = (resource: string) =>
  new ApiError(`${resource} not found`, 404);

export const BadRequestError = (message: string) =>
  new ApiError(message, 400);

export const InternalError = (message: string) =>
  new ApiError(message, 500);