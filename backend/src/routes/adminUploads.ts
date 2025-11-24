import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { generatePresignedUpload, publicUrl, uploadImage } from '../services/storageService';
import { uploadImage as multerUpload } from '../middleware/upload';

const router = Router();

/**
 * POST /api/admin/uploads
 * Protected route (admin auth) - Generate upload URL for product images
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 * Body: { fileName: string, contentType: string }
 * Returns: { uploadUrl: string, filePath: string, publicUrl: string }
 */
router.post(
  '/',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // requireRole(['admin']), // TEMPORARILY COMMENTED OUT
  validateRequest({
    body: [
      body('fileName')
        .trim()
        .notEmpty()
        .withMessage('File name is required')
        .isString()
        .withMessage('File name must be a string')
        .isLength({ min: 1, max: 255 })
        .withMessage('File name must be between 1 and 255 characters'),
      body('contentType')
        .trim()
        .notEmpty()
        .withMessage('Content type is required')
        .isString()
        .withMessage('Content type must be a string')
        .matches(/^image\/(jpeg|jpg|png|gif|webp)$/i)
        .withMessage('Content type must be a valid image type (image/jpeg, image/png, image/gif, image/webp)'),
    ],
  }),
  asyncHandler(async (req, res) => {
    const { fileName, contentType } = req.body;

    // Generate presigned upload URL
    const { uploadUrl, filePath } = await generatePresignedUpload(fileName, contentType);

    // Get public URL for the file path
    const publicImageUrl = publicUrl(filePath);

    res.status(200).json({
      uploadUrl,
      filePath,
      publicUrl: publicImageUrl,
    });
  })
);

/**
 * POST /api/admin/upload-product-image
 * Protected route (admin auth) - Upload product image
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 * Accepts multipart/form-data with single file field "image"
 * Returns: { url: string }
 */
router.post(
  '/upload-product-image',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // requireRole(['admin']), // TEMPORARILY COMMENTED OUT
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

    // Get file details
    const buffer = req.file.buffer;
    const fileName = req.file.originalname;
    const contentType = req.file.mimetype;

    // Upload to Supabase storage
    const publicUrl = await uploadImage(buffer, fileName, contentType);

    res.status(200).json({
      url: publicUrl,
    });
  })
);

export default router;

