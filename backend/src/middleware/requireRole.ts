import { type Response, type NextFunction } from 'express';
import { RequestWithUser } from '../types';

/**
 * Require role middleware
 * Checks if the authenticated user has one of the required roles
 * Must be used after authenticateUser middleware
 * 
 * Flow:
 * 1. After authenticateUser, check req.user.role
 * 2. If role not in roles → return 403
 * 3. Else → next()
 * 
 * @param roles - Array of allowed roles (e.g., ["admin"], ["delivery"], ["user"])
 * 
 * @example
 * ```ts
 * router.get('/admin/users', authenticateUser, requireRole(["admin"]), asyncHandler(getUsers));
 * router.get('/delivery/orders', authenticateUser, requireRole(["delivery"]), asyncHandler(getOrders));
 * router.get('/profile', authenticateUser, requireRole(["user", "admin"]), asyncHandler(getProfile));
 * ```
 */
export const requireRole = (roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated (should be set by authenticateUser middleware)
    if (!req.user) {
      res.status(401).json({
        error: true,
        message: 'Authentication required',
      });
      return;
    }

    // Check if user has a role
    const userRole = req.user.role;

    if (!userRole) {
      res.status(403).json({
        error: true,
        message: 'User role not found',
      });
      return;
    }

    // Check if user's role is in the allowed roles array
    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: true,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    // Role is valid, continue
    next();
  };
};

