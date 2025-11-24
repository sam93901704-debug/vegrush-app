import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { googleLogin, getCurrentUser, adminGoogleLogin, deliveryLogin } from '../controllers/authController';
import { signup, login, adminLogin, deliverySignup, deliveryLogin as deliveryPasswordLogin } from '../controllers/authPasswordController';

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
 * Authenticate delivery boy with phone (legacy: phone-only, no password)
 * 
 * Body: { phone: string, fcmToken?: string }
 * Returns: { success: true, token: string, delivery: DeliveryBoyResponse }
 * 
 * NOTE: This is the legacy endpoint. New delivery users should use password-based login.
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

/**
 * POST /auth/signup
 * Register a new customer user with email/phone and password
 * 
 * Body: { name?, email?, phone?, password }
 * Returns: { success: true, user: UserResponse, token: string }
 */
router.post(
  '/signup',
  validateRequest({
    body: [
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
      body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format'),
      body('phone')
        .optional()
        .isString()
        .withMessage('Phone must be a string'),
      body('name')
        .optional()
        .isString()
        .withMessage('Name must be a string'),
    ],
  }),
  asyncHandler(signup)
);

/**
 * POST /auth/login
 * Authenticate customer user with email/phone and password
 * 
 * Body: { identifier: string, password: string }
 * Returns: { success: true, user: UserResponse, token: string }
 */
router.post(
  '/login',
  validateRequest({
    body: [
      body('identifier')
        .notEmpty()
        .withMessage('Email or phone is required')
        .isString()
        .withMessage('Identifier must be a string'),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string'),
    ],
  }),
  asyncHandler(login)
);

/**
 * POST /auth/admin/login
 * Authenticate admin user with username and password
 * 
 * Body: { username: string, password: string }
 * Returns: { success: true, admin: AdminUserResponse, token: string }
 */
router.post(
  '/admin/login',
  validateRequest({
    body: [
      body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isString()
        .withMessage('Username must be a string')
        .trim(),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string'),
    ],
  }),
  asyncHandler(adminLogin)
);

/**
 * POST /auth/delivery/signup
 * Register a new delivery user with phone and password
 * 
 * Body: { name: string, phone: string, password: string, vehicleNumber?: string }
 * Returns: { success: true, delivery: DeliveryUserResponse, token: string }
 */
router.post(
  '/delivery/signup',
  validateRequest({
    body: [
      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isString()
        .withMessage('Name must be a string'),
      body('phone')
        .notEmpty()
        .withMessage('Phone is required')
        .isString()
        .withMessage('Phone must be a string'),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
      body('vehicleNumber')
        .optional()
        .isString()
        .withMessage('Vehicle number must be a string'),
    ],
  }),
  asyncHandler(deliverySignup)
);

/**
 * POST /auth/delivery/login-password
 * Authenticate delivery user with phone and password
 * 
 * Body: { phone: string, password: string, fcmToken?: string }
 * Returns: { success: true, delivery: DeliveryUserResponse, token: string }
 */
router.post(
  '/delivery/login-password',
  validateRequest({
    body: [
      body('phone')
        .notEmpty()
        .withMessage('Phone is required')
        .isString()
        .withMessage('Phone must be a string'),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string'),
      body('fcmToken')
        .optional()
        .isString()
        .withMessage('FCM token must be a string'),
    ],
  }),
  asyncHandler(deliveryPasswordLogin)
);

export default router;

