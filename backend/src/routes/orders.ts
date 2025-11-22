import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, query, param, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { createOrder, getOrderById, getUserOrders } from '../controllers/orderController';

const router = Router();

/**
 * POST /api/orders
 * Protected route (user auth) - Create new order
 * Body: { items: [{ productId, qty }], addressId? }
 */
router.post(
  '/',
  authenticateUser,
  requireRole(['user']),
  validateRequest({
    body: [
      body('items')
        .isArray({ min: 1 })
        .withMessage('Items array is required and must not be empty'),
      body('items.*.productId')
        .notEmpty()
        .withMessage('Product ID is required for each item')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      body('items.*.qty')
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be a positive number'),
      body('addressId')
        .optional()
        .isUUID()
        .withMessage('Address ID must be a valid UUID'),
    ],
  }),
  asyncHandler(createOrder)
);

/**
 * GET /api/orders
 * Protected route (user auth) - Get user's own orders
 * Query params: page?, limit?
 * Returns: { data: Order[], pagination: { page, limit, total, totalPages } }
 */
router.get(
  '/',
  authenticateUser,
  requireRole(['user']),
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
    ],
  }),
  asyncHandler(getUserOrders)
);

/**
 * GET /api/orders/:id
 * Protected route (user or admin) - Get order by ID
 * User can only view their own orders, admin can view any order
 */
router.get(
  '/:id',
  authenticateUser,
  requireRole(['user', 'admin']),
  validateRequest({
    params: [param('id').notEmpty().withMessage('Order ID is required').isUUID().withMessage('Order ID must be a valid UUID')],
  }),
  asyncHandler(getOrderById)
);

export default router;

