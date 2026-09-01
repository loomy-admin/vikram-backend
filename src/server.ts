import { createApp } from './app';
import { config } from './config';
import { sequelize, ensureDatabaseExists } from './config/database';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    const app = createApp();

    // Ensure database exists before connecting with Sequelize
    await ensureDatabaseExists();

    // Verify database connectivity
    await sequelize.authenticate();
    logger.info(' Connected to MySQL via Sequelize');

    // Ensure chapterId column exists in contents table if migrating existing database
    try {
      await sequelize.query('ALTER TABLE `contents` ADD COLUMN `chapterId` INT NULL AFTER `id`');
    } catch (e) {
      // Column already exists or table will be created by sync
    }

    try {
      await sequelize.query('ALTER TABLE `students` ADD COLUMN `city` VARCHAR(100) NULL AFTER `phone`');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE `students` ADD COLUMN `state` VARCHAR(100) NULL AFTER `city`');
    } catch (e) {}

    // Sync database schema safely without destructive alter constraints
    await sequelize.sync();
    logger.info(' Database schema synced');

    // Auto-seed default Super Admin users if no admin exists
    try {
      const { AdminUser } = await import('./models');
      const bcrypt = await import('bcrypt');
      
      const adminCount = await AdminUser.count();
      if (adminCount === 0) {
        logger.info('[Seeder] Seeding default admin users...');
        const hash1 = await bcrypt.hash('Admin123!', 10);
        const hash2 = await bcrypt.hash('admin123', 10);

        await AdminUser.bulkCreate([
          {
            name: 'Platform Administrator',
            email: 'admin@platform.com',
            passwordHash: hash1,
            status: 'ACTIVE',
            role: 'SUPER_ADMIN',
          },
          {
            name: 'System Admin',
            email: 'admin@example.com',
            passwordHash: hash2,
            status: 'ACTIVE',
            role: 'SUPER_ADMIN',
          },
        ]);
        logger.info('[Seeder] ✅ Default admin users created successfully (admin@platform.com & admin@example.com)');
      }
    } catch (seedErr) {
      logger.warn('[Seeder] Note: Skipping admin seeding:', seedErr);
    }

    // Start Express server
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(` Student Learning Platform Backend is running on port ${config.port}`);
      logger.info(` Environment: ${config.env}`);
      logger.info(` Base URL: http://localhost:${config.port}/api`);
      logger.info(` Health Check: http://localhost:${config.port}/api/health`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('Sequelize disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start backend application:', error);
    await sequelize.close();
    process.exit(1);
  }
}

bootstrap();
