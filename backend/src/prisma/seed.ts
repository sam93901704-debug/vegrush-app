import prisma from './client';
import { Prisma } from '@prisma/client';

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Seed Products (5 demo products with realistic paise prices)
    console.log('📦 Creating products...');
    const products = [
      {
        name: 'Basmati Rice',
        description: 'Premium long grain basmati rice, 1kg pack',
        category: 'Grains & Pulses',
        price: 5000, // ₹50.00 in paise
        unitType: 'kg',
        unitValue: new Prisma.Decimal('1.0'),
        stockQty: new Prisma.Decimal('100.0'),
        imageUrl: null,
        isActive: true,
      },
      {
        name: 'Wheat Flour (Aata)',
        description: 'Fine quality whole wheat flour, 1kg pack',
        category: 'Grains & Pulses',
        price: 4000, // ₹40.00 in paise
        unitType: 'kg',
        unitValue: new Prisma.Decimal('1.0'),
        stockQty: new Prisma.Decimal('150.0'),
        imageUrl: null,
        isActive: true,
      },
      {
        name: 'Sugar',
        description: 'Pure white sugar, 1kg pack',
        category: 'Spices & Condiments',
        price: 4500, // ₹45.00 in paise
        unitType: 'kg',
        unitValue: new Prisma.Decimal('1.0'),
        stockQty: new Prisma.Decimal('80.0'),
        imageUrl: null,
        isActive: true,
      },
      {
        name: 'Fresh Milk',
        description: 'Full cream fresh milk, 1 liter',
        category: 'Dairy',
        price: 6000, // ₹60.00 in paise
        unitType: 'liter',
        unitValue: new Prisma.Decimal('1.0'),
        stockQty: new Prisma.Decimal('50.0'),
        imageUrl: null,
        isActive: true,
      },
      {
        name: 'Onions',
        description: 'Fresh red onions, 1kg',
        category: 'Vegetables',
        price: 3000, // ₹30.00 in paise
        unitType: 'kg',
        unitValue: new Prisma.Decimal('1.0'),
        stockQty: new Prisma.Decimal('200.0'),
        imageUrl: null,
        isActive: true,
      },
    ];

    const createdProducts = [];
    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { name: product.name },
      });

      if (existing) {
        const updated = await prisma.product.update({
          where: { id: existing.id },
          data: product,
        });
        createdProducts.push(updated);
        console.log(`  ✓ Updated product: ${product.name}`);
      } else {
        const created = await prisma.product.create({
          data: product,
        });
        createdProducts.push(created);
        console.log(`  ✓ Created product: ${product.name}`);
      }
    }
    console.log(`✅ Created/Updated ${createdProducts.length} products\n`);

    // Seed AdminUser
    console.log('👤 Creating admin user...');
    const adminUser = await prisma.adminUser.upsert({
      where: { email: 'admin@example.com' },
      update: {
        googleId: 'google_admin_placeholder_123',
        role: 'admin',
      },
      create: {
        email: 'admin@example.com',
        googleId: 'google_admin_placeholder_123',
        role: 'admin',
      },
    });
    console.log(`✅ Admin user created/updated: ${adminUser.email}\n`);

    // Seed DeliveryBoys (2 entries)
    console.log('🚚 Creating delivery boys...');
    const deliveryBoys = [
      {
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        vehicleNumber: 'DL-01-AB-1234',
        isActive: true,
      },
      {
        name: 'Amit Singh',
        phone: '+919876543211',
        vehicleNumber: 'DL-01-CD-5678',
        isActive: true,
      },
    ];

    const createdDeliveryBoys = [];
    for (const deliveryBoy of deliveryBoys) {
      const created = await prisma.deliveryBoy.upsert({
        where: { phone: deliveryBoy.phone },
        update: {
          name: deliveryBoy.name,
          vehicleNumber: deliveryBoy.vehicleNumber,
          isActive: deliveryBoy.isActive,
        },
        create: deliveryBoy,
      });
      createdDeliveryBoys.push(created);
      console.log(`  ✓ Created/Updated delivery boy: ${deliveryBoy.name}`);
    }
    console.log(`✅ Created/Updated ${createdDeliveryBoys.length} delivery boys\n`);

    // Seed Sample User with Address
    console.log('👥 Creating sample user with address...');
    const sampleUser = await prisma.user.upsert({
      where: { googleId: 'google_user_placeholder_456' },
      update: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: null,
        phoneVerified: false,
        profilePic: null,
      },
      create: {
        googleId: 'google_user_placeholder_456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: null,
        phoneVerified: false,
        profilePic: null,
      },
    });
    console.log(`✅ Sample user created/updated: ${sampleUser.email}`);

    // Create address for the sample user (idempotent)
    const existingAddress = await prisma.address.findFirst({
      where: { userId: sampleUser.id },
    });

    const addressData = {
      userId: sampleUser.id,
      label: 'Home',
      latitude: new Prisma.Decimal('28.6139'),
      longitude: new Prisma.Decimal('77.2090'),
      fullAddress: '123 Main Street, Connaught Place, New Delhi',
      city: 'New Delhi',
      pincode: '110001',
      isDefault: true,
    };

    const sampleAddress = existingAddress
      ? await prisma.address.update({
          where: { id: existingAddress.id },
          data: addressData,
        })
      : await prisma.address.create({
          data: addressData,
        });
    console.log(`✅ Sample address created/updated: ${sampleAddress.fullAddress}\n`);

    // Summary
    console.log('📊 Seed Summary:');
    console.log(`  • Products: ${createdProducts.length}`);
    console.log(`  • Admin Users: 1`);
    console.log(`  • Delivery Boys: ${createdDeliveryBoys.length}`);
    console.log(`  • Sample Users: 1`);
    console.log(`  • Sample Addresses: 1`);
    console.log('\n✅ Database seed completed successfully!');
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
