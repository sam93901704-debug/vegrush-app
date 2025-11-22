import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, param, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import {
  getDeliveryOrders,
  getDeliveryOrderById,
  updateDeliveryOrderStatus,
} from '../controllers/deliveryOrderController';

const router = Router();

/**
 * GET /api/delivery/orders
 * Protected route (delivery auth) - Get orders assigned to delivery boy
 * Returns orders with status in [confirmed, out_for_delivery]
 */
router.get(
  '/',
  authenticateUser,
  requireRole(['delivery']),
  asyncHandler(getDeliveryOrders)
);

/**
 * GET /api/delivery/orders/:id
 * Protected route (delivery auth) - Get order detail by ID
 * Returns order only if assigned to this delivery boy
 */
router.get(
  '/:id',
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
  }),
  asyncHandler(getDeliveryOrderById)
);

/**
 * PATCH /api/delivery/orders/:id/status
 * Protected route (delivery auth) - Update order status
 * 
 * Body: { status: string } // allowed: picked, out_for_delivery, delivered
 * 
 * Flow:
 * - Validate assignment (order must be assigned to this delivery boy)
 * - Validate status transitions
 * - Update status and timestamps (pickedAt/outForDeliveryAt/deliveredAt)
 * - Notify user when status changes
 */
router.patch(
  '/:id/status',
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
        .isIn(['picked', 'out_for_delivery', 'delivered'])
        .withMessage('Invalid status. Allowed statuses: picked, out_for_delivery, delivered'),
      body('paymentType')
        .optional()
        .isIn(['cod', 'qr'])
        .withMessage('Payment type must be either "cod" or "qr"'),
    ],
  }),
  asyncHandler(updateDeliveryOrderStatus)
);

export default router;

