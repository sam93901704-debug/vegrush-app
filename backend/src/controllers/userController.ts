import { type Response } from 'express';
import { db } from '../db';
import { RequestWithUser } from '../types';
import { Prisma } from '@prisma/client';

/**
 * Update user phone number
 * POST /user/phone
 * 
 * Body: { phone: string }
 * Returns: Updated user object
 */
export const updatePhone = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { phone } = req.body;
  const userId = req.user!.id;

  // Phone is already validated by validateRequest middleware (exactly 10 digits)
  const phoneStr = String(phone).trim();

  try {
    // Check if phone is already used by another user
    const existingUser = await db.user.findUnique({
      where: { phone: phoneStr },
    });

    // If phone exists and belongs to a different user, return 409
    if (existingUser && existingUser.id !== userId) {
      res.status(409).json({
        error: true,
        message: 'Phone already registered',
      });
      return;
    }

    // If phone is already set for this user, return the user as-is
    if (existingUser && existingUser.id === userId) {
      res.status(200).json(existingUser);
      return;
    }

    // Update user's phone
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        phone: phoneStr,
        // Reset phoneVerified when phone is updated
        phoneVerified: false,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    // Handle Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('phone')) {
          res.status(409).json({
            error: true,
            message: 'Phone already registered',
          });
          return;
        }
      }
    }

    // Re-throw other errors to be handled by global error handler
    throw error;
  }
};

/**
 * Update user location (address)
 * POST /user/location
 * 
 * Body: { latitude, longitude, fullAddress, city, pincode }
 * Returns: Updated or created address object
 */
export const updateLocation = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { latitude, longitude, fullAddress, city, pincode } = req.body;
  const userId = req.user!.id;

  // All fields are validated by middleware
  // latitude and longitude are already validated as numbers
  // pincode is already validated as 6 digits

  try {
    // Check if user has an existing default address
    const existingDefaultAddress = await db.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    let address;

    if (existingDefaultAddress) {
      // Update existing default address
      address = await db.address.update({
        where: { id: existingDefaultAddress.id },
        data: {
          latitude: new Prisma.Decimal(latitude),
          longitude: new Prisma.Decimal(longitude),
          fullAddress,
          city: city || null,
          pincode: pincode || null,
          // Keep isDefault = true
        },
      });
    } else {
      // Create new address with isDefault = true
      address = await db.address.create({
        data: {
          userId,
          latitude: new Prisma.Decimal(latitude),
          longitude: new Prisma.Decimal(longitude),
          fullAddress,
          city: city || null,
          pincode: pincode || null,
          isDefault: true,
        },
      });
    }

    res.status(200).json(address);
  } catch (error) {
    // Re-throw errors to be handled by global error handler
    throw error;
  }
};

/**
 * Get user's default address
 * GET /user/address
 * 
 * Returns: Default address object or null
 */
export const getDefaultAddress = async (req: RequestWithUser, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    // Get user's default address
    const defaultAddress = await db.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!defaultAddress) {
      // Try to get any address for the user
      const anyAddress = await db.address.findFirst({
        where: { userId },
      });

      if (!anyAddress) {
        res.status(200).json({ address: null });
        return;
      }

      res.status(200).json({ address: anyAddress });
      return;
    }

    res.status(200).json({ address: defaultAddress });
  } catch (error) {
    // Re-throw errors to be handled by global error handler
    throw error;
  }
};

/**
 * Update user FCM token
 * POST /user/fcm-token
 * 
 * Body: { token: string }
 * Returns: Updated user object
 */
export const updateFcmToken = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { token } = req.body;
  const userId = req.user!.id;

  // Token is already validated by validateRequest middleware
  const tokenStr = token ? String(token).trim() : null;

  try {
    // Update user's FCM token (set to null if empty string)
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        fcmToken: tokenStr || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        profilePic: true,
        fcmToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    // Re-throw errors to be handled by global error handler
    throw error;
  }
};

