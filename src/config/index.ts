import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret-please-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
    enableDevOtp: process.env.ENABLE_DEV_OTP === 'true' || process.env.NODE_ENV !== 'production',
    devStaticOtp: process.env.DEV_STATIC_OTP || '123456',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 's3',
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'digital-learn-bucket',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};
