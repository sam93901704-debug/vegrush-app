import { db } from '../db';
import axios from 'axios';
import pino from 'pino';
import * as smsService from './smsService';

/**
 * Notification Service
 * Handles FCM push notifications with retry logic and SMS fallback
 */

// Initialize logger
const logger = pino({ name: 'NotificationService' });

// FCM configuration
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second base delay

/**
 * Initialize FCM service
 * Validates that FCM_SERVER_KEY is set in environment
 */
function initializeFCM(): void {
  if (!FCM_SERVER_KEY || FCM_SERVER_KEY.trim().length === 0) {
    logger.warn(
      'FCM_SERVER_KEY not set in environment. FCM push notifications will not work. SMS fallback will be used.'
    );
  } else {
    logger.info('FCM service initialized successfully');
  }
}

// Initialize on module load
initializeFCM();

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send push notification to FCM token
 * Implements retry logic with exponential backoff
 * 
 * @param token - FCM device token
 * @param payload - FCM message payload { title, body, data }
 * @returns Promise<{ success: boolean, messageId?: string, error?: string }>
 */
export async function sendPushToFcmToken(
  token: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, string | number>;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!FCM_SERVER_KEY || FCM_SERVER_KEY.trim().length === 0) {
    const error = 'FCM_SERVER_KEY not configured';
    logger.error({ token: token.substring(0, 10) + '...', error }, 'FCM not configured');
    return { success: false, error };
  }

  if (!token || token.trim().length === 0) {
    const error = 'FCM token is empty';
    logger.error({ error }, 'Invalid FCM token');
    return { success: false, error };
  }

  const fcmMessage = {
    to: token,
    notification: {
      title: payload.title,
      body: payload.body,
      sound: 'default',
      badge: '1',
    },
    data: payload.data || {},
    priority: 'high' as const,
  };

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(FCM_URL, fcmMessage, {
        headers: {
          'Authorization': `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      // FCM returns 200 even for some errors, check response body
      if (response.data.success === 1) {
        const messageId = response.data.results?.[0]?.message_id;
        logger.info(
          {
            token: token.substring(0, 10) + '...',
            messageId,
            attempt,
          },
          'FCM push notification sent successfully'
        );
        return { success: true, messageId };
      } else {
        const error = response.data.results?.[0]?.error || 'Unknown FCM error';
        logger.warn(
          {
            token: token.substring(0, 10) + '...',
            error,
            attempt,
          },
          'FCM returned error response'
        );

        // Check if error is unrecoverable (e.g., invalid token)
        if (
          error === 'InvalidRegistration' ||
          error === 'NotRegistered' ||
          error === 'MismatchSenderId'
        ) {
          // Don't retry for unrecoverable errors
          return { success: false, error };
        }

        lastError = new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const statusCode =
        axios.isAxiosError(error) && error.response
          ? error.response.status
          : undefined;

      logger.warn(
        {
          token: token.substring(0, 10) + '...',
          error: errorMessage,
          statusCode,
          attempt,
        },
        `FCM push notification attempt ${attempt} failed`
      );

      lastError = error instanceof Error ? error : new Error(errorMessage);

      // Don't retry on 4xx errors (except 429 rate limit)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        logger.error(
          {
            token: token.substring(0, 10) + '...',
            statusCode,
          },
          'FCM push failed with client error, not retrying'
        );
        return { success: false, error: `HTTP ${statusCode}: ${errorMessage}` };
      }
    }

    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      logger.debug(
        { delay, attempt },
        `Waiting before retry attempt ${attempt + 1}`
      );
      await sleep(delay);
    }
  }

  // All retries failed
  const finalError = lastError?.message || 'All retry attempts failed';
  logger.error(
    {
      token: token.substring(0, 10) + '...',
      error: finalError,
      attempts: MAX_RETRIES,
    },
    'FCM push notification failed after all retries'
  );
  return { success: false, error: finalError };
}

/**
 * Send SMS notification (fallback)
 * Uses SMS service wrapper (MSG91)
 */
async function sendSMS(phone: string | null, message: string): Promise<void> {
  if (!phone || phone.trim().length === 0) {
    logger.warn({}, 'SMS not sent: phone number not available');
    return;
  }

  // Use SMS service to send message
  const result = await smsService.sendSms(phone, message);
  
  if (result.success) {
    logger.info(
      {
        phone: phone.substring(0, 5) + '...',
        messageId: result.messageId,
      },
      'SMS sent successfully'
    );
  } else {
    logger.warn(
      {
        phone: phone.substring(0, 5) + '...',
        error: result.error,
      },
      'SMS failed, message logged only'
    );
  }
}

/**
 * Notify delivery boy when assigned to an order
 * Sends FCM push notification with order details
 * Falls back to SMS if FCM fails or token not present
 * 
 * @param deliveryBoy - Delivery boy object with fcmToken
 * @param order - Order object with optional user info for SMS
 */
export async function notifyDeliveryAssigned(
  deliveryBoy: { id: string; name: string; phone: string; fcmToken: string | null },
  order: { id: string; orderNumber: string; user?: { name: string | null; phone: string | null } }
): Promise<void> {
  try {
    logger.info(
      {
        deliveryBoyId: deliveryBoy.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      'Notifying delivery boy of order assignment'
    );

    // Try FCM push notification if token exists
    if (deliveryBoy.fcmToken && deliveryBoy.fcmToken.trim().length > 0) {
      const result = await sendPushToFcmToken(deliveryBoy.fcmToken, {
        title: 'New Order Assigned',
        body: `Order ${order.orderNumber} has been assigned to you`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'order_assigned',
        },
      });

      if (result.success) {
        logger.info(
          {
            deliveryBoyId: deliveryBoy.id,
            orderId: order.id,
            messageId: result.messageId,
          },
          'FCM push notification sent to delivery boy'
        );
        return; // Success, no need for SMS fallback
      } else {
        logger.warn(
          {
            deliveryBoyId: deliveryBoy.id,
            orderId: order.id,
            error: result.error,
          },
          'FCM push failed, falling back to SMS'
        );
      }
    } else {
      logger.debug(
        { deliveryBoyId: deliveryBoy.id },
        'No FCM token for delivery boy, using SMS fallback'
      );
    }

    // SMS fallback - Short message format: "Order ORD-xxxx assigned to [name]. Call: [phone]"
    let smsMessage = '';
    if (order.user && order.user.name && order.user.phone) {
      // Include customer name and phone if available
      smsMessage = `Order ${order.orderNumber} assigned to ${order.user.name}. Call: ${order.user.phone}`;
    } else {
      // Fetch customer info if not provided
      try {
        const orderWithUser = await db.order.findUnique({
          where: { id: order.id },
          select: {
            orderNumber: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        });

        if (orderWithUser?.user?.name && orderWithUser.user.phone) {
          smsMessage = `Order ${order.orderNumber} assigned to ${orderWithUser.user.name}. Call: ${orderWithUser.user.phone}`;
        } else {
          // Fallback format if customer info not available
          smsMessage = `Order ${order.orderNumber} assigned to you. View: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/delivery/orders/${order.id}`;
        }
      } catch (err) {
        // If fetching fails, use fallback format
        logger.warn({ orderId: order.id, error: err }, 'Failed to fetch order user for SMS, using fallback format');
        smsMessage = `Order ${order.orderNumber} assigned to you. View: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/delivery/orders/${order.id}`;
      }
    }
    await sendSMS(deliveryBoy.phone, smsMessage);
  } catch (error) {
    // Log error but don't throw - notification failure shouldn't break order assignment
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      {
        deliveryBoyId: deliveryBoy.id,
        orderId: order.id,
        error: errorMessage,
      },
      'Failed to notify delivery boy'
    );
  }
}

/**
 * Notify user when order status changes
 * Sends FCM push if user has token, otherwise SMS fallback
 * 
 * @param user - User object with fcmToken (if available)
 * @param order - Order object with status and items
 * @param status - New order status
 */
export async function notifyUserOnStatusChange(
  user: { id: string; name: string | null; phone: string | null; fcmToken?: string | null },
  order: { id: string; orderNumber: string; status: string; items?: Array<{ qty: unknown; product?: { name: string } }> },
  status: string
): Promise<void> {
  try {
    logger.info(
      {
        userId: user.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
      },
      'Notifying user of order status change'
    );

    // Generate status message
    let statusMessage = '';
    let statusTitle = '';
    switch (status) {
      case 'out_for_delivery':
        statusTitle = 'Order Out for Delivery';
        statusMessage = 'Your order is out for delivery';
        break;
      case 'delivered':
        statusTitle = 'Order Delivered';
        statusMessage = 'Order Delivered';
        break;
      case 'picked':
        statusTitle = 'Order Picked Up';
        statusMessage = 'Your order has been picked up';
        break;
      default:
        statusTitle = 'Order Status Updated';
        statusMessage = `Your order status has been updated to ${status}`;
    }

    // Generate order summary (short version)
    let orderSummary = '';
    if (order.items && order.items.length > 0) {
      const itemCount = order.items.length;
      const firstItem = order.items[0];
      const itemName = firstItem.product?.name || 'items';
      orderSummary = `${itemCount} ${itemCount === 1 ? 'item' : 'items'} (${itemName}${itemCount > 1 ? '...' : ''})`;
    } else {
      orderSummary = 'your order';
    }

    // Try FCM push notification if token exists
    const fcmToken = user.fcmToken || (user as any).fcmToken; // Handle both possible field names
    if (fcmToken && fcmToken.trim().length > 0) {
      const result = await sendPushToFcmToken(fcmToken, {
        title: statusTitle,
        body: status === 'delivered' ? 'Order Delivered' : `${statusMessage}: ${order.orderNumber}`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status,
          type: 'order_status_change',
        }, // Deep link: apps can use orderId to navigate to order detail
      });

      if (result.success) {
        logger.info(
          {
            userId: user.id,
            orderId: order.id,
            messageId: result.messageId,
          },
          'FCM push notification sent to user'
        );
        return; // Success, no need for SMS fallback
      } else {
        logger.warn(
          {
            userId: user.id,
            orderId: order.id,
            error: result.error,
          },
          'FCM push failed, falling back to SMS'
        );
      }
    } else {
      logger.debug({ userId: user.id }, 'No FCM token for user, using SMS fallback');
    }

    // SMS fallback with call-to-action and order summary
    const trackingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/orders/${order.id}`;
    const smsMessage = `${statusMessage} - Order ${order.orderNumber} (${orderSummary}). Track your order: ${trackingLink}`;
    await sendSMS(user.phone, smsMessage);
  } catch (error) {
    // Log error but don't throw - notification failure shouldn't break order update
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      {
        userId: user.id,
        orderId: order.id,
        error: errorMessage,
      },
      'Failed to notify user'
    );
  }
}

