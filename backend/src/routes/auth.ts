import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body } from '../middleware/validateRequest';
import { verifyGoogleIdToken } from '../services/googleService';
import { signJwt, type UserJwtPayload } from '../utils/jwt';
import { db } from '../db';

const router = Router();

/**
 * User response type (excludes sensitive fields)
 */
type SafeUser = {
  id: string;
  googleId: string;
  name: string;
  email: string;
  profilePic: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Exclude sensitive fields from user object
 */
function excludeSensitiveFields(user: {
  id: string;
  googleId: string;
  name: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  profilePic: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { phone, phoneVerified, ...safeUser } = user;
  return safeUser;
}

/**
 * POST /auth/google
 * Authenticate user with Google ID token
 * 
 * Body: { idToken: string }
 * Returns: { token: string, user: SafeUser }
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
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    // Verify Google ID token
    const googleUser = await verifyGoogleIdToken(idToken);

    // Upsert user in database
    const user = await db.user.upsert({
      where: { googleId: googleUser.googleId },
      update: {
        name: googleUser.name,
        email: googleUser.email,
        profilePic: googleUser.picture,
        // Don't update googleId on update (it's the unique key)
      },
      create: {
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        profilePic: googleUser.picture,
        phone: null,
        phoneVerified: false,
      },
    });

    // Sign JWT token
    const tokenPayload: Omit<UserJwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      role: 'user',
    };

    const token = signJwt(tokenPayload);

    // Return token and safe user object (excluding sensitive fields)
    const safeUser = excludeSensitiveFields(user);

    res.status(200).json({
      token,
      user: safeUser,
    });
  })
);

export default router;

