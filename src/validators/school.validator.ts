import { z } from 'zod';
import { SchoolStatus } from '../types/enums';

export const createSchoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters').max(200),
  schoolCode: z
    .string()
    .min(2, 'School code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'School code can only contain alphanumeric characters, dashes, and underscores'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid school contact email').optional().or(z.literal('')),
  status: z.nativeEnum(SchoolStatus).optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial();

export const updateSchoolStatusSchema = z.object({
  status: z.nativeEnum(SchoolStatus, {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});
