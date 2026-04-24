import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({
    message: error.message,
    path: req.originalUrl,
    method: req.method,
    stack: error.stack
  });

  if (error instanceof AppError) {
    const response: any = {
      success: false,
      message: error.message
    };

    // Include details in development
    if (process.env.NODE_ENV === 'development' && (error as any).details) {
      response.details = (error as any).details;
    }

    return res.status(error.statusCode).json(response);
  }

  res.status(500).json({
    success: false,
    message: error.message || 'Error interno del servidor'
  });
};
