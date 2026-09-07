import bcrypt from 'bcrypt';
import { OtpChannel } from '../types/enums';
import { OtpRecord } from '../models';
import { Op } from 'sequelize';
import { config } from '../config';
import { generate6DigitOtp } from '../utils/codeGenerator';
import { logger } from '../utils/logger';
import { ERROR_CODES } from '../constants';

export interface RequestOtpResult {
  identifier: string;
  channel: OtpChannel;
  expiresInMinutes: number;
  devOtp?: string; // Only returned when config.otp.enableDevOtp is true
}

export interface VerifyOtpResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Generates and stores a secure, hashed 6-digit OTP for the given identifier (email or phone).
 */
export async function requestOtp(identifier: string, channel: OtpChannel): Promise<RequestOtpResult> {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  // Check recent OTP record for cooldown limitation
  const recentOtp = await OtpRecord.findOne({
    where: {
      identifier: normalizedIdentifier,
      createdAt: {
        [Op.gte]: new Date(Date.now() - config.otp.resendCooldownSeconds * 1000),
      },
    },
    order: [['createdAt', 'DESC']],
  });

  if (recentOtp && !config.isDev) {
    const waitSeconds = Math.ceil(
      (recentOtp.createdAt.getTime() + config.otp.resendCooldownSeconds * 1000 - Date.now()) / 1000
    );
    throw {
      statusCode: 429,
      code: ERROR_CODES.OTP_RESEND_WAIT,
      message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
    };
  }

  // Generate 6-digit OTP code (uses 123456 when dev OTP is enabled)
  const otpCode = config.otp.enableDevOtp && config.otp.devStaticOtp ? config.otp.devStaticOtp : generate6DigitOtp();
  const otpHash = await bcrypt.hash(otpCode, 10);
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  // Save hashed OTP record to database
  await OtpRecord.create({
    identifier: normalizedIdentifier,
    channel,
    otpHash,
    attempts: 0,
    maxAttempts: config.otp.maxAttempts,
    expiresAt,
  });

  // Dispatch OTP via real provider (or log in dev mode)
  await dispatchOtpNotification(normalizedIdentifier, channel, otpCode);

  // IMPORTANT: Never log the actual OTP value in production
  if (config.isDev) {
    logger.info(`[OTP Dev] Generated OTP for ${channel}: ${normalizedIdentifier} — Code: ${otpCode}`);
  } else {
    logger.info(`[OTP] Dispatched OTP for ${channel}: ${normalizedIdentifier}`);
  }

  return {
    identifier: normalizedIdentifier,
    channel,
    expiresInMinutes: config.otp.expiryMinutes,
    // Only expose OTP in API response when dev mode is explicitly enabled
    ...(config.otp.enableDevOtp && { devOtp: otpCode }),
  };
}

/**
 * Verifies the provided 6-digit OTP against the stored hashed record.
 * Invalidates OTP upon successful verification (single-use enforcement).
 */
