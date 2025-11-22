import prisma from '../prisma/client';
import type { PrismaClient } from '@prisma/client';

/**
 * Database utilities and helpers
 */

/**
 * Safely connect to the database
 * Useful for ensuring connection before operations
 */
export async function connectDb(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Safely disconnect from the database
 * Prevents connection leaks during hot-reload in development
 */
export async function disconnectDb(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect from database:', error);
    throw error;
  }
}

/**
 * Execute a database operation with automatic connection management
 * Ensures connection before operation
 * Note: Does not disconnect automatically - use connectDb/disconnectDb for manual control
 */
export async function withDb<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  await connectDb();
  return await operation(prisma);
}

/**
 * Export the Prisma client instance
 * 
 * @example
 * ```ts
 * import { db } from './db';
 * 
 * const users = await db.user.findMany();
 * ```
 */
export const db = prisma;

/**
 * Export Prisma types for use in your application
 */
export type { PrismaClient } from '@prisma/client';
export type { User, Address, Product, Order, OrderItem, DeliveryBoy, AdminUser, Setting } from '@prisma/client';

/**
 * Usage Examples:
 * 
 * // Basic usage - import the client directly
 * import { db } from './db';
 * const users = await db.user.findMany();
 * 
 * // With explicit connection management (useful for scripts)
 * import { connectDb, disconnectDb, db } from './db';
 * await connectDb();
 * const users = await db.user.findMany();
 * await disconnectDb();
 * 
 * // Using the withDb helper
 * import { withDb } from './db';
 * const users = await withDb(async (db) => {
 *   return await db.user.findMany();
 * });
 */

