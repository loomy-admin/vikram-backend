import { Response, NextFunction } from 'express';
import * as StudentService from '../services/student.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthenticatedRequest } from '../types';


  /**
   * POST /api/students/register
   * Requires verified OTP token (from auth context).
   */
  export async function registerStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const email = req.user?.email || req.body.email || null;
      const phone = req.user?.phone || req.body.phone || null;

      const result = await StudentService.registerStudent({
        name: req.body.name,
        schoolId: req.body.schoolId,
        classId: req.body.classId,
        email,
        phone,
      });

      return sendCreated(res, result, 'Student registered successfully with pending status');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/me
   */
  export async function getStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const profile = await StudentService.getStudentProfile(studentId);
      return sendSuccess(res, profile, 'Student profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/home
   */
  export async function getStudentHome(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const classId = req.user?.classId;
      const homeFeed = await StudentService.getStudentHomeFeed(studentId, classId);
      return sendSuccess(res, homeFeed, 'Home feed retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/subjects
   */
  export async function getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const classId = req.user?.classId;
      const subjects = await StudentService.getSubjectsForStudent(classId);
      return sendSuccess(res, subjects, 'Subjects retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/subjects/:id/chapters
   */
  export async function getChapters(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const subjectId = parseInt(req.params.id, 10);
      const classId = req.user!.classId!;
      const result = await StudentService.getChaptersForSubject(subjectId, classId);
      return sendSuccess(res, result, 'Chapters retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/chapters/:id/topics
   */
  export async function getTopics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const chapterId = parseInt(req.params.id, 10);
      const classId = req.user!.classId!;
      const result = await StudentService.getTopicsForChapter(chapterId, classId);
      return sendSuccess(res, result, 'Topics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/topics/:id
   */
  export async function getTopicDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const topicId = parseInt(req.params.id, 10);
      const studentId = req.user!.userId;
      const classId = req.user!.classId!;
      const result = await StudentService.getTopicDetails(topicId, studentId, classId);
      return sendSuccess(res, result, 'Topic details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/content/:id
   */
  export async function getContentDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contentId = parseInt(req.params.id, 10);
      const studentId = req.user!.userId;
      const classId = req.user!.classId!;
      const result = await StudentService.getContentDetails(contentId, studentId, classId);
      return sendSuccess(res, result, 'Content details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/student/content/:id/access
   */
  export async function logContentAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contentId = parseInt(req.params.id, 10);
      const studentId = req.user!.userId;
      const result = await StudentService.logContentAccess(contentId, studentId);
      return sendSuccess(res, result, 'Content access logged successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/student/content/:id/complete
   */
  export async function markContentCompleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contentId = parseInt(req.params.id, 10);
      const studentId = req.user!.userId;
      const result = await StudentService.markContentCompleted(contentId, studentId);
      return sendSuccess(res, result, 'Content marked as completed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/student/recent-content
   */
  export async function getRecentContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await StudentService.getRecentContent(studentId, limit);
      return sendSuccess(res, result, 'Recent content retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

