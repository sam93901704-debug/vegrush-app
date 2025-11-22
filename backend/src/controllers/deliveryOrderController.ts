import { type Response } from 'express';
import { db } from '../db';
import { Prisma } from '@prisma/client';
import { RequestWithUser } from '../types';
import * as orderService from '../services/orderService';
import * as notificationService from '../services/notificationService';

/**
 * GET /api/delivery/orders
 * Get orders assigned to delivery boy
 * Requires delivery auth
 * Returns orders with status in [confirmed, out_for_delivery]
 */
export const getDeliveryOrders = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Get delivery boy ID from req.user (authenticateUser attaches user info)
    const deliveryId = req.user!.id;

    // Fetch orders assigned to this delivery boy with status in [confirmed, out_for_delivery]
    // Note: "accepted" in requirements likely means "confirmed"
    const orders = await db.order.findMany({
      where: {
        assignedDeliveryId: deliveryId,
        status: {
          in: ['confirmed', 'picked', 'out_for_delivery'],
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
            label: true,
            fullAddress: true,
            city: true,
            pincode: true,
            latitude: true,
            longitude: true,
            isDefault: true,
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

    res.status(200).json({
      data: orders,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * GET /api/delivery/orders/:id
 * Get order detail by ID
 * Requires delivery auth
 * Returns order only if assigned to this delivery boy
 */
export const getDeliveryOrderById = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deliveryId = req.user!.id;

    if (!id) {
      res.status(400).json({
        error: true,
        message: 'Order ID is required',
      });
      return;
    }

    // Fetch order
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                imageUrl: true,
                price: true,
                unitType: true,
                unitValue: true,
              },
            },
          },
        },
        address: {
          select: {
            id: true,
            label: true,
            fullAddress: true,
            city: true,
            pincode: true,
            latitude: true,
            longitude: true,
            isDefault: true,
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
    });

    if (!order) {
      res.status(404).json({
        error: true,
        message: 'Order not found',
      });
      return;
    }

    // Verify order is assigned to this delivery boy
    if (order.assignedDeliveryId !== deliveryId) {
      res.status(403).json({
        error: true,
        message: 'Order is not assigned to you',
      });
      return;
    }

    res.status(200).json(order);
  } catch (error) {
    throw error;
  }
};

/**
 * PATCH /api/delivery/orders/:id/status
 * Update order status (delivery only)
 * Requires delivery auth
 * 
 * Body: { status: string } // allowed: picked, out_for_delivery, delivered
 * 
 * Flow:
 * - Validate assignment (order must be assigned to this delivery boy)
 * - Validate status transitions
 * - Update status and timestamps (pickedAt/outForDeliveryAt/deliveredAt)
 * - Notify user when status changes
 */
export const updateDeliveryOrderStatus = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentType } = req.body;
    const deliveryId = req.user!.id;

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

    // Validate allowed statuses for delivery
    const allowedStatuses = ['picked', 'out_for_delivery', 'delivered'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        error: true,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
      });
      return;
    }

    // Get existing order
    const existingOrder = await db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
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
    // Note: "picked" might be a custom status or alias for "out_for_delivery"
    // For now, we'll treat "picked" as equivalent to transitioning to "out_for_delivery"
    const targetStatus = status === 'picked' ? 'out_for_delivery' : status;

    if (!orderService.canTransition(existingOrder.status, targetStatus)) {
      const allowed = orderService.getAllowedTransitions(existingOrder.status);
      res.status(400).json({
        error: true,
        message: `Invalid status transition. Cannot change from "${existingOrder.status}" to "${targetStatus}". Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (final state)'}`,
      });
      return;
    }

    // Build update data with timestamps
    const updateData: Prisma.OrderUpdateInput & {
      pickedAt?: Date;
      outForDeliveryAt?: Date;
      deliveredAt?: Date;
    } = {
      status: targetStatus,
    };

    // Update payment method when marking as delivered
    if (status === 'delivered' && paymentType) {
      // Update payment method to reflect actual payment type (cod or qr)
      (updateData as any).paymentMethod = paymentType === 'qr' ? 'qr_on_delivery' : 'cash_on_delivery';
    }

    // Update timestamps based on status
    if (status === 'picked' && existingOrder.status !== 'out_for_delivery') {
      // Store pickedAt when transitioning to out_for_delivery
      (updateData as any).pickedAt = new Date();
      (updateData as any).outForDeliveryAt = new Date();
    } else if (status === 'out_for_delivery' && existingOrder.status !== 'out_for_delivery') {
      // Store outForDeliveryAt when transitioning to out_for_delivery
      (updateData as any).outForDeliveryAt = new Date();
    } else if (status === 'delivered' && existingOrder.status !== 'delivered') {
      // Store deliveredAt when transitioning to delivered
      (updateData as any).deliveredAt = new Date();
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: { id },
      data: updateData,
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
            label: true,
            fullAddress: true,
            city: true,
            pincode: true,
            latitude: true,
            longitude: true,
            isDefault: true,
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
    });

    // Notify user when status changes (non-blocking)
    if (targetStatus !== existingOrder.status) {
      // Get user details with order for notification
      const user = await db.user.findUnique({
        where: { id: existingOrder.userId },
        select: {
          id: true,
          name: true,
          phone: true,
          fcmToken: true,
        },
      });

      if (user) {
        notificationService
          .notifyUserOnStatusChange(
            user,
            {
              id: updatedOrder.id,
              orderNumber: updatedOrder.orderNumber,
              status: targetStatus,
              items: updatedOrder.items,
            },
            targetStatus
          )
          .catch((err) => {
            console.error('Failed to notify user:', err);
            // Don't fail the request if notification fails
          });
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    throw error;
  }
};

