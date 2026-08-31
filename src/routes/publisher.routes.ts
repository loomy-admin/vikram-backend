import { Router } from 'express';
import { publisherController } from '../controllers/publisherController';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(adminAuthMiddleware); // Protect all routes

router.get('/', publisherController.getAllPublishers);
router.post('/', publisherController.createPublisher);
router.get('/:id', publisherController.getPublisher);
router.put('/:id', publisherController.updatePublisher);
router.patch('/:id/toggle-status', publisherController.togglePublisherStatus);

export default router;
