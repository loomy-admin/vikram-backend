import { Request, Response, NextFunction } from 'express';
import * as AccessCodeService from '../services/accessCode.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { AccessCodeStatus } from '../types/enums';


  /**
   * POST /api/access-codes/activate
   * Authenticated student submits 10-digit code.
   */
  export async function activateAccessCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const result = await AccessCodeService.activateStudentWithCode(studentId, req.body.code);
      return sendSuccess(res, result, 'Account activated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/access-codes
   * Generate 1 unique 10-digit code.
   */
  export async function generateSingleCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccessCodeService.generateSingleCode(req.body.schoolId);
      return sendCreated(res, result, '10-digit access code generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/access-codes/bulk
   * Generate N bulk unique 10-digit codes.
   */
  export async function generateBulkCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccessCodeService.generateBulkCodes(req.body.schoolId, req.body.quantity);
      return sendCreated(res, result, `${result.totalGenerated} access codes generated successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/access-codes
   */
  export async function listAccessCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string, 10) : undefined;
      const status = req.query.status as AccessCodeStatus;
      const isUsed = req.query.isUsed !== undefined ? req.query.isUsed === 'true' : undefined;

      const result = await AccessCodeService.listAccessCodes({
        page,
        limit,
        search,
        schoolId,
        status,
        isUsed,
      });

      return sendSuccess(res, result, 'Access codes retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/access-codes/:id
   */
  export async function getAccessCodeById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AccessCodeService.getAccessCodeById(id);
      return sendSuccess(res, result, 'Access code details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/access-codes/:id/status
   */
  export async function updateAccessCodeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AccessCodeService.updateAccessCodeStatus(id, req.body.status);
      return sendSuccess(res, result, 'Access code status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/access-codes/:id/reassign
   */
  export async function reassignAccessCode(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AccessCodeService.reassignAccessCode(id, req.body.schoolId);
      return sendSuccess(res, result, 'Access code reassigned successfully');
    } catch (error) {
      next(error);
    }
  }

