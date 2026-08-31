import { z } from 'zod';
import { AdminStatus, StudentStatus } from '../types/enums';

export const createAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.nativeEnum(AdminStatus).optional(),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  status: z.nativeEnum(AdminStatus).optional(),
});

export const updateAdminUserStatusSchema = z.object({
  status: z.nativeEnum(AdminStatus, {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

export const updateStudentStatusSchema = z.object({
  status: z.nativeEnum(StudentStatus, {
    errorMap: () => ({ message: 'Status must be PENDING, ACTIVE, or INACTIVE' }),
  }),
});