export async function verifyOtp(identifier: string, otp: string): Promise<VerifyOtpResult> {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  // Find the latest non-verified OTP record for this identifier
  const record = await OtpRecord.findOne({
    where: {
      identifier: normalizedIdentifier,
      verifiedAt: null,
    },
    order: [['createdAt', 'DESC']],
  });

  if (!record) {
    return {
      isValid: false,
      errorCode: ERROR_CODES.OTP_INVALID,
      errorMessage: 'No active OTP request found. Please request a new OTP.',
    };
  }

  // Check if OTP has expired
  if (new Date() > record.expiresAt) {
    return {
      isValid: false,
      errorCode: ERROR_CODES.OTP_EXPIRED,
      errorMessage: 'The OTP has expired. Please request a new one.',
    };
  }

  // Check if max attempts reached (brute-force protection)
  if (record.attempts >= record.maxAttempts) {
    return {
      isValid: false,
      errorCode: ERROR_CODES.OTP_MAX_ATTEMPTS_EXCEEDED,
      errorMessage: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  // Compare OTP with bcrypt hash
  const isMatch = await bcrypt.compare(otp, record.otpHash);

  if (!isMatch) {
    // Increment attempt counter
    await record.increment('attempts', { by: 1 });

    const remainingAttempts = record.maxAttempts - (record.attempts + 1);
    return {
      isValid: false,
      errorCode: ERROR_CODES.OTP_INVALID,
      errorMessage: `Invalid OTP code. ${remainingAttempts} attempts remaining.`,
    };
  }

  // Mark record as verified and invalidate (single-use enforcement)
  await record.update({ verifiedAt: new Date() });

  return { isValid: true };
}

/**
 * Dispatch OTP notification via real providers.
 *
 * EMAIL delivery: Uses Nodemailer with SMTP (Gmail, SendGrid SMTP, AWS SES SMTP, etc.)
 *   Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * SMS delivery: Uses Twilio REST API
 *   Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * In development with ENABLE_DEV_OTP=true, real dispatch is skipped.
 * In production (NODE_ENV=production), ENABLE_DEV_OTP is ignored and real delivery is used.
 */
async function dispatchOtpNotification(identifier: string, channel: OtpChannel, otp: string): Promise<void> {
  // Development mode: skip real dispatch, OTP already logged by caller
  if (config.otp.enableDevOtp) {
    return;
  }

  if (channel === OtpChannel.EMAIL) {
    await sendEmailOtp(identifier, otp);
  } else {
    await sendSmsOtp(identifier, otp);
  }
}

/**
 * Send OTP via email using Nodemailer (SMTP).
 *
 * Setup instructions:
 * 1. For Gmail: enable 2FA, generate an App Password at https://myaccount.google.com/apppasswords
 *    SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_SECURE=false
 *    SMTP_USER=youraddress@gmail.com, SMTP_PASS=<app-password>
 *
 * 2. For SendGrid SMTP:
 *    SMTP_HOST=smtp.sendgrid.net, SMTP_PORT=587, SMTP_SECURE=false
 *    SMTP_USER=apikey, SMTP_PASS=<sendgrid-api-key>
 *
 * 3. For AWS SES SMTP:
 *    SMTP_HOST=email-smtp.<region>.amazonaws.com, SMTP_PORT=587, SMTP_SECURE=false
 *    SMTP_USER=<SES SMTP username>, SMTP_PASS=<SES SMTP password>
 */
async function sendEmailOtp(email: string, otp: string): Promise<void> {
  const { host, port, secure, user, pass, from } = config.email;

  if (!user || !pass) {
    logger.warn('[OTP Email] SMTP credentials not configured. Set SMTP_USER + SMTP_PASS in .env to enable email OTP delivery.');
    // Do not throw — graceful degradation allows dev testing without crashing
    return;
  }

  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Shiksha Learning" <${from || user}>`,
      to: email,
      subject: 'Your Shiksha Verification Code',
      text: `Your OTP code is: ${otp}\n\nThis code expires in ${config.otp.expiryMinutes} minutes.\nDo not share this code with anyone.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
          <h2 style="color:#1e293b;margin-bottom:4px;">Shiksha Learning</h2>
          <p style="color:#64748b;margin-bottom:24px;font-size:14px;">Student Learning Platform</p>
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;text-align:center;">
            <p style="color:#374151;margin-bottom:16px;">Your verification code is:</p>
            <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb;margin:16px 0;">${otp}</div>
            <p style="color:#6b7280;font-size:13px;margin-top:16px;">
              This code expires in <strong>${config.otp.expiryMinutes} minutes</strong>.
            </p>
            <p style="color:#ef4444;font-size:12px;margin-top:8px;">⚠️ Do not share this code with anyone.</p>
          </div>
          <p style="color:#9ca3af;font-size:11px;margin-top:16px;text-align:center;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    logger.info(`[OTP Email] OTP email dispatched successfully to ${email}`);
  } catch (err: any) {
    logger.error(`[OTP Email] Failed to send OTP email to ${email}: ${err?.message || err}`);
    throw {
      statusCode: 500,
      code: 'OTP_DELIVERY_FAILED',
      message: 'Failed to send OTP email. Please try again or contact support.',
    };
  }
}

/**
 * Send OTP via SMS using the Twilio REST API (no SDK required).
 *
 * Setup instructions:
 * 1. Sign up at https://www.twilio.com/try-twilio
 * 2. From the Twilio Console, get your Account SID and Auth Token
 * 3. Purchase a phone number with SMS capability
 * 4. Set environment variables:
 *    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *    TWILIO_AUTH_TOKEN=your_auth_token_here
 *    TWILIO_FROM_NUMBER=+1xxxxxxxxxx
 *
 * Phone numbers in messages must be in E.164 format: +91XXXXXXXXXX (India)
 */
async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const { accountSid, authToken, fromNumber } = config.twilio;

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn('[OTP SMS] Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env to enable SMS OTP.');
    // Do not throw — graceful degradation
    return;
  }

  try {
    const https = await import('https');
    const messageBody = `Your Shiksha OTP is: ${otp}. Valid for ${config.otp.expiryMinutes} min. Do not share.`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const bodyData = new URLSearchParams({ From: fromNumber, To: phone, Body: messageBody }).toString();

    await new Promise<void>((resolve, reject) => {
      const req = https.default.request(
        {
          hostname: 'api.twilio.com',
          path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(bodyData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`Twilio API returned ${res.statusCode}: ${data}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(bodyData);
      req.end();
    });

    logger.info(`[OTP SMS] OTP SMS dispatched successfully to ${phone}`);
  } catch (err: any) {
    logger.error(`[OTP SMS] Failed to send OTP SMS to ${phone}: ${err?.message || err}`);
    throw {
      statusCode: 500,
      code: 'OTP_DELIVERY_FAILED',
      message: 'Failed to send OTP SMS. Please try again or contact support.',
    };
  }
}
