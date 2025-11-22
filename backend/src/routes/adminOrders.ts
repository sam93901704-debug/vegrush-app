import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, query, param, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getOrders, getOrderById, updateOrderStatus, assignDeliveryBoy, getDeliveryBoys } from '../controllers/adminOrderController';

const router = Router();

/**
 * GET /api/admin/orders
 * Protected route (admin auth) - List orders with filters
 * Query params: page, limit, status, search (order_number/user_name/phone)
 */
router.get(
  '/',
  authenticateUser,
  requireRole(['admin']),
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
      query('status')
        .optional()
        .isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid status. Valid statuses: pending, confirmed, preparing, out_for_delivery, delivered, cancelled'),
      query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .trim(),
    ],
  }),
  asyncHandler(getOrders)
);

/**
 * GET /api/admin/orders/:id
 * Protected route (admin auth) - Get order by ID
 */
router.get(
  '/:id',
  authenticateUser,
  requireRole(['admin']),
  validateRequest({
    params: [param('id').notEmpty().withMessage('Order ID is required').isUUID().withMessage('Order ID must be a valid UUID')],
  }),
  asyncHandler(getOrderById)
);

/**
 * PATCH /api/admin/orders/:id/status
 * Protected route (admin auth) - Update order status and optionally assign delivery boy
 * Body: { status: string, assignedDeliveryId?: string }
 * 
 * Allowed statuses: confirmed, preparing, out_for_delivery, delivered, cancelled
 * Validates status transitions: placed -> accepted -> preparing -> out_for_delivery -> delivered
 */
router.patch(
  '/:id/status',
  authenticateUser,
  requireRole(['admin']),
  validateRequest({
    params: [param('id').notEmpty().withMessage('Order ID is required').isUUID().withMessage('Order ID must be a valid UUID')],
    body: [
      body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid status. Allowed statuses: confirmed, preparing, out_for_delivery, delivered, cancelled'),
      body('assignedDeliveryId')
        .optional()
        .isUUID()
        .withMessage('Assigned delivery ID must be a valid UUID'),
    ],
  }),
  asyncHandler(updateOrderStatus)
);

/**
 * POST /api/admin/orders/:id/assign
 * Protected route (admin auth) - Assign delivery boy to order
 * Body: { deliveryBoyId: string }
 * 
 * Action:
 * - Ensure order exists and in a state that allows assignment (confirmed or pending)
 * - Set assignedDeliveryId
 * - Update status to out_for_delivery (or keep as confirmed) - configurable via Settings
 * - Trigger notification to delivery boy (FCM push; if no token, fallback to SMS link)
 */
router.post(
  '/:id/assign',
  authenticateUser,
  requireRole(['admin']),
  validateRequest({
    params: [param('id').notEmpty().withMessage('Order ID is required').isUUID().withMessage('Order ID must be a valid UUID')],
    body: [
      body('deliveryBoyId')
        .notEmpty()
        .withMessage('Delivery boy ID is required')
        .isUUID()
        .withMessage('Delivery boy ID must be a valid UUID'),
    ],
  }),
  asyncHandler(assignDeliveryBoy)
);

export default router;

