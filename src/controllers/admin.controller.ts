import { Request, Response, NextFunction } from 'express';
import * as DashboardService from '../services/dashboard.service';
import * as SchoolService from '../services/school.service';
import * as AdminService from '../services/admin.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { SchoolStatus, StudentStatus, AdminStatus } from '../types/enums';


  // ----------------------------------------------------
  // DASHBOARD STATS
  // ----------------------------------------------------
  export async function getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getDashboardStats();
      return sendSuccess(res, stats, 'Dashboard statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // SCHOOL MANAGEMENT
  // ----------------------------------------------------
  export async function listSchools(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const status = req.query.status as SchoolStatus;

      const result = await SchoolService.listSchools({ page, limit, search, status });
      return sendSuccess(res, result, 'Schools retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getSchoolById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await SchoolService.getSchoolById(id);
      return sendSuccess(res, result, 'School details retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SchoolService.createSchool(req.body);
      return sendCreated(res, result, 'School created successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await SchoolService.updateSchool(id, req.body);
      return sendSuccess(res, result, 'School updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateSchoolStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await SchoolService.updateSchoolStatus(id, req.body.status);
      return sendSuccess(res, result, 'School status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function getSchoolStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await SchoolService.getSchoolStudents(id, page, limit);
      return sendSuccess(res, result, 'School students retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getSchoolAccessCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await SchoolService.getSchoolAccessCodes(id, page, limit);
      return sendSuccess(res, result, 'School access codes retrieved');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // ADMIN USER MANAGEMENT
  // ----------------------------------------------------
  export async function listAdminUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listAdminUsers();
      return sendSuccess(res, result, 'Admin users retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getAdminUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AdminService.getAdminUserById(id);
      return sendSuccess(res, result, 'Admin user details retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.createAdminUser(req.body);
      return sendCreated(res, result, 'Admin user created successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AdminService.updateAdminUser(id, req.body);
      return sendSuccess(res, result, 'Admin user updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateAdminUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AdminService.updateAdminUserStatus(id, req.body.status);
      return sendSuccess(res, result, 'Admin user status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // STUDENT ADMIN MANAGEMENT
  // ----------------------------------------------------
  export async function listStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string, 10) : undefined;
      const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : undefined;
      const status = req.query.status as StudentStatus;

      const result = await AdminService.listStudents({ page, limit, search, schoolId, classId, status });
      return sendSuccess(res, result, 'Students retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AdminService.getStudentById(id);
      return sendSuccess(res, result, 'Student details retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function updateStudentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await AdminService.updateStudentStatus(id, req.body.status);
      return sendSuccess(res, result, 'Student status updated successfully');
    } catch (error) {
      next(error);
    }
  }

