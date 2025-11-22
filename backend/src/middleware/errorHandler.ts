import { type Request, type Response, type NextFunction } from 'express';
import pino from 'pino';

const logger = pino();

export interface ErrorResponse {
  error: true;
  message: string;
  details?: unknown;
}

/**
 * Express error handling middleware
 * Logs errors and returns consistent JSON error responses
 */
export const errorHandler = (
  err: Error | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error(
    {
      err,
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
    'Request error'
  );

  // Determine error message and details
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (err instanceof Error) {
    message = err.message || message;
    // Include stack trace in details for development
    if (process.env.NODE_ENV === 'development') {
      details = {
        stack: err.stack,
        name: err.name,
      };
    }
  } else if (typeof err === 'object' && err !== null) {
    // Handle error objects
    const errorObj = err as Record<string, unknown>;
    message = (errorObj.message as string) || message;
    details = errorObj.details || errorObj;
  }

  // Send consistent error response
  const errorResponse: ErrorResponse = {
    error: true,
    message,
    ...(details !== undefined ? { details } : {}),
  };

  // Default to 500 if status code not set
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json(errorResponse);
};

