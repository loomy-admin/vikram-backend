import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import * as StorageService from './services/storage.service';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // 1. Security & Header Middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. CORS Configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Request Logging
  if (config.env !== 'test') {
    app.use(morgan(config.isDev ? 'dev' : 'combined'));
  }

  // 4. Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 5. Serve local static uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 6. Mount Root API Router
  app.use('/api', routes);

  // 7. Not Found (404) Handler
  app.use(notFoundHandler);

  // 8. Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
