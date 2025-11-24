import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * 
 * @param plainPassword - Plain text password to hash
 * @returns Hashed password string
 * @throws Error if hashing fails
 * 
 * @example
 * ```ts
 * const hash = await hashPassword('mySecurePassword123');
 * ```
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password is required and must be a string');
  }

  if (plainPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(plainPassword, salt);
    return hash;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to hash password: ${error.message}`);
    }
    throw new Error('Failed to hash password: Unknown error');
  }
}

/**
 * Compare a plain text password with a hashed password
 * 
 * @param plainPassword - Plain text password to compare
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 * @throws Error if comparison fails
 * 
 * @example
 * ```ts
 * const isValid = await comparePassword('myPassword', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password is required and must be a string');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password is required and must be a string');
  }

  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to compare password: ${error.message}`);
    }
    throw new Error('Failed to compare password: Unknown error');
  }
}

