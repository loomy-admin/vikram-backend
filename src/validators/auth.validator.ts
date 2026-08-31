import { z } from 'zod';

export const requestOtpSchema = z
  .object({
    email: z.string().email('Invalid email address format').optional(),
    phone: z
      .string()
      .regex(/^[+]?[0-9]{7,15}$/, 'Invalid phone number format (must contain 7-15 digits, optional + prefix)')
      .optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone must be provided',
    path: ['identifier'],
  });

export const verifyOtpSchema = z
  .object({
    email: z.string().email('Invalid email address format').optional(),
    phone: z
      .string()
      .regex(/^[+]?[0-9]{7,15}$/, 'Invalid phone number format')
      .optional(),
    otp: z.string().regex(/^[0-9]{6}$/, 'OTP must be exactly 6 numeric digits'),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone must be provided',
    path: ['identifier'],
  });

export const registerStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  schoolId: z.number().int().positive('Valid schoolId is required'),
  classId: z.number().int().positive('Valid classId is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  rollNumber: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Valid admin email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changeAdminPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});
