import { type Request, type Response } from 'express';
import { RequestWithUser } from '../types';
import { db } from '../db';
import { Prisma } from '@prisma/client';
import * as orderService from '../services/orderService';
import * as assignmentService from '../services/assignmentService';
import * as notificationService from '../services/notificationService';

/**
 * Get list of orders (admin only)
 * GET /api/admin/orders
 * 
 * Query params:
 * - status?: string - Filter by order status
 * - page?: number - Page number (default: 1)
 * - limit?: number - Items per page (default: 20)
 * - search?: string - Search by order number, user name, or phone
 * 
 * Returns: { data: Order[], pagination: { page, limit, total } }
 */
export const getOrders = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Validate pagination
    if (page < 1) {
      res.status(400).json({
        error: true,
        message: 'Page must be greater than 0',
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        error: true,
        message: 'Limit must be between 1 and 100',
      });
      return;
    }

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        error: true,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Get orders from service
    const result = await orderService.listOrders({
      page,
      limit,
      status,
      search,
    });

    res.status(200).json(result);
  } catch (error) {
    throw error;
  }
};

/**
 * Get single order by ID (admin only)
 * GET /api/admin/orders/:id
 */
export const getOrderById = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: true,
        message: 'Order ID is required',
      });
      return;
    }

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
              },
            },
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
        address: {
          select: {
            id: true,
            label: true,
            fullAddress: true,
            city: true,
            pincode: true,
            isDefault: true,
          },
        },
        assignedDelivery: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
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

    res.status(200).json(order);
  } catch (error) {
    throw error;
  }
};

/**
 * Update order status (admin only)
 * PATCH /api/admin/orders/:id/status
 * 
 * Body: { status: string, assignedDeliveryId?: string }
 * Allowed statuses: confirmed, preparing, out_for_delivery, delivered, cancelled
 * 
 * Validates status transitions: placed -> accepted -> preparing -> out_for_delivery -> delivered
 */
export const updateOrderStatus = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assignedDeliveryId } = req.body;

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

    // Validate status - admin allowed statuses
    const allowedStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
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
    });

    if (!existingOrder) {
      res.status(404).json({
        error: true,
        message: 'Order not found',
      });
      return;
    }

    // Validate status transition using service
    if (!orderService.canTransition(existingOrder.status, status)) {
      const allowed = orderService.getAllowedTransitions(existingOrder.status);
      res.status(400).json({
        error: true,
        message: `Invalid status transition. Cannot change from "${existingOrder.status}" to "${status}". Valid transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (final state)'}`,
      });
      return;
    }

    // Validate delivery boy if assigned
    if (assignedDeliveryId) {
      const deliveryBoy = await db.deliveryBoy.findUnique({
        where: { id: assignedDeliveryId },
      });

      if (!deliveryBoy) {
        res.status(404).json({
          error: true,
          message: 'Delivery boy not found',
        });
        return;
      }

      if (!deliveryBoy.isActive) {
        res.status(400).json({
          error: true,
          message: 'Delivery boy is not active',
        });
        return;
      }
    }

    // Use service to transition order (handles status validation and timestamps)
    const actor = {
      id: req.user!.id,
      role: req.user!.role || 'admin',
    };

    const oldStatus = existingOrder.status;

    let order;
    try {
      // Transition order using service
      order = await orderService.transitionOrder(id, status, actor);

      // If assignedDeliveryId is provided, update it separately
      if (assignedDeliveryId !== undefined && assignedDeliveryId !== order.assignedDeliveryId) {
        // Get delivery boy details for notification
        const deliveryBoy = await db.deliveryBoy.findUnique({
          where: { id: assignedDeliveryId },
          select: {
            id: true,
            name: true,
            phone: true,
            fcmToken: true,
          },
        });

        if (deliveryBoy) {
          order = await db.order.update({
            where: { id },
            data: { assignedDeliveryId },
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
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
              address: {
                select: {
                  id: true,
                  label: true,
                  fullAddress: true,
                  city: true,
                  pincode: true,
                  isDefault: true,
                },
              },
            },
          });

          // Notify delivery boy of assignment (non-blocking)
          notificationService
            .notifyDeliveryAssigned(deliveryBoy, {
              id: order.id,
              orderNumber: order.orderNumber,
              user: order.user ? {
                name: order.user.name ?? null,
                phone: order.user.phone,
              } : undefined,
            })
            .catch((err) => {
              console.error('Failed to notify delivery boy:', err);
            });
        } else {
          order = await db.order.update({
            where: { id },
            data: { assignedDeliveryId },
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
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
              address: {
                select: {
                  id: true,
                  label: true,
                  fullAddress: true,
                  city: true,
                  pincode: true,
                  isDefault: true,
                },
              },
            },
          });
        }
      }

      // Notify user if status changed (non-blocking)
      if (status !== oldStatus) {
        const user = await db.user.findUnique({
          where: { id: order.userId },
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
              {
                ...user,
                name: user.name ?? null,
              },
              {
                id: order.id,
                orderNumber: order.orderNumber,
                status: status,
                items: order.items,
              },
              status
            )
            .catch((err) => {
              console.error('Failed to notify user:', err);
            });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          error: true,
          message: error.message,
        });
        return;
      }
      throw error;
    }

    res.status(200).json(order);
  } catch (error) {
    // Re-throw to be caught by global error handler
    throw error;
  }
};

/**
 * Assign delivery boy to order (admin only)
 * POST /api/admin/orders/:id/assign
 * 
 * Body: { deliveryBoyId: string }
 * 
 * Action:
 * - Ensure order exists and in a state that allows assignment (confirmed or pending)
 * - Set assignedDeliveryId
 * - Update status to out_for_delivery (or keep as confirmed) - configurable via Settings
 * - Trigger notification to delivery boy (FCM push; if no token, fallback to SMS link)
 */
export const assignDeliveryBoy = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    if (!id) {
      res.status(400).json({
        error: true,
        message: 'Order ID is required',
      });
      return;
    }

    if (!deliveryBoyId) {
      res.status(400).json({
        error: true,
        message: 'Delivery boy ID is required',
      });
      return;
    }

    // Get settings to check if we should auto-update status
    // For now, default to true (update status to out_for_delivery on assign)
    // In production, this would be configurable via Settings table
    const autoUpdateStatusOnAssign = true; // TODO: Get from Settings table when available

    // Use assignment service for manual assignment (atomic transaction)
    const actor = {
      id: req.user!.id,
      role: req.user!.role || 'admin',
    };

    try {
      const order = await assignmentService.manualAssign(
        id,
        deliveryBoyId,
        autoUpdateStatusOnAssign,
        actor
      );

      res.status(200).json(order);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific errors
        if (
          error.message.includes('not found') ||
          error.message.includes('already assigned') ||
          error.message.includes('cannot be assigned') ||
          error.message.includes('not active')
        ) {
          res.status(400).json({
            error: true,
            message: error.message,
          });
          return;
        }
      }
      throw error;
    }
  } catch (error) {
    // Re-throw to be caught by global error handler
    throw error;
  }
};

/**
 * Get list of active delivery boys (admin only)
 * GET /api/admin/delivery-boys
 * 
 * Returns: { data: DeliveryBoy[] }
 */
export const getDeliveryBoys = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const deliveryBoys = await db.deliveryBoy.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.status(200).json({
      data: deliveryBoys,
    });
  } catch (error) {
    throw error;
  }
};
