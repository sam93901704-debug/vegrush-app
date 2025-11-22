import jwt from 'jsonwebtoken';

/**
 * JWT token payload types
 */
export interface BaseJwtPayload {
  iat?: number;
  exp?: number;
}

export interface UserJwtPayload extends BaseJwtPayload {
  userId: string;
  role: string;
}

export interface AdminJwtPayload extends BaseJwtPayload {
  adminId: string;
  email: string;
  googleId: string;
  role: string;
}

export interface DeliveryJwtPayload extends BaseJwtPayload {
  deliveryId: string;
  phone: string;
  role: 'delivery';
}

export type JwtPayload = UserJwtPayload | AdminJwtPayload | DeliveryJwtPayload;

/**
 * Get JWT secret from environment variables
 * Throws error if not configured
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  if (secret === 'replace_me_with_long_random') {
    throw new Error('JWT_SECRET must be changed from default value');
  }
  return secret;
}

/**
 * Sign a JWT token with the given payload
 *
 * @param payload - Token payload to sign
 * @param expiresIn - Token expiration time (default: '7d')
 * @returns Signed JWT token string
 * @throws Error if JWT_SECRET is not configured or signing fails
 *
 * @example
 * ```ts
 * const token = signJwt({ userId: '123', email: 'user@example.com', googleId: 'google_123' });
 * ```
 */
export function signJwt<T extends BaseJwtPayload>(
  payload: Omit<T, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): string {
  try {
    const secret = getJwtSecret();
    const token = jwt.sign(payload, secret, {
      expiresIn,
      issuer: 'your-app',
    });
    return token;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to sign JWT token: ${error.message}`);
    }
    throw new Error('Failed to sign JWT token: Unknown error');
  }
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or verification fails
 *
 * @example
 * ```ts
 * const payload = verifyJwt<UserJwtPayload>(token);
 * console.log(payload.userId);
 * ```
 */
export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string): T {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'your-app',
    }) as T;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('JWT token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Invalid JWT token: ${error.message}`);
    }
    if (error instanceof jwt.NotBeforeError) {
      throw new Error(`JWT token not active: ${error.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to verify JWT token: ${error.message}`);
    }
    throw new Error('Failed to verify JWT token: Unknown error');
  }
}

/**
 * Decode a JWT token without verification (for debugging only)
 * WARNING: This does not verify the token signature
 *
 * @param token - JWT token string to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeJwt<T extends JwtPayload = JwtPayload>(token: string): T | null {
  try {
    const decoded = jwt.decode(token) as T | null;
    return decoded;
  } catch {
    return null;
  }
}