/**
 * Legacy function: Notify delivery boy (for backward compatibility)
 * Uses notifyDeliveryAssigned internally
 */
export async function notifyDeliveryBoy(
  deliveryBoyId: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  try {
    // Get delivery boy details
    const deliveryBoy = await db.deliveryBoy.findUnique({
      where: { id: deliveryBoyId },
      select: {
        id: true,
        name: true,
        phone: true,
        fcmToken: true,
      },
    });

    if (!deliveryBoy) {
      throw new Error('Delivery boy not found');
    }

    // Fetch order with user info for SMS notification
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (order) {
      await notifyDeliveryAssigned(deliveryBoy, {
        id: order.id,
        orderNumber: order.orderNumber,
        user: order.user ? {
          name: order.user.name ?? null,
          phone: order.user.phone,
        } : undefined,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      {
        deliveryBoyId,
        orderId,
        error: errorMessage,
      },
      'Failed to notify delivery boy (legacy function)'
    );
  }
}

/**
 * Legacy function: Notify user (for backward compatibility)
 * Uses notifyUserOnStatusChange internally
 */
export async function notifyUser(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string
): Promise<void> {
  try {
    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get order details for summary
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: {
          select: {
            qty: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await notifyUserOnStatusChange(
      {
        ...user,
        name: user.name ?? null,
      },
      order,
      status
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      {
        userId,
        orderId,
        error: errorMessage,
      },
      'Failed to notify user (legacy function)'
    );
  }
}
