import { db } from '../db';
import { Prisma } from '@prisma/client';

/**
 * Audit Service
 * Logs important actions for audit trail
 * Optionally sends webhooks to external systems
 */

export interface AuditLogData {
  actorId?: string;
  actorRole?: string;
  action: string;
  meta?: Record<string, any>;
}

export interface OrderAssignmentMeta {
  orderId: string;
  orderNumber: string;
  deliveryBoyId: string;
  deliveryBoyName: string;
  previousDeliveryBoyId?: string | null;
  previousStatus?: string;
  newStatus?: string;
}

export interface OrderStatusChangeMeta {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  userId?: string;
  assignedDeliveryId?: string | null;
}

/**
 * Create an audit log entry
 * 
 * @param data - Audit log data
 * @returns Created audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<{
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  meta: Prisma.JsonValue | null;
  createdAt: Date;
}> {
  try {
    const auditLog = await db.auditLog.create({
      data: {
        actorId: data.actorId || null,
        actorRole: data.actorRole || null,
        action: data.action,
        meta: data.meta ? (data.meta as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return auditLog;
  } catch (error) {
    // Log error but don't throw - audit logging failure shouldn't break business logic
    console.error('Failed to create audit log:', error);
    throw error; // Re-throw for now, but can be made non-blocking if needed
  }
}

/**
 * Log order assignment action
 * Also sends webhook if configured
 * 
 * @param meta - Order assignment metadata
 * @param actor - Actor performing the action
 */
export async function logOrderAssignment(
  meta: OrderAssignmentMeta,
  actor?: { id: string; role: string }
): Promise<void> {
  try {
    // Create audit log
    await createAuditLog({
      actorId: actor?.id,
      actorRole: actor?.role,
      action: 'order.assigned',
      meta: {
        orderId: meta.orderId,
        orderNumber: meta.orderNumber,
        deliveryBoyId: meta.deliveryBoyId,
        deliveryBoyName: meta.deliveryBoyName,
        previousDeliveryBoyId: meta.previousDeliveryBoyId,
        previousStatus: meta.previousStatus,
        newStatus: meta.newStatus,
      },
    });

    // Send webhook (non-blocking)
    const webhookService = await import('./webhookService');
    webhookService.sendOrderAssignmentWebhook(
      meta.orderId,
      meta.orderNumber,
      meta.deliveryBoyId,
      meta.deliveryBoyName,
      actor
    ).catch((err) => {
      console.error('Failed to send order assignment webhook:', err);
    });
  } catch (error) {
    // Log error but don't throw - audit logging failure shouldn't break order assignment
    console.error('Failed to log order assignment:', error);
  }
}

/**
 * Log order status change action
 * Also sends webhook if configured
 * 
 * @param meta - Order status change metadata
 * @param actor - Actor performing the action
 */
export async function logOrderStatusChange(
  meta: OrderStatusChangeMeta,
  actor?: { id: string; role: string }
): Promise<void> {
  try {
    // Create audit log
    await createAuditLog({
      actorId: actor?.id,
      actorRole: actor?.role,
      action: 'order.status_changed',
      meta: {
        orderId: meta.orderId,
        orderNumber: meta.orderNumber,
        previousStatus: meta.previousStatus,
        newStatus: meta.newStatus,
        userId: meta.userId,
        assignedDeliveryId: meta.assignedDeliveryId,
      },
    });

    // Send webhook (non-blocking)
    const webhookService = await import('./webhookService');
    webhookService.sendOrderStatusChangeWebhook(
      meta.orderId,
      meta.orderNumber,
      meta.previousStatus,
      meta.newStatus,
      actor
    ).catch((err) => {
      console.error('Failed to send order status change webhook:', err);
    });
  } catch (error) {
    // Log error but don't throw - audit logging failure shouldn't break status update
    console.error('Failed to log order status change:', error);
  }
}

/**
 * Get audit logs with filters
 * 
 * @param filters - Filter options
 * @returns Audit logs with pagination
 */
export async function getAuditLogs(filters: {
  actorId?: string;
  actorRole?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.actorId && { actorId: filters.actorId }),
    ...(filters.actorRole && { actorRole: filters.actorRole }),
    ...(filters.action && { action: filters.action }),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
    },
  };
}

