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

    // Sync database schema safely without destructive alter constraints
    await sequelize.sync();
    logger.info(' Database schema synced');

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
