import { type Request, type Response } from 'express';
import { db } from '../db';
import { Prisma } from '@prisma/client';
import { RequestWithUser } from '../types';

/**
 * Valid order statuses
 */
const VALID_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

type OrderStatus = typeof VALID_ORDER_STATUSES[number];

/**
 * Generate order number in format: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `ORD-${dateStr}-${randomStr}`;
}

/**
 * Create new order
 * Protected route - user auth required
 */
export const createOrder = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { items, addressId } = req.body;
    const userId = req.user!.id;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        error: true,
        message: 'Items array is required and must not be empty',
      });
      return;
    }

    // Validate address (use default if not provided)
    let finalAddressId = addressId;

    if (!finalAddressId) {
      // Get user's default address
      const defaultAddress = await db.address.findFirst({
        where: {
          userId,
          isDefault: true,
        },
      });

      if (!defaultAddress) {
        // Get any address for the user
        const anyAddress = await db.address.findFirst({
          where: { userId },
        });

        if (!anyAddress) {
          res.status(400).json({
            error: true,
            message: 'No address found. Please provide an addressId or add an address to your account',
          });
          return;
        }

        finalAddressId = anyAddress.id;
      } else {
        finalAddressId = defaultAddress.id;
      }
    }

    // Verify address belongs to user
    const address = await db.address.findUnique({
      where: { id: finalAddressId },
    });

    if (!address || address.userId !== userId) {
      res.status(404).json({
        error: true,
        message: 'Address not found or does not belong to you',
      });
      return;
    }

    // Validate items and fetch products with locked rows (for transaction)
    const productIds = items.map((item: { productId: string }) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];

    if (productIds.length !== uniqueProductIds.length) {
      res.status(400).json({
        error: true,
        message: 'Duplicate products in items array',
      });
      return;
    }

    // Use Prisma transaction to ensure data consistency
    const order = await db.$transaction(
      async (tx) => {
        // Fetch all products by IDs from items array (use transaction client for locking)
        const products = await tx.product.findMany({
          where: {
            id: { in: uniqueProductIds },
            isActive: true,
          },
        });

        if (products.length !== uniqueProductIds.length) {
          const foundIds = products.map((p) => p.id);
          const missingIds = uniqueProductIds.filter((id) => !foundIds.includes(id));
          throw new Error(`One or more products not found or inactive: ${missingIds.join(', ')}`);
        }

        // Create a map for quick product lookup
        const productMap = new Map(products.map((p) => [p.id, p]));

        // First, validate all quantities and stock availability before making any changes
        const stockErrors: string[] = [];
        const orderItems: Array<{
          productId: string;
          qty: Prisma.Decimal;
          unitPrice: number;
          subtotal: number;
          product: { id: string; name: string; stockQty: Prisma.Decimal };
        }> = [];

        for (const item of items) {
          const { productId, qty } = item;

          // Validate qty
          const quantity = new Prisma.Decimal(qty);
          if (quantity.lte(0)) {
            stockErrors.push(`Invalid quantity for product ID ${productId}: must be greater than 0`);
            continue;
          }

          const product = productMap.get(productId);
          if (!product) {
            stockErrors.push(`Product ID ${productId} not found`);
            continue;
          }

          // Validate stock >= requested qty
          if (product.stockQty.lt(quantity)) {
            stockErrors.push(
              `Insufficient stock for "${product.name}" (ID: ${productId}). Available: ${product.stockQty.toString()}, Requested: ${quantity.toString()}`
            );
            continue;
          }

          const unitPrice = product.price;
          const subtotal = unitPrice * Number(quantity);

          orderItems.push({
            productId,
            qty: quantity,
            unitPrice,
            subtotal,
            product,
          });
        }

        // If any stock validation failed, return 400 with all errors
        if (stockErrors.length > 0) {
          throw new Error(`Stock validation failed:\n${stockErrors.join('\n')}`);
        }

        // Calculate total amount
        let totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Get delivery fee from settings
        const settings = await tx.setting.findFirst();
        const deliveryFee = settings?.deliveryFee || 0;

        // Check minimum order value
        const minOrderValue = settings?.minOrderValue || 0;
        if (totalAmount < minOrderValue) {
          throw new Error(
            `Minimum order value is ${minOrderValue / 100} ₹. Your order total is ${totalAmount / 100} ₹`
          );
        }

        totalAmount += deliveryFee;

        // Generate unique order number
        let orderNumber: string | undefined;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
          orderNumber = generateOrderNumber();
          const existing = await tx.order.findUnique({
            where: { orderNumber },
          });
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique || !orderNumber) {
          throw new Error('Failed to generate unique order number');
        }

        // Create order with items
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: finalAddressId,
            totalAmount: totalAmount - deliveryFee, // Order total without delivery fee
            deliveryFee,
            paymentMethod: 'cash_on_delivery', // Default payment method
            status: 'pending',
            items: {
              create: orderItems.map((item) => ({
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
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
            address: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Reduce stock for all products (must happen in transaction to ensure consistency)
        // Stock was already validated above, so this should always succeed
        for (const item of orderItems) {
          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: {
                decrement: item.qty,
              },
            },
          });

          // Double-check stock didn't go negative (safety check - should never happen after validation)
          if (updatedProduct.stockQty.lt(0)) {
            const product = productMap.get(item.productId);
            throw new Error(
              `Stock update failed for "${product?.name || item.productId}": insufficient stock after decrement`
            );
          }
        }

        return newOrder;
      },
      {
        timeout: 30000, // 30 seconds timeout
      }
    );

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error messages
      if (
        error.message.includes('Stock validation failed') ||
        error.message.includes('Insufficient stock') ||
        error.message.includes('not found') ||
        error.message.includes('Minimum order value') ||
        error.message.includes('Invalid quantity') ||
        error.message.includes('Stock update failed')
      ) {
        res.status(400).json({
          error: true,
          message: error.message,
        });
        return;
      }
    }

    // Re-throw to be caught by error handler
    throw error;
  }
};

