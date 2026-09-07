import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import * as StorageService from './services/storage.service';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// ─── Rate Limit Factories ─────────────────────────────────────────────────────
/**
 * Creates a rate limiter that returns an existing-style API error envelope
 * so the mobile app does not see a raw text/html 429 response.
 */
function makeRateLimiter(maxRequests: number, windowHours: number, message: string) {
  return rateLimit({
    windowMs: windowHours * 60 * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
  });
}

const otpRequestLimiter = makeRateLimiter(
  config.rateLimit.otpRequestPerHour,
  1,
  `Too many OTP requests. Maximum ${config.rateLimit.otpRequestPerHour} per hour. Please try again later.`
);

const otpVerifyLimiter = makeRateLimiter(
  config.rateLimit.otpVerifyPerHour,
  1,
  `Too many OTP verification attempts. Maximum ${config.rateLimit.otpVerifyPerHour} per hour. Please try again later.`
);

const adminLoginLimiter = makeRateLimiter(
  config.rateLimit.adminLoginPerHour,
  1,
  `Too many admin login attempts. Maximum ${config.rateLimit.adminLoginPerHour} per hour. Please try again later.`
);

// ─── CORS Origin Helper ───────────────────────────────────────────────────────
function getCorsOrigin() {
  const origin = config.cors.origin;
  if (!origin || origin === '*') return '*';
  // Support comma-separated list of domains: "https://admin.example.com,https://app.example.com"
  if (origin.includes(',')) {
    return origin.split(',').map((o) => o.trim());
  }
  return origin;
}

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
      origin: getCorsOrigin(),
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

  // 5. Apply rate limiters to sensitive auth routes BEFORE mounting the router
  //    These limits apply per IP address, per sliding hour window.
  app.use('/api/auth/student/request-otp', otpRequestLimiter);
  app.use('/api/auth/student/verify-otp', otpVerifyLimiter);
  app.use('/api/auth/admin/login', adminLoginLimiter);

  // 6. Serve local static uploads directory
  //    NOTE: /uploads is currently served without auth to support video streaming
  //    and direct PDF links from the mobile app. A signed-URL proxy endpoint
  //    (post-launch improvement) would add full authentication here.
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 7. Mount Root API Router
  app.use('/api', routes);

  // 8. Not Found (404) Handler
  app.use(notFoundHandler);

  // 9. Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;

