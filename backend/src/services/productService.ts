import { db } from '../db';
import { Prisma } from '@prisma/client';

/**
 * Product Service
 * Business logic for product operations
 */

/**
 * List products with pagination and filters
 */
export async function listProducts(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  inStockOnly?: boolean;
  includeInactive?: boolean; // For admin: show all products including inactive
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    // Only filter by isActive for public endpoints (admin can see all)
    ...(!params.includeInactive && { isActive: true }),
    ...(params.category && { category: params.category }),
    ...(params.inStockOnly && {
      stockQty: {
        gt: 0,
      },
    }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { category: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  };

  // Fetch products and total count in parallel
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
    },
  };
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
  });

  return product;
}

/**
 * Create a new product
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  category: string;
  price: number;
  unitType: string;
  unitValue: number;
  stockQty: number;
  imageUrl?: string;
  isActive?: boolean;
}) {
  const product = await db.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      price: data.price,
      unitType: data.unitType,
      unitValue: new Prisma.Decimal(data.unitValue),
      stockQty: new Prisma.Decimal(data.stockQty),
      imageUrl: data.imageUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  return product;
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    unitType?: string;
    unitValue?: number;
    stockQty?: number;
    imageUrl?: string;
    isActive?: boolean;
  }
) {
  // Check if product exists
  const existingProduct = await db.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return null;
  }

  // Build update data
  const updateData: Prisma.ProductUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.unitType !== undefined) updateData.unitType = data.unitType;
  if (data.unitValue !== undefined) updateData.unitValue = new Prisma.Decimal(data.unitValue);
  if (data.stockQty !== undefined) updateData.stockQty = new Prisma.Decimal(data.stockQty);
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const product = await db.product.update({
    where: { id: productId },
    data: updateData,
  });

  return product;
}

/**
 * Update product stock quantity
 */
export async function updateProductStock(productId: string, stockQty: number) {
  // Check if product exists
  const existingProduct = await db.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return null;
  }

  const product = await db.product.update({
    where: { id: productId },
    data: {
      stockQty: new Prisma.Decimal(stockQty),
    },
  });

  return product;
}

/**
 * Delete product (soft delete by setting isActive = false, or hard delete)
 */
export async function deleteProduct(productId: string, hardDelete: boolean = false) {
  // Check if product exists
  const existingProduct = await db.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return null;
  }

  if (hardDelete) {
    // Hard delete - remove from database
    await db.product.delete({
      where: { id: productId },
    });
  } else {
    // Soft delete - set isActive to false
    await db.product.update({
      where: { id: productId },
      data: {
        isActive: false,
      },
    });
  }

  return { success: true };
}

