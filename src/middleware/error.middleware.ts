import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { ERROR_CODES } from '../constants';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): any {
  logger.error(`Unhandled Error [${req.method} ${req.originalUrl}]:`, err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected internal server error occurred';
  const errors = err.errors || undefined;

  return sendError(res, message, statusCode, errorCode, errors);
}

export function notFoundHandler(req: Request, res: Response): any {
  return sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    ERROR_CODES.RESOURCE_NOT_FOUND
  );
}
