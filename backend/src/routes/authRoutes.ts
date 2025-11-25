import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { getCurrentUser } from '../controllers/authController';
import { signup, login, adminLogin } from '../controllers/authPasswordController';

const router = Router();

/**
 * GET /auth/me
 * Get current authenticated user
 * 
 * Protected route (user auth) - Returns current user information
 * Returns: { user: { id, name, email, phone, profilePic, phoneVerified } }
 */
router.get(
  '/me',
  authenticateUser,
  asyncHandler(getCurrentUser)
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

export default router;

