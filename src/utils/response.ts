import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200
): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(responseBody);
}

export function sendCreated<T>(
  res: Response,
  data?: T,
  message: string = 'Resource created successfully'
): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  code?: string,
  errors?: any
): Response {
  const responseBody: ApiResponse = {
    success: false,
    message,
    ...(code && { code }),
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(responseBody);
}
