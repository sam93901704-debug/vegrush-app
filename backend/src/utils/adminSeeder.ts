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
    const adminEmail = 'sam93901704@gmail.com';
    const adminPassword = 'Sameer@123';

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      // Check if password is set
      const hasPassword = (existingAdmin as any).password;
      if (hasPassword) {
        logger.info('✅ Default admin user already exists');
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create or update admin user
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        role: 'admin',
        username: 'admin',
      },
      create: {
        email: adminEmail,
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      },
    });

    logger.info('✅ Default admin user created/updated successfully');
    logger.info(`   Email: ${adminEmail}`);
  } catch (error) {
    logger.error({ error }, '❌ Failed to create default admin user');
    // Don't throw - allow server to start even if admin creation fails
  }
}

