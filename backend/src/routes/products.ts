import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, query, param, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
} from '../controllers/productController';

const router = Router();

/**
 * GET /api/products
 * Public route - Get all products with pagination and filters
 * Query params: page, limit, category, in_stock
 */
router.get(
  '/',
  validateRequest({
    query: [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      query('category').optional().isString().withMessage('Category must be a string'),
      query('in_stock')
        .optional()
        .isIn(['true', 'false', '1', '0'])
        .withMessage('in_stock must be true, false, 1, or 0'),
    ],
  }),
  asyncHandler(getProducts)
);

/**
 * GET /api/products/:id
 * Public route - Get single product by ID
 */
router.get(
  '/:id',
  validateRequest({
    params: [param('id').notEmpty().withMessage('Product ID is required')],
  }),
  asyncHandler(getProductById)
);

/**
 * POST /api/admin/products
 * Protected route (admin only) - Create new product
 */
router.post(
  '/',
  authenticateUser,
  requireRole(['admin']),
  validateRequest({
    body: [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Name must be between 1 and 200 characters'),
      body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
      body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters'),
      body('price')
        .isInt({ min: 0 })
        .withMessage('Price must be a non-negative integer (in paise)'),
      body('unitType')
        .trim()
        .notEmpty()
        .withMessage('Unit type is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Unit type must be between 1 and 50 characters'),
      body('unitValue')
        .isFloat({ min: 0.01 })
        .withMessage('Unit value must be a positive number'),
      body('stockQty')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Stock quantity must be a non-negative number'),
      body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL')
        .isLength({ max: 500 })
        .withMessage('Image URL must be less than 500 characters'),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    ],
  }),
  asyncHandler(createProduct)
);

/**
 * PATCH /api/admin/products/:id/stock
 * Protected route (admin only) - Update product stock quantity only
 * Must come before /:id route to avoid route conflicts
 */
router.patch(
  '/:id/stock',
  authenticateUser,
  requireRole(['admin']),
  validateRequest({
    params: [param('id').notEmpty().withMessage('Product ID is required')],
    body: [
      body('stockQty')
        .isFloat({ min: 0 })
        .withMessage('Stock quantity is required and must be a non-negative number'),
    ],
  }),
  asyncHandler(updateProductStock)
);

/**
 * PUT /api/admin/products/:id
 * Protected route (admin only) - Update product
 */
router.put(
  '/:id',
  authenticateUser,
  requireRole(['admin']),
  validateRequest({
    params: [param('id').notEmpty().withMessage('Product ID is required')],
    body: [
      body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ min: 1, max: 200 })
        .withMessage('Name must be between 1 and 200 characters'),
      body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
      body('category')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category cannot be empty')
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters'),
      body('price')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Price must be a non-negative integer (in paise)'),
      body('unitType')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Unit type cannot be empty')
        .isLength({ min: 1, max: 50 })
        .withMessage('Unit type must be between 1 and 50 characters'),
      body('unitValue')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Unit value must be a positive number'),
      body('stockQty')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Stock quantity must be a non-negative number'),
      body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL')
        .isLength({ max: 500 })
        .withMessage('Image URL must be less than 500 characters'),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    ],
  }),
  asyncHandler(updateProduct)
);

export default router;

