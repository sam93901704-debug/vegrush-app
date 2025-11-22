import { Request } from 'express';
import { User } from '@prisma/client';

/**
 * Extended Express Request with authenticated user
 * Used with authenticateUser middleware
 */
export interface RequestWithUser extends Request {
  user?: User & { role?: string };
}

