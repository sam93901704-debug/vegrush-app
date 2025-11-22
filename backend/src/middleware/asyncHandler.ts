import { type Request, type Response, type NextFunction } from 'express';

/**
 * Wrapper for async route handlers to automatically catch errors
 * and pass them to the error handling middleware
 *
 * @example
 * ```ts
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await db.user.findMany();
 *   res.json(users);
 * }));
 * ```
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

