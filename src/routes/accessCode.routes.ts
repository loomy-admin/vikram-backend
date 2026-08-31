import { Router } from 'express';
import * as AccessCodeController from '../controllers/accessCode.controller';
import { validateBody } from '../middleware/validate.middleware';
import { studentAuthMiddleware } from '../middleware/auth.middleware';
import { activateAccessCodeSchema } from '../validators/accessCode.validator';

const router = Router();

// Student 10-digit Access Code Activation
router.post(
  '/activate',
  studentAuthMiddleware,
  validateBody(activateAccessCodeSchema),
  AccessCodeController.activateAccessCode
);

export default router;
