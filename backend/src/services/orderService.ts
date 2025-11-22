import { db } from '../db';
import { Prisma } from '@prisma/client';
import * as auditService from './auditService';

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * Order status types
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/**
 * Status transition map
 * Defines valid transitions from each status
 * Valid flow: placed (pending) -> accepted (confirmed) -> preparing -> out_for_delivery -> delivered
 * Cancelled can be set from any state except delivered
 */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'], // placed -> accepted (confirmed) or cancelled
  confirmed: ['preparing', 'cancelled'], // accepted -> preparing or cancelled
  preparing: ['out_for_delivery', 'cancelled'], // preparing -> out_for_delivery or cancelled
  out_for_delivery: ['delivered', 'cancelled'], // out_for_delivery -> delivered or cancelled
  delivered: [], // delivered is final state (no transitions allowed)
  cancelled: [], // cancelled is final state (no transitions allowed)
};

/**
 * Check if a status transition is allowed
 * @param currentStatus - Current order status
 * @param nextStatus - Desired next status
 * @returns true if transition is allowed, false otherwise
 */
export function canTransition(currentStatus: string, nextStatus: string): boolean {
  // Normalize status (handle case variations)
  const current = currentStatus.toLowerCase() as OrderStatus;
  const next = nextStatus.toLowerCase() as OrderStatus;

  // Check if statuses are valid
  if (!STATUS_TRANSITIONS[current] || !STATUS_TRANSITIONS[next]) {
    return false;
  }

  // Cancelled can be set from any state except delivered
  if (next === 'cancelled' && current !== 'delivered') {
    return true;
  }

  // Check if transition is in allowed list
  const allowedTransitions = STATUS_TRANSITIONS[current];
  return allowedTransitions.includes(next);
}

/**
 * Get allowed next statuses for a given current status
 * @param currentStatus - Current order status
 * @returns Array of allowed next statuses
 */
export function getAllowedTransitions(currentStatus: string): OrderStatus[] {
  const current = currentStatus.toLowerCase() as OrderStatus;
  return STATUS_TRANSITIONS[current] || [];
}

export interface OrderListResult {
  data: Array<{
    id: string;
    orderNumber: string;
    userId: string;
    addressId: string;
    totalAmount: number;
    deliveryFee: number;
    paymentMethod: string;
    status: string;
    assignedDeliveryId: string | null;
    createdAt: Date;
    updatedAt: Date;
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
    };
    address: {
      id: string;
      fullAddress: string;
      city: string | null;
      pincode: string | null;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * List orders with filters and pagination
 * Efficient Prisma query with includes for related data
 */
export async function listOrders(params: OrderListParams): Promise<OrderListResult> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.OrderWhereInput = {};

  // Filter by status if provided
  if (params.status) {
    where.status = params.status;
  }

  // Search filter (order_number, user_name, phone)
  if (params.search) {
    const searchTerm = params.search.trim();
    where.OR = [
      {
        orderNumber: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        user: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      },
      {
        user: {
          phone: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  // Fetch orders and total count in parallel
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
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
        assignedDelivery: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
    db.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
    },
  };
}

/**
 * Transition order to a new status
 * Performs validation, updates status, and stores timestamps
 * 
 * @param orderId - Order ID to transition
 * @param nextStatus - Desired next status
 * @param actor - Actor performing the transition (for logging/audit)
 * @returns Updated order with all relations
 */
export async function transitionOrder(
  orderId: string,
  nextStatus: string,
  actor?: { id: string; role: string }
): Promise<{
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  status: string;
  assignedDeliveryId: string | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  // Get current order
  const currentOrder = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!currentOrder) {
    throw new Error('Order not found');
  }

  // Validate transition
  if (!canTransition(currentOrder.status, nextStatus)) {
    const allowed = getAllowedTransitions(currentOrder.status);
    throw new Error(
      `Invalid status transition. Cannot change from "${currentOrder.status}" to "${nextStatus}". ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (final state)'}`
    );
  }

  // Build update data
  const updateData: Prisma.OrderUpdateInput = {
    status: nextStatus,
  };

  // Store timestamp when status changes to 'out_for_delivery'
  if (nextStatus === 'out_for_delivery' && currentOrder.status !== 'out_for_delivery') {
    updateData.outForDeliveryAt = new Date();
  }

  // Store timestamp and settlement fields when status changes to 'delivered'
  if (nextStatus === 'delivered' && currentOrder.status !== 'delivered') {
    // Store delivered timestamp
    updateData.deliveredAt = new Date();

    // Store final settlement fields if needed
    // These could include: finalAmount, settlementStatus, etc.
    // Additional settlement fields can be added to the schema as needed
  }

  // Update order
  const updatedOrder = await db.order.update({
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

  // Log transition for audit (optional)
  if (actor) {
    console.log(
      `[ORDER_TRANSITION] Order ${orderId} (${currentOrder.orderNumber}) ` +
        `transitioned from "${currentOrder.status}" to "${nextStatus}" by ${actor.role} (${actor.id})`
    );
  }

  return updatedOrder;
}

