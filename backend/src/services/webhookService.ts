import axios from 'axios';
import pino from 'pino';

/**
 * Webhook Service
 * Sends webhooks to external systems for important events
 * Configured via environment variables
 */

// Initialize logger
const logger = pino({ name: 'WebhookService' });

// Webhook configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const WEBHOOK_ENABLED = process.env.WEBHOOK_ENABLED === 'true' || process.env.WEBHOOK_ENABLED === '1';
const WEBHOOK_TIMEOUT_MS = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000', 10); // Default 5 seconds

/**
 * Initialize webhook service
 */
function initializeWebhook(): void {
  if (WEBHOOK_ENABLED && (!WEBHOOK_URL || WEBHOOK_URL.trim().length === 0)) {
    logger.warn(
      'WEBHOOK_URL not set but WEBHOOK_ENABLED=true. Webhooks will not work.'
    );
  } else if (!WEBHOOK_ENABLED) {
    logger.info('Webhook service disabled. Webhooks will not be sent.');
  } else {
    logger.info('Webhook service initialized successfully');
  }
}

// Initialize on module load
initializeWebhook();

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature?: string;
}

/**
 * Generate webhook signature (HMAC-SHA256)
 * 
 * @param payload - Webhook payload
 * @param secret - Webhook secret
 * @returns Signature string
 */
function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Send webhook to external system
 * 
 * @param event - Event name (e.g., 'order.assigned', 'order.status_changed')
 * @param data - Event data payload
 * @returns Promise<{ success: boolean, messageId?: string, error?: string }>
 */
export async function sendWebhook(
  event: string,
  data: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // If webhooks are disabled, skip
  if (!WEBHOOK_ENABLED) {
    logger.debug({ event }, 'Webhook disabled, skipping');
    return { success: true, messageId: 'disabled' };
  }

  // If webhook URL is not configured, skip
  if (!WEBHOOK_URL || WEBHOOK_URL.trim().length === 0) {
    logger.warn({ event }, 'WEBHOOK_URL not configured, skipping webhook');
    return { success: false, error: 'WEBHOOK_URL not configured' };
  }

  try {
    // Prepare webhook payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Generate signature if secret is configured
    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Your-App-Webhook/1.0',
    };

    if (WEBHOOK_SECRET && WEBHOOK_SECRET.trim().length > 0) {
      const signature = generateSignature(payloadString, WEBHOOK_SECRET);
      headers['X-Webhook-Signature'] = signature;
      payload.signature = signature;
    }

    // Send webhook
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers,
      timeout: WEBHOOK_TIMEOUT_MS,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const messageId = response.headers['x-webhook-id'] || response.data?.id || 'unknown';

    logger.info(
      {
        event,
        statusCode: response.status,
        messageId,
      },
      'Webhook sent successfully'
    );

    return { success: true, messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      axios.isAxiosError(error) && error.response ? error.response.status : undefined;
    const responseData =
      axios.isAxiosError(error) && error.response ? error.response.data : undefined;

    logger.error(
      {
        event,
        error: errorMessage,
        statusCode,
        responseData,
      },
      'Failed to send webhook'
    );

    return {
      success: false,
      error: statusCode ? `HTTP ${statusCode}: ${errorMessage}` : errorMessage,
    };
  }
}

/**
 * Send webhook with retry logic
 * 
 * @param event - Event name
 * @param data - Event data
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Promise<{ success: boolean, messageId?: string, error?: string }>
 */
export async function sendWebhookWithRetry(
  event: string,
  data: any,
  maxRetries: number = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let lastError: { success: boolean; error?: string } | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendWebhook(event, data);

    if (result.success) {
      return result;
    }

    lastError = result;

    // Don't retry on 4xx errors (except 429 rate limit)
    if (
      result.error &&
      result.error.includes('HTTP 4') &&
      !result.error.includes('HTTP 429')
    ) {
      logger.warn(
        {
          event,
          attempt,
          error: result.error,
        },
        'Webhook failed with client error, not retrying'
      );
      return result;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      logger.debug(
        {
          event,
          attempt,
          delay,
        },
        `Waiting before retry attempt ${attempt + 1}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  const finalError = lastError?.error || 'All retry attempts failed';
  logger.error(
    {
      event,
      attempts: maxRetries,
      error: finalError,
    },
    'Webhook failed after all retries'
  );

  return { success: false, error: finalError };
}

/**
 * Send order assignment webhook
 * 
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param deliveryBoyId - Delivery boy ID
 * @param deliveryBoyName - Delivery boy name
 * @param actor - Actor performing the action
 */
export async function sendOrderAssignmentWebhook(
  orderId: string,
  orderNumber: string,
  deliveryBoyId: string,
  deliveryBoyName: string,
  actor?: { id: string; role: string }
): Promise<void> {
  await sendWebhookWithRetry('order.assigned', {
    orderId,
    orderNumber,
    deliveryBoyId,
    deliveryBoyName,
    actorId: actor?.id,
    actorRole: actor?.role,
    timestamp: new Date().toISOString(),
  }).catch((err) => {
    logger.error({ orderId, error: err }, 'Failed to send order assignment webhook');
  });
}

/**
 * Send order status change webhook
 * 
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param previousStatus - Previous order status
 * @param newStatus - New order status
 * @param actor - Actor performing the action
 */
export async function sendOrderStatusChangeWebhook(
  orderId: string,
  orderNumber: string,
  previousStatus: string,
  newStatus: string,
  actor?: { id: string; role: string }
): Promise<void> {
  await sendWebhookWithRetry('order.status_changed', {
    orderId,
    orderNumber,
    previousStatus,
    newStatus,
    actorId: actor?.id,
    actorRole: actor?.role,
    timestamp: new Date().toISOString(),
  }).catch((err) => {
    logger.error({ orderId, error: err }, 'Failed to send order status change webhook');
  });
}

