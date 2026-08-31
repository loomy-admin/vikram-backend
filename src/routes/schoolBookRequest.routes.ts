import { Router } from 'express';
import { schoolBookRequestController } from '../controllers/schoolBookRequestController';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', schoolBookRequestController.getAllRequests);
router.post('/', schoolBookRequestController.createRequest);
router.patch('/:id/status', schoolBookRequestController.updateRequestStatus);

export default router;
