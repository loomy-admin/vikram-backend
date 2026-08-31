import { Router } from 'express';
import { bookController } from '../controllers/bookController';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', bookController.getAllBooks);
router.post('/', bookController.createBook);
router.get('/:id', bookController.getBook);
router.put('/:id', bookController.updateBook);
router.patch('/:id/toggle-status', bookController.toggleBookStatus);

export default router;
