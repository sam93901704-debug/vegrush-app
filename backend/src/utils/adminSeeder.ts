import prisma from '../prisma/client';
import bcrypt from 'bcryptjs';
import pino from 'pino';

const logger = pino();

/**
 * Create default admin user if it doesn't exist
 * This runs on server startup to ensure admin user exists
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const adminUsername = 'vegrushadmin';
    const adminPassword = 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { username: adminUsername },
    });

    if (existingAdmin) {
      logger.info('✅ Default admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        email: 'sam93901703@gmail.com',
        role: 'admin',
      },
    });

    logger.info('✅ Default admin user created successfully');
    logger.info(`   Username: ${adminUsername}`);
  } catch (error) {
    logger.error({ error }, '❌ Failed to create default admin user');
    // Don't throw - allow server to start even if admin creation fails
  }
}

