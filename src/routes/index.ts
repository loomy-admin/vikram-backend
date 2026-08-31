import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import accessCodeRoutes from './accessCode.routes';
import adminRoutes from './admin.routes';
import publisherRoutes from './publisher.routes';
import bookRoutes from './book.routes';
import schoolBookRequestRoutes from './schoolBookRequest.routes';
import { sequelize } from '../config/database';

const router = Router();

// Health Check Endpoint (GET /api/health)
router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'healthy';
  try {
    await sequelize.query('SELECT 1');
  } catch (error) {
    dbStatus = 'unreachable';
  }

  return res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Mount Resource Routers
router.use('/auth', authRoutes);
router.use('/students', studentRoutes); // For /api/students/register
router.use('/student', studentRoutes);  // For /api/student/* (me, home, subjects, etc.)
router.use('/access-codes', accessCodeRoutes);
router.use('/admin', adminRoutes);
router.use('/publishers', publisherRoutes);
router.use('/books', bookRoutes);
router.use('/book-requests', schoolBookRequestRoutes);

export default router;
