import { config } from '../config';
import { logger } from '../utils/logger';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface StoredFileInfo {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

const s3Config: any = { region: config.aws.region };
if (config.aws.accessKeyId && config.aws.secretAccessKey) {
  s3Config.credentials = {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  };
}
export const s3Client = new S3Client(s3Config);

/**
 * Generates public URL for a stored file.
 */
export function getPublicUrl(filename: string): string {
  if (config.storage.type === 's3') {
    return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${filename}`;
  }
  return `${config.storage.baseUrl}/uploads/${filename}`;
}

/**
 * Deletes a file from storage.
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    if (config.storage.type === 's3') {
      const command = new DeleteObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: filename,
      });
      await s3Client.send(command);
      logger.info(`Deleted file from S3: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filename}:`, error);
    return false;
  }
}
