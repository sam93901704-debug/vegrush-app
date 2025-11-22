import axios from 'axios';
import pino from 'pino';

/**
 * SMS Service
 * Handles SMS notifications using MSG91 API
 * Falls back to logging if provider is not configured
 */

// Initialize logger
const logger = pino({ name: 'SMSService' });

// MSG91 configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'ORDERS'; // Default sender ID
const MSG91_ENABLED = process.env.SMS_ENABLED === 'true' || process.env.SMS_ENABLED === '1';

// MSG91 API endpoints
const MSG91_URL = 'https://control.msg91.com/api/v5/flow/';

/**
 * Initialize SMS service
 * Validates that MSG91 credentials are set if SMS is enabled
 */
function initializeSMS(): void {
  if (MSG91_ENABLED && (!MSG91_AUTH_KEY || MSG91_AUTH_KEY.trim().length === 0)) {
    logger.warn(
      'MSG91_AUTH_KEY not set but SMS_ENABLED=true. SMS notifications will not work. Messages will be logged only.'
    );
  } else if (!MSG91_ENABLED) {
    logger.info('SMS service disabled. SMS messages will be logged only.');
  } else {
    logger.info('SMS service initialized successfully with MSG91');
  }
}

// Initialize on module load
initializeSMS();

/**
 * Validate phone number format (basic validation for Indian numbers)
 * @param phone - Phone number to validate
 * @returns true if phone number appears valid, false otherwise
 */
function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || phone.trim().length === 0) {
    return false;
  }

  // Remove spaces, dashes, and plus signs
  const cleaned = phone.replace(/[\s\-+]/g, '');

  // Basic validation: should be 10-15 digits (including country code)
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Format phone number for MSG91 (ensure it starts with country code)
 * @param phone - Phone number to format
 * @returns Formatted phone number with country code
 */
function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, and plus signs
  let cleaned = phone.replace(/[\s\-+]/g, '');

  // If it's a 10-digit Indian number, add 91 country code
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return `91${cleaned}`;
  }

  // If it already starts with 91, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  }

  // Return as is for other formats
  return cleaned;
}

/**
 * Send SMS using MSG91 API
 * 
 * @param phone - Recipient phone number
 * @param text - SMS message text
 * @returns Promise<{ success: boolean, messageId?: string, error?: string }>
 */
export async function sendSms(
  phone: string | null,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!phone || phone.trim().length === 0) {
    const error = 'Phone number is required';
    logger.error({ error }, 'Invalid phone number');
    return { success: false, error };
  }

  if (!isValidPhoneNumber(phone)) {
    const error = 'Invalid phone number format';
    logger.error({ phone: phone.substring(0, 5) + '...', error }, 'Invalid phone number format');
    return { success: false, error };
  }

  // If SMS is not enabled, just log the message
  if (!MSG91_ENABLED) {
    logger.info(
      {
        phone: phone.substring(0, 5) + '...',
        messageLength: text.length,
      },
      'SMS not sent (SMS_ENABLED=false). Message logged only.'
    );
    console.log(`[SMS] To ${phone}: ${text}`);
    return { success: true, messageId: 'logged-only' };
  }

  // If MSG91 credentials are not configured, log and return
  if (!MSG91_AUTH_KEY || MSG91_AUTH_KEY.trim().length === 0) {
    const error = 'MSG91_AUTH_KEY not configured';
    logger.warn(
      {
        phone: phone.substring(0, 5) + '...',
        error,
      },
      'SMS not sent (MSG91 not configured). Message logged only.'
    );
    console.log(`[SMS] To ${phone}: ${text}`);
    return { success: false, error };
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);

    // MSG91 Flow API request
    const response = await axios.post(
      MSG91_URL,
      {
        template_id: process.env.MSG91_TEMPLATE_ID || undefined, // Optional: use template if configured
        sender: MSG91_SENDER_ID,
        short_url: '0', // Disable URL shortening
        mobiles: formattedPhone,
        text: text, // Direct text message
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authkey': MSG91_AUTH_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // MSG91 API typically returns success status
    if (response.data.type === 'success' || response.status === 200) {
      const messageId = response.data.request_id || response.data.message_id || 'unknown';
      logger.info(
        {
          phone: phone.substring(0, 5) + '...',
          messageId,
        },
        'SMS sent successfully via MSG91'
      );
      return { success: true, messageId };
    } else {
      const error = response.data.message || 'Unknown MSG91 error';
      logger.error(
        {
          phone: phone.substring(0, 5) + '...',
          error,
        },
        'MSG91 API returned error'
      );
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      axios.isAxiosError(error) && error.response ? error.response.status : undefined;
    const responseData = axios.isAxiosError(error) && error.response ? error.response.data : undefined;

    logger.error(
      {
        phone: phone.substring(0, 5) + '...',
        error: errorMessage,
        statusCode,
        responseData,
      },
      'Failed to send SMS via MSG91'
    );

    // Fallback: log the message even if API call failed
    console.log(`[SMS-FALLBACK] To ${phone}: ${text}`);

    return {
      success: false,
      error: statusCode ? `HTTP ${statusCode}: ${errorMessage}` : errorMessage,
    };
  }
}

/**
 * Alternative: Send SMS using MSG91 Transactional SMS API (simpler endpoint)
 * This is a fallback method if Flow API doesn't work
 */
async function sendSmsTransactional(phone: string, text: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);
    const senderId = MSG91_SENDER_ID || 'ORDERS';

    // MSG91 Transactional SMS API
    const url = `https://control.msg91.com/api/sendhttp.php?authkey=${MSG91_AUTH_KEY}&mobiles=${formattedPhone}&message=${encodeURIComponent(text)}&sender=${senderId}&route=4&country=91`;

    const response = await axios.get(url, {
      timeout: 10000,
    });

    // MSG91 Transactional API returns request_id as response body if successful
    const responseText = typeof response.data === 'string' ? response.data : String(response.data);

    if (responseText && !responseText.includes('error') && !responseText.includes('Error')) {
      const messageId = responseText.trim();
      logger.info(
        {
          phone: phone.substring(0, 5) + '...',
          messageId,
        },
        'SMS sent successfully via MSG91 Transactional API'
      );
      return { success: true, messageId };
    } else {
      logger.error(
        {
          phone: phone.substring(0, 5) + '...',
          response: responseText,
        },
        'MSG91 Transactional API returned error'
      );
      return { success: false, error: responseText };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      {
        phone: phone.substring(0, 5) + '...',
        error: errorMessage,
      },
      'Failed to send SMS via MSG91 Transactional API'
    );
    return { success: false, error: errorMessage };
  }
}

