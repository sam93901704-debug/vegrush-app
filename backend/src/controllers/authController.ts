import { type Request, type Response } from 'express';
import { verifyGoogleIdToken } from '../services/googleService';
import { signJwt } from '../utils/jwt';
import { db } from '../db';
import { RequestWithUser } from '../types';

/**
 * User response type
 */
type UserResponse = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profilePic: string | null;
  phoneVerified: boolean;
};

/**
 * POST /auth/google
 * Authenticate user with Google ID token
 * 
 * Flow:
 * 1. Verify Google ID token
 * 2. Extract googleId, name, email, picture
 * 3. Upsert user in database
 * 4. Generate JWT token
 * 5. Return token and user data
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  // Step 1: Verify Google ID token
  let googleUser;
  try {
    googleUser = await verifyGoogleIdToken(idToken);
  } catch (error) {
    // Token verification errors return 401
    const message = error instanceof Error ? error.message : 'Google token verification failed';
    res.status(401).json({
      error: true,
      message: `Token verification failed: ${message}`,
    });
    return;
  }

  // Step 2: Extract data (already done by verifyGoogleIdToken)
  const { googleId, email, name, picture } = googleUser;

  // Step 3: Check if user exists and upsert
  let user;
  try {
    user = await db.user.upsert({
      where: { googleId },
      update: {
        name,
        email,
        profilePic: picture,
        // Don't update googleId (it's the unique key)
      },
      create: {
        googleId,
        name,
        email,
        profilePic: picture,
        phone: null,
        phoneVerified: false,
      },
    });
  } catch (error) {
    // Database errors return 500 through error handler
    // Re-throw to be caught by global error handler
    throw error;
  }

  // Step 4: Generate JWT token with userId and role
  let token: string;
  try {
    token = signJwt({
      userId: user.id,
      role: 'user',
    });
  } catch (error) {
    // JWT signing errors return 500 through error handler
    throw error;
  }

  // Step 5: Return response
  const userResponse: UserResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePic: user.profilePic,
    phoneVerified: user.phoneVerified,
  };

  res.status(200).json({
    success: true,
    token,
    user: userResponse,
  });
};

/**
 * GET /auth/me
 * Get current authenticated user
 * 
 * Flow:
 * - Requires authenticateUser middleware (user is already attached to req.user)
 * - Return user object with specific fields
 * 
 * Purpose:
 * - When app opens, user can auto-login using stored JWT token
 */
export const getCurrentUser = async (req: RequestWithUser, res: Response): Promise<void> => {
  const user = req.user!;

  // Format user response with required fields
  const userResponse: UserResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePic: user.profilePic,
    phoneVerified: user.phoneVerified,
  };

  res.status(200).json({
    user: userResponse,
  });
};

/**
 * Admin user response type
 */
type AdminUserResponse = {
  id: string;
  email: string;
  googleId: string;
  role: string;
};

/**
 * POST /auth/admin/google
 * Authenticate admin user with Google ID token
 * 
 * Flow:
 * 1. Verify Google idToken
 * 2. Check if email exists in AdminUser table
 * 3. If yes, generate JWT with role="admin"
 * 4. If not, return 403 "Not authorized"
 * 5. Return admin token and admin user details
 */
export const adminGoogleLogin = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  // Step 1: Verify Google ID token
  let googleUser;
  try {
    googleUser = await verifyGoogleIdToken(idToken);
  } catch (error) {
    // Token verification errors return 401
    const message = error instanceof Error ? error.message : 'Google token verification failed';
    res.status(401).json({
      error: true,
      message: `Token verification failed: ${message}`,
    });
    return;
  }

  // Step 2: Check if email exists in AdminUser table
  const { email, googleId } = googleUser;
  const adminUser = await db.adminUser.findUnique({
    where: { email },
  });

  // Step 3 & 4: Check if admin user exists
  if (!adminUser) {
    // Email not found in AdminUser table - return 403
    res.status(403).json({
      error: true,
      message: 'Not authorized',
    });
    return;
  }

  // Verify googleId matches (additional security check)
  if (adminUser.googleId !== googleId) {
    res.status(403).json({
      error: true,
      message: 'Not authorized',
    });
    return;
  }

  // Step 3: Generate JWT with role="admin"
  let token: string;
  try {
    token = signJwt({
      userId: adminUser.id, // Using userId field for consistency with UserJwtPayload
      role: 'admin',
    });
  } catch (error) {
    // JWT signing errors return 500 through error handler
    throw error;
  }

  // Step 5: Return admin token and admin user details
  const adminResponse: AdminUserResponse = {
    id: adminUser.id,
    email: adminUser.email,
    googleId: adminUser.googleId,
    role: adminUser.role,
  };

  res.status(200).json({
    success: true,
    token,
    admin: adminResponse,
  });
};

/**
 * Delivery boy response type
 */
type DeliveryBoyResponse = {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
  fcmToken: string | null;
  isActive: boolean;
};

/**
 * POST /auth/delivery/login
 * Authenticate delivery boy with phone
 * 
 * Body: { phone: string, fcmToken?: string }
 * 
 * Flow:
 * 1. Find DeliveryBoy by phone
 * 2. If not found → return 404
 * 3. Save/update fcmToken on DeliveryBoy record (if provided)
 * 4. Generate JWT with role="delivery" and {deliveryId}
 * 5. Return token and delivery profile (including fcmToken)
 * 
 * No OTP required for MVP.
 */
export const deliveryLogin = async (req: Request, res: Response): Promise<void> => {
  const { phone, fcmToken } = req.body;

  // Step 1: Find DeliveryBoy by phone
  let deliveryBoy = await db.deliveryBoy.findUnique({
    where: { phone: String(phone).trim() },
  });

  // Step 2: Check if found
  if (!deliveryBoy) {
    res.status(404).json({
      error: true,
      message: 'Delivery boy not found',
    });
    return;
  }

  // Step 3: Save/update fcmToken if provided
  if (fcmToken !== undefined) {
    deliveryBoy = await db.deliveryBoy.update({
      where: { id: deliveryBoy.id },
      data: {
        fcmToken: fcmToken ? String(fcmToken).trim() || null : null, // Empty string becomes null
      },
    });
  }

  // Step 4: Generate JWT with role="delivery" and {deliveryId}
  let token: string;
  try {
    token = signJwt({
      deliveryId: deliveryBoy.id,
      phone: deliveryBoy.phone,
      role: 'delivery',
    });
  } catch (error) {
    // JWT signing errors return 500 through error handler
    throw error;
  }

  // Step 5: Return token and delivery profile
  const deliveryResponse: DeliveryBoyResponse = {
    id: deliveryBoy.id,
    name: deliveryBoy.name,
    phone: deliveryBoy.phone,
    vehicleNumber: deliveryBoy.vehicleNumber,
    fcmToken: deliveryBoy.fcmToken || null,
    isActive: deliveryBoy.isActive,
  };

  res.status(200).json({
    success: true,
    token,
    delivery: deliveryResponse,
  });
};

