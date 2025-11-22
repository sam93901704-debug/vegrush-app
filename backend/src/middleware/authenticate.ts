import { type Response, type NextFunction } from 'express';
import { verifyJwt, type JwtPayload, type UserJwtPayload, type DeliveryJwtPayload } from '../utils/jwt';
import { db } from '../db';
import { RequestWithUser } from '../types';

/**
 * Authenticate user middleware
 * Verifies JWT token from Authorization header and attaches user to request
 * Supports all roles: user, admin, delivery
 * 
 * Flow:
 * 1. Read Authorization header: "Bearer <token>"
 * 2. If missing → return 401 with "No token" message
 * 3. Verify JWT using verifyJwt()
 * 4. Fetch user from database based on role (User, AdminUser, or DeliveryBoy)
 * 5. If user doesn't exist → return 401
 * 6. Attach user object to req.user
 * 7. Call next()
 */
export const authenticateUser = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Step 1: Read Authorization header
  const authHeader = req.headers.authorization;

  // Step 2: Check if missing
  if (!authHeader) {
    res.status(401).json({
      error: true,
      message: 'No token',
    });
    return;
  }

  // Extract token from "Bearer <token>" format
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: true,
      message: 'No token',
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token || token.trim().length === 0) {
    res.status(401).json({
      error: true,
      message: 'No token',
    });
    return;
  }

  // Step 3: Verify JWT
  let payload: JwtPayload;
  try {
    payload = verifyJwt<JwtPayload>(token);
  } catch (error) {
    res.status(401).json({
      error: true,
      message: 'Invalid token',
    });
    return;
  }

  // Check if role exists in payload
  if (!payload.role) {
    res.status(401).json({
      error: true,
      message: 'Invalid token: role not found',
    });
    return;
  }

  // Step 4: Fetch user from database based on role
  let user;
  let userId: string;

  if (payload.role === 'delivery') {
    // Delivery tokens have deliveryId instead of userId
    const deliveryPayload = payload as DeliveryJwtPayload;
    userId = deliveryPayload.deliveryId;

    const deliveryBoy = await db.deliveryBoy.findUnique({
      where: { id: userId },
    });

    if (!deliveryBoy) {
      res.status(401).json({
        error: true,
        message: 'Delivery boy not found',
      });
      return;
    }

    // Convert DeliveryBoy to User-like structure for req.user
    user = {
      id: deliveryBoy.id,
      googleId: '', // Not applicable for delivery
      name: deliveryBoy.name,
      email: '', // Not applicable for delivery
      phone: deliveryBoy.phone,
      phoneVerified: false,
      profilePic: null,
      createdAt: deliveryBoy.createdAt,
      updatedAt: deliveryBoy.createdAt,
    };
  } else if (payload.role === 'admin') {
    // Admin tokens use userId field (which is actually adminId)
    const userPayload = payload as UserJwtPayload;
    userId = userPayload.userId;

    const adminUser = await db.adminUser.findUnique({
      where: { id: userId },
    });

    if (!adminUser) {
      res.status(401).json({
        error: true,
        message: 'Admin user not found',
      });
      return;
    }

    // Convert AdminUser to User-like structure for req.user
    user = {
      id: adminUser.id,
      googleId: adminUser.googleId,
      name: '', // AdminUser doesn't have name, we'll use email
      email: adminUser.email,
      phone: null,
      phoneVerified: false,
      profilePic: null,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.createdAt,
    };
  } else {
    // Regular user tokens
    const userPayload = payload as UserJwtPayload;
    userId = userPayload.userId;

    user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({
        error: true,
        message: 'User not found',
      });
      return;
    }
  }

  // Step 5 & 6: Attach user to request with role from JWT payload
  req.user = {
    ...user,
    role: payload.role,
  };

  // Step 7: Call next()
  next();
};

/**
 * Legacy authenticate function (kept for backward compatibility)
 * @deprecated Use authenticateUser instead
 */
export const authenticate = authenticateUser;

