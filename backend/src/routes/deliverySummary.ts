import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getDeliverySummary } from '../controllers/deliverySummaryController';

const router = Router();

/**
 * GET /api/delivery/summary
 * Protected route (delivery auth) - Get delivery boy's summary statistics for today
 * 
 * Returns:
 * - deliveredOrdersCount: number of orders delivered today
 * - totalCOD: total cash collected today (in paise)
 * - totalQR: total QR payments today (in paise)
 * - distanceTravelled: optional distance in km (placeholder for future)
 * - orders: array of today's delivered orders for CSV export
 */
router.get(
  '/',
  authenticateUser,
  requireRole(['delivery']),
  asyncHandler(getDeliverySummary)
);

export default router;

