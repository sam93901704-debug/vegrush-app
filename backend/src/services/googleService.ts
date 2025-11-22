import { OAuth2Client } from 'google-auth-library';

/**
 * Google token verification result
 */
export interface GoogleTokenPayload {
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
}

/**
 * Get Google OAuth2 client ID from environment variables
 * Throws error if not configured
 */
function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is not configured');
  }
  return clientId;
}

/**
 * Initialize Google OAuth2 client
 */
function getGoogleClient(): OAuth2Client {
  const clientId = getGoogleClientId();
  return new OAuth2Client(clientId);
}

/**
 * Verify a Google ID token and extract user information
 *
 * @param idToken - Google ID token string from the client
 * @returns User information from the verified token
 * @throws Error if token is invalid, expired, or verification fails
 *
 * @example
 * ```ts
 * try {
 *   const user = await verifyGoogleIdToken(idToken);
 *   console.log(user.googleId, user.email);
 * } catch (error) {
 *   console.error('Google token verification failed:', error.message);
 * }
 * ```
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID token is required and must be a string');
  }

  if (idToken.trim().length === 0) {
    throw new Error('Google ID token cannot be empty');
  }

  try {
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: getGoogleClientId(),
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Google ID token payload is missing');
    }

    // Extract required fields
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture || null;

    // Validate required fields
    if (!googleId) {
      throw new Error('Google ID token is missing user ID (sub)');
    }

    if (!email) {
      throw new Error('Google ID token is missing email address');
    }

    if (!name) {
      throw new Error('Google ID token is missing user name');
    }

    // Verify email is verified (if email_verified claim exists)
    if (payload.email_verified === false) {
      throw new Error('Google account email is not verified');
    }

    return {
      googleId,
      email,
      name,
      picture,
    };
  } catch (error) {
    // Handle specific Google Auth errors
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('Token used too early')) {
        throw new Error('Google ID token is not yet valid');
      }
      if (error.message.includes('Token used too late')) {
        throw new Error('Google ID token has expired');
      }
      if (error.message.includes('Invalid token signature')) {
        throw new Error('Google ID token signature is invalid');
      }
      if (error.message.includes('Wrong number of segments')) {
        throw new Error('Google ID token format is invalid');
      }
      // Re-throw with more context if it's already a descriptive error
      if (error.message.startsWith('Google ID token') || error.message.startsWith('Google account')) {
        throw error;
      }
      throw new Error(`Google ID token verification failed: ${error.message}`);
    }
    throw new Error('Google ID token verification failed: Unknown error');
  }
}

