import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadImage } from '../services/storageService';
import { uploadImage as multerUpload } from '../middleware/upload';

const router = Router();

/**
 * POST /api/admin/upload-product-image
 * Upload product image to Supabase Storage
 * Accepts multipart/form-data with single file field "image"
 * Returns: { url: string } - Public URL of uploaded image
 */
router.post(
  '/upload-product-image',
  multerUpload.single('image'),
  asyncHandler(async (req, res) => {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        error: true,
        message: 'Image file is required',
      });
      return;
    }

    // Validate file type (already validated by multer, but double-check)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        error: true,
        message: 'Invalid file type. Only JPG, PNG, and WEBP images are allowed.',
      });
      return;
    }

    try {
      // Get file details
      const buffer = req.file.buffer;
      const fileName = req.file.originalname;
      const contentType = req.file.mimetype;

      // Upload to Supabase storage
      const publicUrl = await uploadImage(buffer, fileName, contentType);

      res.status(200).json({
        url: publicUrl,
      });
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      res.status(500).json({
        error: true,
        message: errorMessage,
      });
    }
  })
);

export default router;
