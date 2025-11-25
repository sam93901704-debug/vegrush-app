import { type Request, type Response } from 'express';
import { hashPassword, comparePassword } from '../utils/password';
import { signJwt, type UserJwtPayload } from '../utils/jwt';
import { db } from '../db';
import pino from 'pino';

const logger = pino();

/**
 * User response type (without sensitive data)
 */
type UserResponse = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

/**
 * POST /api/auth/signup
 * Register a new customer user with email/phone and password
 * 
 * Body: { name?, email?, phone?, password }
 * - Requires: password and either email or phone
 * - Validates: email format, phone format, password min length
 * - Returns: { user: UserResponse, token: string }
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, password } = req.body;

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      error: true,
      message: 'Password is required and must be at least 6 characters',
    });
    return;
  }

  // Validate that at least email or phone is provided
  if (!email && !phone) {
    res.status(400).json({
      error: true,
      message: 'Either email or phone is required',
    });
    return;
  }

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      error: true,
      message: 'Invalid email format',
    });
    return;
  }

  // Validate phone format if provided (basic: 10+ digits)
  if (phone && !/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
    res.status(400).json({
      error: true,
      message: 'Invalid phone format',
    });
    return;
  }

  try {
    // Check if user already exists (by email or phone)
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      res.status(409).json({
        error: true,
        message: 'User with this email or phone already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        name: name || (email ? email.split('@')[0] : phone) || 'User',
        email: email || undefined,
        phone: phone || undefined,
        password: hashedPassword,
        googleId: undefined, // Password-based user
        role: 'customer',
        phoneVerified: false,
      },
    });

    // Generate JWT token
    const token = signJwt<UserJwtPayload>({
      userId: user.id,
      role: 'customer',
    });

    logger.info({ userId: user.id, email: user.email, phone: user.phone }, 'User signed up');

    // Return response (exclude password)
    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: (user as any).role || 'customer',
    };

    res.status(201).json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Signup failed');
    throw error; // Let error handler catch it
  }
};

/**
 * POST /api/auth/login
 * Authenticate user with email/phone and password
 * 
 * Body: { identifier: string, password: string }
 * - identifier can be email or phone
 * - Returns: { user: UserResponse, token: string }
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({
      error: true,
      message: 'Identifier (email/phone) and password are required',
    });
    return;
  }

  try {
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    
    // Find user by email or phone
    const user = await db.user.findUnique({
      where: isEmail
        ? { email: identifier }
        : { phone: identifier },
    });

    if (!user) {
      logger.warn({ identifier }, 'Login attempt with non-existent user');
      res.status(401).json({
        error: true,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if user has a password (not Google OAuth only)
    const userPassword = (user as any).password;
    if (!userPassword) {
      res.status(401).json({
        error: true,
        message: 'This account uses Google login. Please use Google sign-in.',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, userPassword);

    if (!isPasswordValid) {
      logger.warn({ userId: user.id }, 'Login attempt with invalid password');
      res.status(401).json({
        error: true,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate JWT token
    const userRole = (user as any).role || 'customer';
    const token = signJwt<UserJwtPayload>({
      userId: user.id,
      role: userRole,
    });

    logger.info({ userId: user.id }, 'User logged in');

    // Return response
    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: userRole,
    };

    res.status(200).json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Login failed');
    throw error;
  }
};

/**
 * Admin user response type
 */
type AdminUserResponse = {
  id: string;
  username: string;
  email: string | null;
  role: string;
};

/**
 * POST /api/auth/admin/login
 * Authenticate admin user with username and password
 * 
 * Body: { username: string, password: string }
 * Returns: { admin: AdminUserResponse, token: string }
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      error: true,
      message: 'Username and password are required',
    });
    return;
  }

  try {
    // Find admin user by username
    const adminUser = await db.adminUser.findUnique({
      where: {
        username: username,
      },
    });

    if (!adminUser) {
      logger.warn({ username }, 'Admin login attempt with non-existent username');
      res.status(401).json({
        error: true,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if admin has a password
    const adminPassword = (adminUser as any).password;
    if (!adminPassword) {
      res.status(401).json({
        error: true,
        message: 'This admin account uses Google login. Please use Google sign-in.',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, adminPassword);

    if (!isPasswordValid) {
      logger.warn({ adminId: adminUser.id }, 'Admin login attempt with invalid password');
      res.status(401).json({
        error: true,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate JWT token
    const token = signJwt<UserJwtPayload>({
      userId: adminUser.id,
      role: 'admin',
    });

    logger.info({ adminId: adminUser.id, username }, 'Admin logged in');

    // Return response
    const adminResponse: AdminUserResponse = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email ?? null,
      role: adminUser.role,
    };

    res.status(200).json({
      success: true,
      admin: adminResponse,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Admin login failed');
    throw error;
  }
};

/**
 * Delivery user response type
 */
