import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting admin user seed...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Hash password with bcrypt (10 salt rounds)
    const plainPassword = 'Sameer@123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('✅ Password hashed\n');

    // Create or update admin user (idempotent)
    console.log('👤 Creating/updating admin user...');
    const adminUser = await prisma.adminUser.upsert({
      where: { email: 'sam93901703@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'admin',
        username: 'admin',
      },
      create: {
        email: 'sam93901703@gmail.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      },
    });

    console.log(`✅ Admin user created/updated successfully!`);
    console.log(`   Email: ${adminUser.email || 'N/A'}`);
    console.log(`   Username: ${adminUser.username || 'N/A'}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}\n`);

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main()
  .then(() => {
    console.log('\n✨ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed script failed:', error);
    process.exit(1);
  });

