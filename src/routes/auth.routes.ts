import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { adminAuthMiddleware } from '../middleware/auth.middleware';
import {
  requestOtpSchema,
  verifyOtpSchema,
  adminLoginSchema,
  changeAdminPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

import * as AdminController from '../controllers/admin.controller';
import * as ContentController from '../controllers/content.controller';

// Public endpoints for student registration dropdowns
router.get('/schools', AdminController.listSchools);
router.get('/classes', ContentController.listClasses);

// Student OTP Authentication Endpoints (Passwordless)
router.post('/student/request-otp', validateBody(requestOtpSchema), AuthController.requestStudentOtp);
router.post('/student/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyStudentOtp);

// Admin Authentication Endpoints
router.post('/admin/login', validateBody(adminLoginSchema), AuthController.adminLogin);
router.post(
  '/admin/change-password',
  adminAuthMiddleware,
  validateBody(changeAdminPasswordSchema),
  AuthController.changeAdminPassword
);
router.get('/admin/me', adminAuthMiddleware, AuthController.getAdminProfile);

export default router;
