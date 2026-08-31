import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';


  /**
   * POST /api/auth/student/request-otp
   */
  export async function requestStudentOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.requestStudentOtp({
        email: req.body.email,
        phone: req.body.phone,
      });
      return sendSuccess(res, result, 'OTP sent successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/student/verify-otp
   */
  export async function verifyStudentOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyStudentOtp(
        { email: req.body.email, phone: req.body.phone },
        req.body.otp
      );
      return sendSuccess(res, result, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/auth/login
   */
  export async function adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.adminLogin(req.body.email, req.body.password);
      return sendSuccess(res, result, 'Admin login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/auth/change-password
   */
  export async function changeAdminPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const result = await AuthService.changeAdminPassword(
        adminId,
        req.body.currentPassword,
        req.body.newPassword
      );
      return sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/auth/me
   */
  export async function getAdminProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, req.user, 'Admin profile retrieved');
    } catch (error) {
      next(error);
    }
  }

