import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// ─── Fail-fast checks in production ─────────────────────────────────────────
// Missing critical secrets in production must crash immediately rather than
// silently using an insecure fallback that would compromise all users.
if (isProd) {
  const required = ['JWT_SECRET', 'DB_NAME', 'DB_USER'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[Config] FATAL: Missing required environment variables in production: ${missing.join(', ')}. Refusing to start.`
    );
  }
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('[Config] WARNING: CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET not set. Cloudinary uploads will fail.');
  }
}

// ─── OTP dev mode ────────────────────────────────────────────────────────────
// Dev OTP (static code 123456) is automatically disabled in production
// regardless of what ENABLE_DEV_OTP is set to. This prevents shipping the
// backdoor to real users even if someone forgets to flip the env var.
const enableDevOtpRaw = process.env.ENABLE_DEV_OTP === 'true';
const enableDevOtp = enableDevOtpRaw && !isProd;

if (enableDevOtpRaw && isProd) {
  console.warn('[Config] WARNING: ENABLE_DEV_OTP=true was set but NODE_ENV=production — ignoring. Real OTP delivery will be used.');
}

export const config = {
  env: nodeEnv,
  isDev: nodeEnv === 'development',
  isProd,
  port: parseInt(process.env.PORT || '5000', 10),

  jwt: {
    // In production: fail-fast above ensures JWT_SECRET is set.
    // In development: a clearly-labeled fallback avoids blocking local work.
    secret: process.env.JWT_SECRET || (isProd ? '' : 'DEV_ONLY_fallback_jwt_secret_do_not_use_in_prod'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
    enableDevOtp, // Automatically false in production
    devStaticOtp: process.env.DEV_STATIC_OTP || '123456',
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },

  cors: {
    // In production CORS_ORIGIN must be the specific admin domain.
    // Wildcard '*' is NOT acceptable for authenticated production APIs.
    origin: process.env.CORS_ORIGIN || (isProd ? '' : '*'),
  },

  // No hardcoded credentials — all values come from environment variables only.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    url: process.env.CLOUDINARY_URL || '',
  },

  // Email / SMTP for OTP email delivery
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  },

  // Twilio SMS for OTP phone delivery
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },

  // Rate limiting (per IP, per hour)
  rateLimit: {
    otpRequestPerHour: parseInt(process.env.RATE_OTP_REQUEST_PER_HOUR || '5', 10),
    otpVerifyPerHour: parseInt(process.env.RATE_OTP_VERIFY_PER_HOUR || '10', 10),
    adminLoginPerHour: parseInt(process.env.RATE_ADMIN_LOGIN_PER_HOUR || '20', 10),
  },

  // Database connection pool
  db: {
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    poolMin: parseInt(process.env.DB_POOL_MIN || '0', 10),
    poolAcquire: parseInt(process.env.DB_POOL_ACQUIRE || '20000', 10),
    poolIdle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
};
