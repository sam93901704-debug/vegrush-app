import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getDeliveryBoys } from '../controllers/adminOrderController';

const router = Router();

/**
 * GET /api/admin/delivery-boys
 * Protected route (admin auth) - Get list of active delivery boys
 * Returns: { data: DeliveryBoy[] }
 */
router.get(
  '/',
  authenticateUser,
  requireRole(['admin']),
  asyncHandler(getDeliveryBoys)
);

export default router;

