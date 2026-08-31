import bcrypt from 'bcrypt';
import { OtpChannel, AdminStatus, StudentStatus } from '../types/enums';
import { Student, AdminUser, School, Class, AccessCode } from '../models';
import { Op } from 'sequelize';
import { signJwt } from '../utils/jwt';
import * as OtpService from './otp.service';
import { RequestOtpResult } from './otp.service';
import { ERROR_CODES } from '../constants';
import { logger } from '../utils/logger';

/**
 * Request OTP for student authentication (passwordless).
 */
export async function requestStudentOtp(identifier: { email?: string; phone?: string }): Promise<RequestOtpResult> {
  const rawIdentifier = identifier.email || identifier.phone;
  if (!rawIdentifier) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Either email or phone is required',
    };
  }

  const channel = identifier.email ? OtpChannel.EMAIL : OtpChannel.PHONE;
  return OtpService.requestOtp(rawIdentifier, channel);
}

/**
 * Verify OTP for student authentication.
 * If existing student: updates lastLoginAt and returns auth token + student profile.
 * If new student: returns verificationToken for the registration step.
 */
export async function verifyStudentOtp(identifier: { email?: string; phone?: string }, otp: string) {
  const rawIdentifier = identifier.email || identifier.phone;
  if (!rawIdentifier) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Either email or phone is required',
    };
  }

  const channel = identifier.email ? OtpChannel.EMAIL : OtpChannel.PHONE;
  const verification = await OtpService.verifyOtp(rawIdentifier, otp);

  if (!verification.isValid) {
    throw {
      statusCode: 400,
      code: verification.errorCode || ERROR_CODES.OTP_INVALID,
      message: verification.errorMessage || 'Invalid OTP code',
    };
  }

  const normalizedIdentifier = rawIdentifier.trim().toLowerCase();

  // Check if student exists in database
  const student = await Student.findOne({
    where: identifier.email
      ? { email: normalizedIdentifier }
      : { phone: normalizedIdentifier },
    include: [
      { model: School, as: 'school', attributes: ['id', 'name', 'schoolCode', 'status'] },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade'] },
      { model: AccessCode, as: 'accessCode', attributes: ['id', 'code', 'status', 'usedAt'] },
    ],
  });

  if (student) {
    // Existing student: update last login timestamp
    await student.update({ lastLoginAt: new Date() });

    const token = signJwt({
      userId: student.id,
      role: 'STUDENT',
      email: student.email,
      phone: student.phone,
      schoolId: student.schoolId,
      classId: student.classId,
      status: student.status,
    });

    return {
      isNewStudent: false,
      token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        status: student.status,
        school: (student as any).school,
        class: (student as any).class,
        accessCode: (student as any).accessCode,
        lastLoginAt: student.lastLoginAt,
        createdAt: student.createdAt,
      },
    };
  }

  // New student: issue temporary JWT valid for completing registration
  const temporaryToken = signJwt(
    {
      userId: 0,
      role: 'UNREGISTERED_STUDENT',
      email: identifier.email ? normalizedIdentifier : null,
      phone: identifier.phone ? normalizedIdentifier : null,
      isTemporary: true,
    },
    '1h'
  );

  return {
    isNewStudent: true,
    verificationToken: temporaryToken,
    identifier: normalizedIdentifier,
    channel,
    message: 'OTP verified successfully. Please proceed with registration.',
  };
}

/**
 * Admin login with email and password.
 */
export async function adminLogin(email: string, password: string) {
  const admin = await AdminUser.findOne({
    where: { email: email.trim() },
  });

  if (!admin) {
    throw {
      statusCode: 401,
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Invalid email or password',
    };
  }

  if (admin.status === AdminStatus.INACTIVE) {
    throw {
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: 'Admin account is inactive. Please contact system administrator.',
    };
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    throw {
      statusCode: 401,
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Invalid email or password',
    };
  }

  const token = signJwt({
    userId: admin.id,
    role: 'ADMIN',
    email: admin.email,
    status: admin.status,
  });

  logger.info(`Admin logged in: ${admin.email}`);

  return {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
      createdAt: admin.createdAt,
    },
  };
}

/**
 * Admin change password.
 */
export async function changeAdminPassword(adminId: number, currentPassword: string, newPassword: string) {
  const admin = await AdminUser.findByPk(adminId);

  if (!admin) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Admin user not found',
    };
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!isMatch) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Current password is incorrect',
    };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await admin.update({ passwordHash: newHash });

  logger.info(`Admin password changed for ID: ${adminId}`);

  return { message: 'Password changed successfully' };
}
