import { type Request, type Response } from 'express';
import { db } from '../db';
import { signJwt, type DeliveryJwtPayload } from '../utils/jwt';
import { RequestWithDelivery } from '../middleware/deliveryAuth';
import { Prisma } from '@prisma/client';
import * as notificationService from '../services/notificationService';

/**
 * Login delivery boy by phone
 * POST /api/delivery/login
 * 
 * Body: { phone: string, fcmToken?: string }
 * 
 * Flow:
 * - Find DeliveryBoy by phone
 * - Save/update fcmToken on DeliveryBoy record (if provided)
 * - Return JWT token with role=delivery
 * - Return delivery boy profile (including fcmToken)
 */
export const deliveryLogin = async (req: Request, res: Response): Promise<void> => {
  const { phone, fcmToken } = req.body;

  if (!phone) {
    res.status(400).json({
      error: true,
      message: 'Phone number is required',
    });
    return;
  }

  // Find delivery boy by phone
  let deliveryBoy = await db.deliveryBoy.findUnique({
    where: { phone: String(phone).trim() },
  });

  if (!deliveryBoy) {
    res.status(404).json({
      error: true,
      message: 'Delivery boy not found with this phone number',
    });
    return;
  }

  // Check if delivery boy is active
  if (!deliveryBoy.isActive) {
    res.status(403).json({
      error: true,
      message: 'Delivery boy account is inactive',
    });
    return;
  }

  // Save/update fcmToken if provided
  if (fcmToken !== undefined) {
    deliveryBoy = await db.deliveryBoy.update({
      where: { id: deliveryBoy.id },
      data: {
        fcmToken: fcmToken ? String(fcmToken).trim() || null : null, // Empty string becomes null
      },
    });
  }

  // Sign JWT token for delivery role
  const tokenPayload: Omit<DeliveryJwtPayload, 'iat' | 'exp'> = {
    deliveryId: deliveryBoy.id,
    phone: deliveryBoy.phone,
    role: 'delivery',
  };

  const token = signJwt(tokenPayload);

  res.status(200).json({
    success: true,
    token,
    delivery: {
      id: deliveryBoy.id,
      name: deliveryBoy.name,
      phone: deliveryBoy.phone,
      vehicleNumber: deliveryBoy.vehicleNumber,
      fcmToken: deliveryBoy.fcmToken || null,
      isActive: deliveryBoy.isActive,
    },
  });
};

/**
 * Get orders assigned to delivery boy
 * Returns orders with status 'confirmed' or 'out_for_delivery'
 */
export const getDeliveryOrders = async (req: RequestWithDelivery, res: Response): Promise<void> => {
  const deliveryId = req.deliveryBoy!.id;

  // Fetch orders assigned to this delivery boy
  const orders = await db.order.findMany({
    where: {
      assignedDeliveryId: deliveryId,
      status: {
        in: ['confirmed', 'out_for_delivery'],
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
              imageUrl: true,
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
          latitude: true,
          longitude: true,
          label: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.status(200).json({ orders });
};

/**
 * Update order status (delivery only)
 * Allowed transitions: confirmed -> out_for_delivery -> delivered
 */
export const updateOrderStatus = async (req: RequestWithDelivery, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const deliveryId = req.deliveryBoy!.id;

  if (!id) {
    res.status(400).json({
      error: true,
      message: 'Order ID is required',
    });
    return;
  }

  if (!status) {
    res.status(400).json({
      error: true,
      message: 'Status is required',
    });
    return;
  }

  // Validate status - delivery can only set out_for_delivery or delivered
  if (status !== 'out_for_delivery' && status !== 'delivered') {
    res.status(400).json({
      error: true,
      message: 'Invalid status. Delivery can only set status to "out_for_delivery" or "delivered"',
    });
    return;
  }

  // Check if order exists and is assigned to this delivery boy
  const existingOrder = await db.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    res.status(404).json({
      error: true,
      message: 'Order not found',
    });
    return;
  }

  // Verify order is assigned to this delivery boy
  if (existingOrder.assignedDeliveryId !== deliveryId) {
    res.status(403).json({
      error: true,
      message: 'Order is not assigned to you',
    });
    return;
  }

  // Validate status transitions
  if (status === 'out_for_delivery' && existingOrder.status !== 'confirmed') {
    res.status(400).json({
      error: true,
      message: `Cannot set status to "out_for_delivery". Current status is "${existingOrder.status}". Only orders with status "confirmed" can be marked as out for delivery.`,
    });
    return;
  }

  if (status === 'delivered' && existingOrder.status !== 'out_for_delivery') {
    res.status(400).json({
      error: true,
      message: `Cannot set status to "delivered". Current status is "${existingOrder.status}". Only orders with status "out_for_delivery" can be marked as delivered.`,
    });
    return;
  }

  try {
    const oldStatus = existingOrder.status;
    
    const order = await db.order.update({
      where: { id },
      data: {
        status,
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
            latitude: true,
            longitude: true,
            label: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            fcmToken: true,
          },
        },
      },
    });

    // Notify user if status changed (non-blocking)
    if (status !== oldStatus && order.user) {
      notificationService
        .notifyUserOnStatusChange(
          order.user,
          {
            id: order.id,
            orderNumber: order.orderNumber || existingOrder.orderNumber,
            status: status,
            items: order.items,
          },
          status
        )
        .catch((err) => {
          console.error('Failed to notify user:', err);
        });
    }

    res.status(200).json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        error: true,
        message: 'Failed to update order status',
        details: error.message,
      });
      return;
    }
    throw error;
  }
};

