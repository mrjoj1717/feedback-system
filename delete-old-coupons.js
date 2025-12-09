const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOldCoupons() {
  console.log('🗑️ Deleting old coupons...');

  try {
    const result = await prisma.coupon.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} coupons`);
    console.log('🎉 Done! Now you can create new coupons with the updated schema.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldCoupons();
