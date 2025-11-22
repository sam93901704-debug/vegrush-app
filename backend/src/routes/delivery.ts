import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, param, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { deliveryLogin, getDeliveryOrders, updateOrderStatus } from '../controllers/deliveryController';

const router = Router();

/**
 * POST /api/delivery/login
 * Public route - Login delivery boy by phone
 * Body: { phone: string, fcmToken?: string }
 */
router.post(
  '/login',
  validateRequest({
    body: [
      body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isString()
        .withMessage('Phone must be a string'),
      body('fcmToken')
        .optional()
        .isString()
        .withMessage('FCM token must be a string')
        .trim(),
    ],
  }),
  asyncHandler(deliveryLogin)
);

/**
 * GET /api/delivery/orders
 * Protected route (delivery auth) - Get orders assigned to delivery boy
 * Returns orders with status 'confirmed' or 'out_for_delivery'
 */
router.get('/orders', authenticateUser, requireRole(['delivery']), asyncHandler(getDeliveryOrders));

/**
 * PATCH /api/delivery/orders/:id/status
 * Protected route (delivery auth) - Update order status
 * Allowed statuses: out_for_delivery, delivered
 * Validates order is assigned to this delivery boy
 */
router.patch(
  '/orders/:id/status',
  authenticateUser,
  requireRole(['delivery']),
  validateRequest({
    params: [
      param('id')
        .notEmpty()
        .withMessage('Order ID is required')
        .isUUID()
        .withMessage('Order ID must be a valid UUID'),
    ],
    body: [
      body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['out_for_delivery', 'delivered'])
        .withMessage('Invalid status. Delivery can only set status to "out_for_delivery" or "delivered"'),
    ],
  }),
  asyncHandler(updateOrderStatus)
);

export default router;

