import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { googleLogin, getCurrentUser, adminGoogleLogin, deliveryLogin } from '../controllers/authController';

const router = Router();

/**
 * POST /auth/google
 * Authenticate user with Google ID token
 * 
 * Body: { idToken: string }
 * Returns: { success: true, token: string, user: UserResponse }
 * 
 * Errors:
 * - 400: Validation errors (missing/invalid idToken)
 * - 401: Token verification errors (invalid/expired token)
 * - 500: Server errors (database/JWT signing errors)
 */
router.post(
  '/google',
  validateRequest({
    body: [
      body('idToken')
        .notEmpty()
        .withMessage('idToken is required')
        .isString()
        .withMessage('idToken must be a string'),
    ],
  }),
  asyncHandler(googleLogin)
);

/**
 * GET /auth/me
 * Get current authenticated user
 * 
 * Protected route (user auth) - Returns current user information
 * Returns: { user: { id, name, email, phone, profilePic, phoneVerified } }
 * 
 * Purpose:
 * - When app opens, user can auto-login using stored JWT token
 * - Validates JWT token and returns user data if valid
 * 
 * Errors:
 * - 401: Authentication required (handled by authenticateUser)
 */
router.get(
  '/me',
  authenticateUser,
  asyncHandler(getCurrentUser)
);

/**
 * POST /auth/admin/google
 * Authenticate admin user with Google ID token
 * 
 * Body: { idToken: string }
 * Returns: { success: true, token: string, admin: AdminUserResponse }
 * 
 * Flow:
 * 1. Verify Google idToken
 * 2. Check if email exists in AdminUser table
 * 3. If yes, generate JWT with role="admin"
 * 4. If not, return 403 "Not authorized"
 * 5. Return admin token and admin user details
 * 
 * Errors:
 * - 400: Validation errors (missing/invalid idToken)
 * - 401: Token verification errors (invalid/expired token)
 * - 403: Not authorized (email not in AdminUser table)
 * - 500: Server errors (database/JWT signing errors)
 */
router.post(
  '/admin/google',
  validateRequest({
    body: [
      body('idToken')
        .notEmpty()
        .withMessage('idToken is required')
        .isString()
        .withMessage('idToken must be a string'),
    ],
  }),
  asyncHandler(adminGoogleLogin)
);

/**
 * POST /auth/delivery/login
 * Authenticate delivery boy with phone
 * 
 * Body: { phone: string, fcmToken?: string }
 * Returns: { success: true, token: string, delivery: DeliveryBoyResponse }
 * 
 * Flow:
 * 1. Find DeliveryBoy by phone
 * 2. If not found → return 404
 * 3. Save/update fcmToken on DeliveryBoy record (if provided)
 * 4. Generate JWT with role="delivery" and {deliveryId}
 * 5. Return token and delivery profile (including fcmToken)
 * 
 * No OTP required for MVP.
 * 
 * Errors:
 * - 400: Validation errors (missing/invalid phone)
 * - 404: Delivery boy not found
 * - 500: Server errors (database/JWT signing errors)
 */
router.post(
  '/delivery/login',
  validateRequest({
    body: [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .isString()
        .withMessage('Phone must be a string')
        .trim(),
      body('fcmToken')
        .optional()
        .isString()
        .withMessage('FCM token must be a string')
        .trim(),
    ],
  }),
  asyncHandler(deliveryLogin)
);

export default router;

