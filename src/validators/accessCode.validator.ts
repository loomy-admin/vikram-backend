import { z } from 'zod';
import { AccessCodeStatus } from '../types/enums';

export const activateAccessCodeSchema = z.object({
  code: z
    .string()
    .regex(/^[0-9]{10}$/, 'Access code must be exactly 10 numeric digits'),
});

export const createSingleAccessCodeSchema = z.object({
  schoolId: z.number().int().positive('Valid schoolId is required'),
});

export const createBulkAccessCodesSchema = z.object({
  schoolId: z.number().int().positive('Valid schoolId is required'),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(1000, 'Quantity cannot exceed 1000 per request'),
});

export const updateAccessCodeStatusSchema = z.object({
  status: z.nativeEnum(AccessCodeStatus, {
    errorMap: () => ({ message: 'Status must be UNUSED, USED, or INACTIVE' }),
  }),
});

export const reassignAccessCodeSchema = z.object({
  schoolId: z.number().int().positive('Target schoolId is required'),
});
