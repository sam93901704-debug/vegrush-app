import { type Request, type Response, type NextFunction } from 'express';
import { verifyJwt, type DeliveryJwtPayload } from '../utils/jwt';
import { db } from '../db';

/**
 * Extended Express Request with authenticated delivery boy
 */
export interface RequestWithDelivery extends Request {
  deliveryBoy?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string | null;
    isActive: boolean;
  };
}

/**
 * Delivery authentication middleware
 * Verifies JWT token from Authorization header with role = 'delivery'
 * Attaches delivery boy to request
 * Returns 401 if token is missing, invalid, or delivery boy not found
 */
export const deliveryAuth = async (
  req: RequestWithDelivery,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: true,
        message: 'Authorization header is required',
      });
      return;
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: true,
        message: 'Authorization header must start with "Bearer "',
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token || token.trim().length === 0) {
      res.status(401).json({
        error: true,
        message: 'Token is required',
      });
      return;
    }

    // Verify JWT token
    let payload: DeliveryJwtPayload;
    try {
      const decoded = verifyJwt(token);
      
      // Check if token has delivery role
      if (!('role' in decoded) || decoded.role !== 'delivery') {
        res.status(401).json({
          error: true,
          message: 'Invalid token: delivery role required',
        });
        return;
      }

      payload = decoded as DeliveryJwtPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      res.status(401).json({
        error: true,
        message: `Token verification failed: ${message}`,
      });
      return;
    }

    // Fetch delivery boy from database
    const deliveryBoy = await db.deliveryBoy.findUnique({
      where: { id: payload.deliveryId },
    });

    if (!deliveryBoy) {
      res.status(401).json({
        error: true,
        message: 'Delivery boy not found',
      });
      return;
    }

    // Verify phone matches (additional security check)
    if (deliveryBoy.phone !== payload.phone) {
      res.status(401).json({
        error: true,
        message: 'Token does not match delivery boy',
      });
      return;
    }

    // Check if delivery boy is active
    if (!deliveryBoy.isActive) {
      res.status(403).json({
        error: true,
        message: 'Delivery boy account is inactive',
      });
      return;
    }

    // Attach delivery boy to request
    req.deliveryBoy = {
      id: deliveryBoy.id,
      name: deliveryBoy.name,
      phone: deliveryBoy.phone,
      vehicleNumber: deliveryBoy.vehicleNumber,
      isActive: deliveryBoy.isActive,
    };

    next();
  } catch (error) {
    // Handle unexpected errors
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(500).json({
      error: true,
      message: `Delivery authentication error: ${message}`,
    });
  }
};

