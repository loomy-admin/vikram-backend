import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { ERROR_CODES } from '../constants';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): any => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(
          res,
          formattedErrors[0]?.message || 'Validation failed',
          400,
          ERROR_CODES.VALIDATION_ERROR,
          formattedErrors
        );
      }
      return sendError(res, 'Invalid request data', 400, ERROR_CODES.VALIDATION_ERROR);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): any => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(
          res,
          formattedErrors[0]?.message || 'Query parameter validation failed',
          400,
          ERROR_CODES.VALIDATION_ERROR,
          formattedErrors
        );
      }
      return sendError(res, 'Invalid query parameters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
  };
}
