import { Router } from 'express';
import * as StudentController from '../controllers/student.controller';
import { validateBody } from '../middleware/validate.middleware';
import {
  studentAuthMiddleware,
  activeStudentAuthMiddleware,
  registrationAuthMiddleware,
} from '../middleware/auth.middleware';
import { registerStudentSchema } from '../validators/auth.validator';

const router = Router();

// Student Registration (Requires verified OTP session token)
router.post(
  '/register',
  registrationAuthMiddleware,
  validateBody(registerStudentSchema),
  StudentController.registerStudent
);

// Student Profile / Account Status (Available to pending, active, and inactive students)
router.get('/me', studentAuthMiddleware, StudentController.getStudentProfile);

// Learning Curriculum & Content APIs (Strictly for ACTIVE students)
router.get('/home', activeStudentAuthMiddleware, StudentController.getStudentHome);
router.get('/subjects', activeStudentAuthMiddleware, StudentController.getSubjects);
router.get('/subjects/:id/chapters', activeStudentAuthMiddleware, StudentController.getChapters);
router.get('/chapters/:id/topics', activeStudentAuthMiddleware, StudentController.getTopics);
router.get('/topics/:id', activeStudentAuthMiddleware, StudentController.getTopicDetails);
router.get('/content/:id', activeStudentAuthMiddleware, StudentController.getContentDetails);

// Progress & Completion APIs (Strictly for ACTIVE students)
router.post('/content/:id/access', activeStudentAuthMiddleware, StudentController.logContentAccess);
router.post('/content/:id/complete', activeStudentAuthMiddleware, StudentController.markContentCompleted);
router.get('/recent-content', activeStudentAuthMiddleware, StudentController.getRecentContent);

export default router;
