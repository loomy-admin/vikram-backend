import { createApp } from './app';
import { config } from './config';
import { sequelize, ensureDatabaseExists } from './config/database';
import { logger } from './utils/logger';

// ─── Global Error Handlers ────────────────────────────────────────────────────
// Catch any unhandled promise rejections before they silently swallow errors.
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('[Process] Unhandled Promise Rejection:', reason);
  // In production, exit so the process manager (PM2, Docker, etc.) can restart
  if (config.isProd) {
    process.exit(1);
  }
});

// Catch any uncaught synchronous exceptions.
process.on('uncaughtException', (err: Error) => {
  logger.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});

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
    try {
      await sequelize.query("UPDATE `contents` SET `type` = 'WEB_LINK' WHERE `type` = 'IMAGE'");
      await sequelize.query("ALTER TABLE `contents` MODIFY COLUMN `type` ENUM('VIDEO','PDF','WEB_LINK') NOT NULL");
    } catch (e) {}

    try {
      await sequelize.query('ALTER TABLE `subjects` ADD COLUMN `imageUrl` TEXT NULL AFTER `description`');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE `chapters` ADD COLUMN `imageUrl` TEXT NULL AFTER `description`');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE `topics` ADD COLUMN `imageUrl` TEXT NULL AFTER `description`');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE `contents` ADD COLUMN `thumbnailUrl` TEXT NULL AFTER `url`');
    } catch (e) {}

    // Database sync: only run in development to prevent destructive schema changes in production.
    // In production, schema changes should be applied via controlled Sequelize migrations.
    if (config.isDev) {
      await sequelize.sync();
      logger.info(' Database schema synced (development only)');
    } else {
      logger.info(' Skipping sequelize.sync() in production — schema managed by migrations');
    }

    // Auto-seed default Super Admin users if no admin exists
    try {
      const { AdminUser } = await import('./models');
      const bcrypt = await import('bcrypt');
      
      const adminCount = await AdminUser.count();
      if (adminCount === 0) {
        logger.info('[Seeder] Seeding default admin users...');
        const hash1 = await bcrypt.hash('Admin123!', 10);
        const hash2 = await bcrypt.hash('admin123', 10);

        const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@platform.com';
        const adminPassword = process.env.ADMIN_SEED_PASSWORD || hash1;
        const seedHash = process.env.ADMIN_SEED_PASSWORD
          ? await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD, 10)
          : hash1;

        await AdminUser.bulkCreate([
          {
            name: 'Platform Administrator',
            email: adminEmail,
            passwordHash: seedHash,
            status: 'ACTIVE',
            role: 'SUPER_ADMIN',
          },
        ]);
        logger.info(`[Seeder] ✅ Default admin created: ${adminEmail} (set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD in .env to customize)`);
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
