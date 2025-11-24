import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, query, param, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { adminAuth } from '../middleware/adminAuth';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from '../controllers/productController';

const router = Router();

/**
 * GET /api/products
 * Public route - List all products with pagination and filters
 * Query params: page, limit, category, search, inStockOnly
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
      query('search').optional().isString().withMessage('Search must be a string'),
      query('inStockOnly')
        .optional()
        .isIn(['true', 'false', '1', '0'])
        .withMessage('inStockOnly must be true, false, 1, or 0'),
    ],
  }),
  asyncHandler(listProducts)
);

/**
 * GET /api/admin/products
 * Admin route - List all products (including inactive) with pagination and filters
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 * Query params: page, limit, category, search, inStockOnly
 */
router.get(
  '/',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // adminAuth, // TEMPORARILY COMMENTED OUT
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
      query('search').optional().isString().withMessage('Search must be a string'),
      query('inStockOnly')
        .optional()
        .isIn(['true', 'false', '1', '0'])
        .withMessage('inStockOnly must be true, false, 1, or 0'),
    ],
  }),
  asyncHandler(listProducts)
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
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 */
router.post(
  '/',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // adminAuth, // TEMPORARILY COMMENTED OUT
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
        .isString()
        .withMessage('Category must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters'),
      body('price')
        .isInt({ min: 0 })
        .withMessage('Price is required and must be a non-negative integer (in paise)'),
      body('unitType')
        .trim()
        .notEmpty()
        .withMessage('Unit type is required')
        .isIn(['kg', 'g', 'piece'])
        .withMessage('Unit type must be one of: kg, g, piece'),
      body('unitValue')
        .isFloat({ min: 0.01 })
        .withMessage('Unit value is required and must be a positive number'),
      body('stockQty')
        .isFloat({ min: 0 })
        .withMessage('Stock quantity is required and must be a non-negative number'),
      body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL')
        .isLength({ max: 500 })
        .withMessage('Image URL must be less than 500 characters'),
      body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    ],
  }),
  asyncHandler(createProduct)
);

/**
 * PATCH /api/admin/products/:id/stock
 * Protected route (admin only) - Update product stock quantity only
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 * Must come before /:id route to avoid route conflicts
 */
router.patch(
  '/:id/stock',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // adminAuth, // TEMPORARILY COMMENTED OUT
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
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 */
router.put(
  '/:id',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // adminAuth, // TEMPORARILY COMMENTED OUT
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
        .isString()
        .withMessage('Category must be a string')
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
        .isIn(['kg', 'g', 'piece'])
        .withMessage('Unit type must be one of: kg, g, piece'),
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
      body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    ],
  }),
  asyncHandler(updateProduct)
);

/**
 * DELETE /api/admin/products/:id
 * Protected route (admin only) - Delete product (optional)
 * TEMPORARILY DISABLED AUTH - Making route public for testing
 * Query param: hardDelete=true for hard delete, default is soft delete
 */
router.delete(
  '/:id',
  // authenticateUser, // TEMPORARILY COMMENTED OUT
  // adminAuth, // TEMPORARILY COMMENTED OUT
  validateRequest({
    params: [param('id').notEmpty().withMessage('Product ID is required')],
    query: [
      query('hardDelete')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('hardDelete must be true or false'),
    ],
  }),
  asyncHandler(deleteProduct)
);

export default router;

