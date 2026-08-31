import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';
import { s3Client } from '../services/storage.service';

const storage = config.storage.type === 's3'
  ? multerS3({
      s3: s3Client,
      bucket: config.aws.s3Bucket,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        const randomHex = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const sanitizedBase = path
          .basename(file.originalname, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        cb(null, `${sanitizedBase}-${randomHex}${ext}`);
      }
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, config.storage.uploadDir);
      },
      filename: (req, file, cb) => {
        const randomHex = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const sanitizedBase = path
          .basename(file.originalname, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        cb(null, `${sanitizedBase}-${randomHex}${ext}`);
      },
    });

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit to support long videos (30-60min+) without duration restrictions
  },
});
