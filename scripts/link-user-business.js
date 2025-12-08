const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ⬅️ غيّر البريد هنا إلى بريدك
  const email = 'almorese2013@gmail.com';
  
  console.log(`🔧 Linking user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('👤 User found:', user.name || user.email);
  console.log('📦 Current businesses:', user.ownedBusinesses);

  // احصل على جميع الأعمال
  const businesses = await prisma.business.findMany();

  if (businesses.length === 0) {
    console.log('❌ No businesses found!');
    console.log('💡 Run: npm run seed');
    return;
  }

  console.log(`\n✅ Found ${businesses.length} business(es):`);
  businesses.forEach(b => {
    console.log(`  - ${b.name} (${b.slug})`);
  });

  // اربط المستخدم بجميع الأعمال
  const businessIds = businesses.map(b => b.id);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ownedBusinesses: businessIds,
    },
  });

  console.log('\n🎉 Done! User linked to all businesses!');
  console.log('✅ Now reload: http://localhost:3000/dashboard');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
