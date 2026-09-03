import { Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';
import { ERROR_CODES } from '../constants';
import { AdminUser, Student } from '../models';
import { StudentStatus, AdminStatus } from '../types/enums';

/**
 * Middleware: Verify Admin JWT Token.
 */
export async function adminAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token is required', 401, ERROR_CODES.UNAUTHORIZED);
  }



  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);

  if (!payload || payload.role !== 'ADMIN') {
    return sendError(res, 'Invalid or expired admin authorization token', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Verify admin is still active in DB
  const admin = await AdminUser.findByPk(payload.userId);

  if (!admin || admin.status === AdminStatus.INACTIVE) {
    return sendError(res, 'Admin account is not active or has been removed', 403, ERROR_CODES.FORBIDDEN);
  }

  req.user = payload;
  next();
}

export async function studentAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Student authorization token is required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);

  if (!payload || payload.role !== 'STUDENT') {
    return sendError(res, 'Invalid or expired student authorization token', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Verify student still exists in DB
  const student = await Student.findByPk(payload.userId);

  if (!student) {
    return sendError(res, 'Student account not found', 404, ERROR_CODES.STUDENT_NOT_FOUND);
  }

  // Inject fresh status and class
  req.user = {
    ...payload,
    status: student.status,
    classId: student.classId,
    schoolId: student.schoolId,
  };

  next();
}

/**
 * Middleware: Verify that the student is ACTIVE (required for accessing learning curriculum).
 */
export async function activeStudentAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  // First run student auth check
  studentAuthMiddleware(req, res, () => {
    if (!req.user) return;

    if (req.user.status === StudentStatus.INACTIVE) {
      return sendError(
        res,
        'Your student account is currently inactive. Please contact school administration.',
        403,
        ERROR_CODES.STUDENT_INACTIVE
      );
    }

    if (req.user.status === StudentStatus.PENDING) {
      return sendError(
        res,
        'Your student account is pending approval or access code activation.',
        403,
        ERROR_CODES.STUDENT_PENDING_APPROVAL
      );
    }

    next();
  });
}

/**
 * Middleware: Verify temporary registration JWT issued after OTP verification for unregistered student.
 */
export async function registrationAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Registration authorization token is required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);

  if (!payload || (payload.role !== 'UNREGISTERED_STUDENT' && payload.role !== 'STUDENT')) {
    return sendError(res, 'Invalid or expired registration token', 401, ERROR_CODES.UNAUTHORIZED);
  }

  req.user = payload;
  next();
}
