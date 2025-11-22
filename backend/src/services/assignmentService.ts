import { db } from '../db';
import { Prisma } from '@prisma/client';
import * as orderService from './orderService';
import * as notificationService from './notificationService';
import * as auditService from './auditService';

/**
 * Assignment Service
 * Handles delivery boy assignment to orders
 * Supports Manual (admin chooses) and Auto (round-robin) assignment
 */

export interface DeliveryBoyAssignment {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
  isActive: boolean;
  lastAssignedAt: Date | null;
  createdAt: Date;
}

/**
 * Get active delivery boys with their last assignment time
 * @returns List of active delivery boys sorted by lastAssignedAt (nulls first for round-robin)
 */
export async function getActiveDeliveryBoys(): Promise<DeliveryBoyAssignment[]> {
  const deliveryBoys = await db.deliveryBoy.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        lastAssignedAt: {
          sort: 'asc',
          nulls: 'first', // Nulls first = never assigned gets priority
        },
      },
      {
        createdAt: 'asc', // Fallback sort by creation time
      },
    ],
  });

  // Map to include lastAssignedAt (currently null if field doesn't exist)
  return deliveryBoys.map((boy) => ({
    id: boy.id,
    name: boy.name,
    phone: boy.phone,
    vehicleNumber: boy.vehicleNumber,
    isActive: boy.isActive,
    lastAssignedAt: (boy as any).lastAssignedAt || null, // Type assertion for field that may not exist yet
    createdAt: boy.createdAt,
  }));
}

/**
 * Auto-assign delivery boy to order using round-robin
 * Picks the first idle delivery boy (or least recently assigned)
 * 
 * @param orderId - Order ID to assign
 * @param autoUpdateStatus - Whether to auto-update status to 'out_for_delivery' (default: true)
 * @returns Assigned order with delivery boy information
 */
