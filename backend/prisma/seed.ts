import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@123', 10);

  await prisma.adminUser.upsert({
    where: { username: 'vegrushadmin' },
    update: {},
    create: {
      username: 'vegrushadmin',
      password,
      email: 'sam93901703@gmail.com',
      role: 'admin',
    },
  });
}

main()
  .then(() => {
    console.log('✅ Admin user seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