/**
 * Get order by ID
 * Protected route - user can view their own order, admin can view any order
 */
export const getOrderById = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

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
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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

  // Check if user is admin
  const adminUser = await db.adminUser.findUnique({
    where: { email: req.user!.email },
  });

  const isAdmin = !!adminUser && adminUser.googleId === req.user!.googleId;

  // User can only view their own orders unless they're admin
  if (!isAdmin && order.userId !== userId) {
    res.status(403).json({
      error: true,
      message: 'Access denied. You can only view your own orders',
    });
    return;
  }

  res.status(200).json(order);
};

/**
 * Get user's own orders
 * Protected route - user auth required
 * Returns orders for the authenticated user
 */
export const getUserOrders = async (req: RequestWithUser, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

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

  const skip = (page - 1) * limit;

  try {
    // Fetch user's orders
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { userId },
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
      }),
      db.order.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all orders (admin only)
 * Protected route - admin auth required
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as OrderStatus | undefined;

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
  if (status && !VALID_ORDER_STATUSES.includes(status)) {
    res.status(400).json({
      error: true,
      message: `Invalid status. Valid statuses: ${VALID_ORDER_STATUSES.join(', ')}`,
    });
    return;
  }

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
  };

  // Fetch orders and total count
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
            email: true,
          },
        },
      },
    }),
    db.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

/**
 * Update order status (admin only)
 * Protected route - admin auth required
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
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

  // Validate status
  if (!VALID_ORDER_STATUSES.includes(status)) {
    res.status(400).json({
      error: true,
      message: `Invalid status. Valid statuses: ${VALID_ORDER_STATUSES.join(', ')}`,
    });
    return;
  }

  // Check if order exists
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

  // Build update data
  const updateData: Prisma.OrderUpdateInput = {
    status,
    ...(assignedDeliveryId !== undefined && { assignedDeliveryId }),
  };

  try {
    const order = await db.order.update({
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
              },
            },
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

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

