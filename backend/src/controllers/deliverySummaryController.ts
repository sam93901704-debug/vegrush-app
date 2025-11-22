import { type Response } from 'express';
import { db } from '../db';
import { RequestWithUser } from '../types';
import { Prisma } from '@prisma/client';

/**
 * GET /api/delivery/summary
 * Get delivery boy's summary statistics for today
 * Requires delivery auth
 * 
 * Returns:
 * - deliveredOrdersCount: number of orders delivered today
 * - totalCOD: total cash collected today (in paise)
 * - totalQR: total QR payments today (in paise)
 * - distanceTravelled: optional distance in km (placeholder for future)
 * - orders: array of today's delivered orders for CSV export
 */
export const getDeliverySummary = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const deliveryId = req.user!.id;

    // Get today's date range (start and end of day in UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's delivered orders assigned to this delivery boy
    const orders = await db.order.findMany({
      where: {
        assignedDeliveryId: deliveryId,
        status: 'delivered',
        deliveredAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        address: {
          select: {
            id: true,
            fullAddress: true,
            city: true,
            pincode: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        deliveredAt: 'desc',
      },
    });

    // Calculate statistics
    const deliveredOrdersCount = orders.length;
    
    // Calculate COD total (cash_on_delivery)
    const totalCOD = orders
      .filter((order) => order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'cod')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate QR total (qr_on_delivery or qr)
    const totalQR = orders
      .filter((order) => order.paymentMethod === 'qr_on_delivery' || order.paymentMethod === 'qr')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Distance travelled (placeholder - would require GPS tracking or route calculation)
    // For now, we'll return null or 0
    const distanceTravelled: number | null = null; // TODO: Implement distance calculation

    res.status(200).json({
      deliveredOrdersCount,
      totalCOD,
      totalQR,
      distanceTravelled,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        paymentMethod: order.paymentMethod,
        deliveredAt: order.deliveredAt,
        address: order.address,
        user: order.user,
        items: order.items,
      })),
    });
  } catch (error) {
    throw error;
  }
};