export async function autoAssign(
  orderId: string,
  autoUpdateStatus: boolean = true
): Promise<{
  order: {
    id: string;
    orderNumber: string;
    status: string;
    assignedDeliveryId: string;
    items: Array<{
      id: string;
      productId: string;
      qty: Prisma.Decimal;
      unitPrice: number;
      subtotal: number;
      product: {
        id: string;
        name: string;
        category: string;
        imageUrl: string | null;
      };
    }>;
    user: {
      id: string;
      name: string;
      phone: string | null;
      email: string;
    };
    address: {
      id: string;
      label: string | null;
      fullAddress: string;
      city: string | null;
      pincode: string | null;
      isDefault: boolean;
    };
  };
  deliveryBoy: {
    id: string;
    name: string;
    phone: string;
  };
}> {
  // Use Prisma transaction to ensure atomic assignment
  return await db.$transaction(
    async (tx) => {
      // Get order (locked for update)
      const order = await tx.order.findUnique({
        where: { id: orderId },
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

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is already assigned
      if (order.assignedDeliveryId) {
        throw new Error('Order is already assigned to a delivery boy');
      }

      // Check if order is in a state that allows assignment
      const assignableStatuses = ['pending', 'confirmed'];
      if (!assignableStatuses.includes(order.status)) {
        throw new Error(
          `Order cannot be assigned in current status "${order.status}". Order must be in "pending" or "confirmed" status.`
        );
      }

      // Get active delivery boys sorted by lastAssignedAt (round-robin)
      // For round-robin: pick the one with oldest (or null) lastAssignedAt
      // Note: If lastAssignedAt field doesn't exist, we'll sort by createdAt as fallback
      const allDeliveryBoys = await tx.deliveryBoy.findMany({
        where: {
          isActive: true,
        },
      });

      // Sort by lastAssignedAt (nulls first for round-robin), then by createdAt
      const deliveryBoys = allDeliveryBoys.sort((a, b) => {
        const aLastAssigned = (a as any).lastAssignedAt;
        const bLastAssigned = (b as any).lastAssignedAt;

        // Nulls first (never assigned gets priority)
        if (!aLastAssigned && !bLastAssigned) {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        if (!aLastAssigned) return -1;
        if (!bLastAssigned) return 1;

        // Sort by lastAssignedAt (oldest first)
        const timeDiff = aLastAssigned.getTime() - bLastAssigned.getTime();
        if (timeDiff !== 0) return timeDiff;

        // Fallback to createdAt
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const selectedDeliveryBoy = deliveryBoys[0];

      if (!selectedDeliveryBoy) {
        throw new Error('No active delivery boys available for assignment');
      }

      // Update order with assignedDeliveryId
      const updateData: Prisma.OrderUpdateInput & {
        assignedDeliveryId: string;
        outForDeliveryAt?: Date;
        deliveredAt?: Date;
      } = {
        assignedDeliveryId: selectedDeliveryBoy.id,
      };

      // Auto-update status to 'out_for_delivery' if enabled
      if (autoUpdateStatus) {
        // Use service to transition order (handles validation and timestamps)
        // But we're in a transaction, so we'll do it manually here
        if (orderService.canTransition(order.status, 'out_for_delivery')) {
          updateData.status = 'out_for_delivery';
          // Store timestamp when transitioning to 'out_for_delivery'
          (updateData as any).outForDeliveryAt = new Date();
        }
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
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

      // Update delivery boy's lastAssignedAt (atomic within transaction)
      await tx.deliveryBoy.update({
        where: { id: selectedDeliveryBoy.id },
        data: {
          // Note: lastAssignedAt field needs to be added to Prisma schema
          // Add: lastAssignedAt DateTime? to DeliveryBoy model
          lastAssignedAt: new Date(),
        } as any, // Type assertion needed if field doesn't exist yet
      });

      // Send notification to delivery boy (non-blocking, outside transaction)
      // We do this outside the transaction to avoid long-running operations
      notificationService
        .notifyDeliveryAssigned(selectedDeliveryBoy, {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          user: updatedOrder.user ? {
            name: updatedOrder.user.name,
            phone: updatedOrder.user.phone,
          } : undefined,
        })
        .catch((err) => {
          console.error('Notification failed:', err);
          // Don't fail the assignment if notification fails
        });

      return {
        order: updatedOrder as any,
        deliveryBoy: {
          id: selectedDeliveryBoy.id,
          name: selectedDeliveryBoy.name,
          phone: selectedDeliveryBoy.phone,
        },
      };
    },
    {
      timeout: 10000, // 10 seconds timeout for transaction
    }
  );
}

/**
 * Manual assignment (admin chooses delivery boy)
 * This is a wrapper that validates and assigns a specific delivery boy
 * 
 * @param orderId - Order ID to assign
 * @param deliveryBoyId - Delivery boy ID to assign
 * @param autoUpdateStatus - Whether to auto-update status to 'out_for_delivery' (default: true)
 * @param actor - Actor performing the assignment (for logging)
 * @returns Updated order
 */
export async function manualAssign(
  orderId: string,
  deliveryBoyId: string,
  autoUpdateStatus: boolean = true,
  actor?: { id: string; role: string }
): Promise<{
  id: string;
  orderNumber: string;
  status: string;
  assignedDeliveryId: string;
  items: Array<{
    id: string;
    productId: string;
    qty: Prisma.Decimal;
    unitPrice: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
      category: string;
      imageUrl: string | null;
    };
  }>;
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  address: {
    id: string;
    label: string | null;
    fullAddress: string;
    city: string | null;
    pincode: string | null;
    isDefault: boolean;
  };
}> {
  // Use Prisma transaction to ensure atomic assignment
  return await db.$transaction(
    async (tx) => {
      // Get order (locked for update)
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is already assigned
      if (order.assignedDeliveryId) {
        throw new Error('Order is already assigned to a delivery boy');
      }

      // Check if order is in a state that allows assignment
      const assignableStatuses = ['pending', 'confirmed'];
      if (!assignableStatuses.includes(order.status)) {
        throw new Error(
          `Order cannot be assigned in current status "${order.status}". Order must be in "pending" or "confirmed" status.`
        );
      }

      // Validate delivery boy
      const deliveryBoy = await tx.deliveryBoy.findUnique({
        where: { id: deliveryBoyId },
      });

      if (!deliveryBoy) {
        throw new Error('Delivery boy not found');
      }

      if (!deliveryBoy.isActive) {
        throw new Error('Delivery boy is not active');
      }

      // Build update data
      const updateData: Prisma.OrderUpdateInput & {
        assignedDeliveryId: string;
        outForDeliveryAt?: Date;
      } = {
        assignedDeliveryId: deliveryBoyId,
      };

      // Auto-update status to 'out_for_delivery' if enabled
      if (autoUpdateStatus) {
        if (orderService.canTransition(order.status, 'out_for_delivery')) {
          updateData.status = 'out_for_delivery';
          // Store timestamp when transitioning to 'out_for_delivery'
          (updateData as any).outForDeliveryAt = new Date();
        }
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
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

      // Update delivery boy's lastAssignedAt
      await tx.deliveryBoy.update({
        where: { id: deliveryBoyId },
        data: {
          // Note: lastAssignedAt field needs to be added to Prisma schema
          // Add: lastAssignedAt DateTime? to DeliveryBoy model
          lastAssignedAt: new Date(),
        } as any, // Type assertion needed if field doesn't exist yet
      });

      // Log assignment to audit log (non-blocking, outside transaction)
      auditService
        .logOrderAssignment(
          {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            deliveryBoyId: deliveryBoy.id,
            deliveryBoyName: deliveryBoy.name,
            previousDeliveryBoyId: order.assignedDeliveryId,
            previousStatus: order.status,
            newStatus: updatedOrder.status,
          },
          actor
        )
        .catch((err) => {
          console.error('Failed to log order assignment:', err);
        });

      // Log assignment
      if (actor) {
        console.log(
          `[ORDER_ASSIGNMENT] Order ${orderId} (${order.orderNumber}) assigned to delivery boy ${deliveryBoyId} (${deliveryBoy.name}) by ${actor.role} (${actor.id})`
        );
      }

      // Send notification to delivery boy (non-blocking, outside transaction)
      notificationService
        .notifyDeliveryAssigned(deliveryBoy, {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          user: updatedOrder.user ? {
            name: updatedOrder.user.name,
            phone: updatedOrder.user.phone,
          } : undefined,
        })
        .catch((err) => {
          console.error('Notification failed:', err);
        });

      return updatedOrder as any;
    },
    {
      timeout: 10000, // 10 seconds timeout for transaction
    }
  );
}

