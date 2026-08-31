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

  // Generate 6-digit OTP code
  const otpCode = config.isDev && config.otp.devStaticOtp ? config.otp.devStaticOtp : generate6DigitOtp();
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

  // In a production environment, plug in SMS (Twilio/SNS) or Email (Sendgrid/SES) service here
  await dispatchOtpNotification(normalizedIdentifier, channel, otpCode);

  logger.info(`Generated OTP for ${channel}: ${normalizedIdentifier} (DevCode: ${otpCode})`);

  return {
    identifier: normalizedIdentifier,
    channel,
    expiresInMinutes: config.otp.expiryMinutes,
    ...(config.otp.enableDevOtp && { devOtp: otpCode }),
  };
}

/**
 * Verifies the provided 6-digit OTP against the stored hashed record.
 * Invalidates OTP upon successful verification.
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

  // Check if max attempts reached
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

  // Mark record as verified and invalidate
  await record.update({ verifiedAt: new Date() });

  return { isValid: true };
}

/**
 * Dispatch notification via SMS or Email (extensible provider placeholder).
 */
async function dispatchOtpNotification(identifier: string, channel: OtpChannel, otp: string): Promise<void> {
  if (channel === OtpChannel.EMAIL) {
    logger.info(`[Email Service Mock] Sent OTP ${otp} to ${identifier}`);
  } else {
    logger.info(`[SMS Service Mock] Sent OTP ${otp} to ${identifier}`);
  }
}
