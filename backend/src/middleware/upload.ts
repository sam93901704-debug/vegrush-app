import multer from 'multer';
import { type Request } from 'express';

/**
 * Configure multer for memory storage (stores file in memory as Buffer)
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate image types
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Only allow jpg, png, webp
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'));
  }
};

/**
 * Multer middleware for single file upload
 * Field name: "image"
 * Max file size: 5MB
 */
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

