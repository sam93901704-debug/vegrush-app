import { type Response, type NextFunction } from 'express';
import { db } from '../db';
import { RequestWithUser } from '../types';

/**
 * Admin authentication middleware
 * Requires authenticate middleware to run first
 * Checks if the authenticated user is an admin
 * Returns 403 if user is not an admin
 */
export const adminAuth = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      res.status(401).json({
        error: true,
        message: 'Authentication required',
      });
      return;
    }

    // Check if user is an admin
    const adminUser = await db.adminUser.findUnique({
      where: { email: req.user.email },
    });

    if (!adminUser) {
      res.status(403).json({
        error: true,
        message: 'Admin access required',
      });
      return;
    }

    // Verify googleId matches
    if (adminUser.googleId !== req.user.googleId) {
      res.status(403).json({
        error: true,
        message: 'Admin access denied',
      });
      return;
    }

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin authentication failed';
    res.status(500).json({
      error: true,
      message: `Admin authentication error: ${message}`,
    });
  }
};

