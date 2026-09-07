import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';

// Configure Cloudinary instance
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

/**
 * Uploads an image file to Cloudinary with fallback to local storage if API secret mismatch occurs.
 */
export async function uploadImageToCloudinary(
  filePath: string,
  folder = 'student_learning_platform/subjects'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });

    // Remove local temp file after successful upload
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanErr) {
      logger.warn('Failed to clean up temp upload file:', cleanErr);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    logger.error('Cloudinary upload error:', error);

    // If Cloudinary authentication fails (e.g. secret mismatch), fallback to local storage URL so user never gets blocked!
    const filename = filePath.split(/[\\/]/).pop() || 'image.png';
    const localUrl = `${config.storage.baseUrl}/uploads/${filename}`;

    logger.warn(`Using local file URL fallback due to Cloudinary error: ${localUrl}`);

    return {
      url: localUrl,
      publicId: `local_${filename}`,
    };
  }
}
