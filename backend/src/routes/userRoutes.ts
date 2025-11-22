import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body } from '../middleware/validateRequest';
import { authenticateUser } from '../middleware/authenticate';
import { updatePhone, updateLocation, getDefaultAddress, updateFcmToken } from '../controllers/userController';

const router = Router();

/**
 * POST /user/phone
 * Protected route (user auth) - Update user phone number
 * 
 * Body: { phone: string } - must be exactly 10 digits
 * Returns: Updated user object
 * 
 * Errors:
 * - 400: Validation errors (missing/invalid phone format)
 * - 401: Authentication required (handled by authenticateUser)
 * - 409: Phone already registered by another user
 */
router.post(
  '/phone',
  authenticateUser,
  validateRequest({
    body: [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .isString()
        .withMessage('Phone must be a string')
        .trim()
        .matches(/^\d{10}$/)
        .withMessage('Phone must be exactly 10 digits'),
    ],
  }),
  asyncHandler(updatePhone)
);

/**
 * POST /user/location
 * Protected route (user auth) - Update user location (address)
 * 
 * Body: { latitude: number, longitude: number, fullAddress: string, city: string, pincode: string }
 * - latitude: number (required)
 * - longitude: number (required)
 * - fullAddress: string (required)
 * - city: string (required)
 * - pincode: string (required, exactly 6 digits)
 * Returns: Updated or created address object
 * 
 * Flow:
 * - If user has an existing default address → update it
 * - Else → create a new address with isDefault = true
 * 
 * Errors:
 * - 400: Validation errors (missing/invalid fields)
 * - 401: Authentication required (handled by authenticateUser)
 */
router.post(
  '/location',
  authenticateUser,
  validateRequest({
    body: [
      body('latitude')
        .notEmpty()
        .withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a number between -90 and 90'),
      body('longitude')
        .notEmpty()
        .withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a number between -180 and 180'),
      body('fullAddress')
        .trim()
        .notEmpty()
        .withMessage('Full address is required')
        .isString()
        .withMessage('Full address must be a string')
        .isLength({ min: 1, max: 500 })
        .withMessage('Full address must be between 1 and 500 characters'),
      body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required')
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('City must be between 1 and 100 characters'),
      body('pincode')
        .trim()
        .notEmpty()
        .withMessage('Pincode is required')
        .isString()
        .withMessage('Pincode must be a string')
        .matches(/^\d{6}$/)
        .withMessage('Pincode must be exactly 6 digits'),
    ],
  }),
  asyncHandler(updateLocation)
);

/**
 * GET /user/address
 * Protected route (user auth) - Get user's default address
 * 
 * Returns: { address: Address | null }
 */
router.get(
  '/address',
  authenticateUser,
  asyncHandler(getDefaultAddress)
);

/**
 * POST /user/fcm-token
 * Protected route (user auth) - Update user FCM token for push notifications
 * 
 * Body: { token: string }
 * Returns: Updated user object
 * 
 * Flow:
 * - Save/update FCM token to user record
 * - Token can be null to remove it
 * 
 * Errors:
 * - 400: Validation errors (missing/invalid token)
 * - 401: Authentication required (handled by authenticateUser)
 */
router.post(
  '/fcm-token',
  authenticateUser,
  validateRequest({
    body: [
      body('token')
        .notEmpty()
        .withMessage('FCM token is required')
        .isString()
        .withMessage('FCM token must be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('FCM token cannot be empty'),
    ],
  }),
  asyncHandler(updateFcmToken)
);

export default router;