type DeliveryUserResponse = {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
  isActive: boolean;
};

/**
 * POST /api/auth/delivery/signup
 * Register a new delivery user with phone and password
 * 
 * Body: { name: string, phone: string, password: string, vehicleNumber?: string }
 * Returns: { delivery: DeliveryUserResponse, token: string }
 */
export const deliverySignup = async (req: Request, res: Response): Promise<void> => {
  const { name, phone, password, vehicleNumber } = req.body;

  if (!name || !phone || !password) {
    res.status(400).json({
      error: true,
      message: 'Name, phone, and password are required',
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      error: true,
      message: 'Password must be at least 6 characters',
    });
    return;
  }

  // Validate phone format
  if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
    res.status(400).json({
      error: true,
      message: 'Invalid phone format',
    });
    return;
  }

  try {
    // Check if delivery user already exists
    const existingDelivery = await db.deliveryBoy.findUnique({
      where: { phone },
    });

    if (existingDelivery) {
      res.status(409).json({
        error: true,
        message: 'Delivery user with this phone already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create delivery user
    // Note: password field needs Prisma client regeneration
    const deliveryUser = await db.deliveryBoy.create({
      data: {
        name,
        phone,
        password: hashedPassword as any, // Type assertion until Prisma client regenerates
        vehicleNumber: vehicleNumber || undefined,
        isActive: true,
      } as any,
    });

    // Generate JWT token
    const token = signJwt({
      deliveryId: deliveryUser.id,
      phone: deliveryUser.phone,
      role: 'delivery',
    });

    logger.info({ deliveryId: deliveryUser.id, phone }, 'Delivery user signed up');

    // Return response
    const deliveryResponse: DeliveryUserResponse = {
      id: deliveryUser.id,
      name: deliveryUser.name,
      phone: deliveryUser.phone,
      vehicleNumber: deliveryUser.vehicleNumber,
      isActive: deliveryUser.isActive,
    };

    res.status(201).json({
      success: true,
      delivery: deliveryResponse,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Delivery signup failed');
    throw error;
  }
};

/**
 * POST /api/auth/delivery/login
 * Authenticate delivery user with phone and password
 * 
 * Body: { phone: string, password: string, fcmToken?: string }
 * Returns: { delivery: DeliveryUserResponse, token: string }
 */
export const deliveryLogin = async (req: Request, res: Response): Promise<void> => {
  const { phone, password, fcmToken } = req.body;

  if (!phone || !password) {
    res.status(400).json({
      error: true,
      message: 'Phone and password are required',
    });
    return;
  }

  try {
    // Find delivery user by phone
    let deliveryUser = await db.deliveryBoy.findUnique({
      where: { phone },
    });

    if (!deliveryUser) {
      logger.warn({ phone }, 'Delivery login attempt with non-existent phone');
      res.status(401).json({
        error: true,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if delivery user has a password
    const deliveryPassword = (deliveryUser as any).password;
    if (!deliveryPassword) {
      res.status(401).json({
        error: true,
        message: 'Password not set for this delivery account',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, deliveryPassword);

    if (!isPasswordValid) {
      logger.warn({ deliveryId: deliveryUser.id }, 'Delivery login attempt with invalid password');
      res.status(401).json({
        error: true,
        message: 'Invalid credentials',
      });
      return;
    }

    // Update FCM token if provided
    if (fcmToken !== undefined) {
      deliveryUser = await db.deliveryBoy.update({
        where: { id: deliveryUser.id },
        data: {
          fcmToken: fcmToken ? String(fcmToken).trim() || null : null,
        },
      });
    }

    // Generate JWT token
    const token = signJwt({
      deliveryId: deliveryUser.id,
      phone: deliveryUser.phone,
      role: 'delivery',
    });

    logger.info({ deliveryId: deliveryUser.id, phone }, 'Delivery user logged in');

    // Return response
    const deliveryResponse: DeliveryUserResponse = {
      id: deliveryUser.id,
      name: deliveryUser.name,
      phone: deliveryUser.phone,
      vehicleNumber: deliveryUser.vehicleNumber,
      isActive: deliveryUser.isActive,
    };

    res.status(200).json({
      success: true,
      delivery: deliveryResponse,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Delivery login failed');
    throw error;
  }
};

