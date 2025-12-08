const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'مدير النظام',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ User created:', user.email);

  // Create demo business
  const business = await prisma.business.upsert({
    where: { slug: 'demo-business' },
    update: {},
    create: {
      name: 'مؤسسة تجريبية',
      slug: 'demo-business',
      email: 'info@demo.com',
      whatsappPhone: '966501234567',
      googleReviewUrl: 'https://g.page/r/XXXXX/review',
      totalViews: 150,
      totalFeedback: 0,
      averageRating: 0,
    },
  });

  console.log('✅ Business created:', business.name);

  // Link user to business
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ownedBusinesses: [business.id],
    },
  });

  console.log('✅ User linked to business');

  // Create demo feedbacks
  const feedbacksData = [
    { rating: 5, comment: 'خدمة ممتازة وتعامل رائع!', visitorName: 'أحمد محمد' },
    { rating: 4, comment: 'جيد جداً', visitorName: 'فاطمة علي' },
    { rating: 5, comment: 'أفضل تجربة!', visitorName: 'محمد خالد' },
    { rating: 5, comment: 'سرعة في الخدمة', visitorName: 'سارة أحمد' },
    { rating: 3, comment: 'جيد', visitorName: 'عبدالله' },
  ];

  // حذف التقييمات القديمة للـ business
  await prisma.feedback.deleteMany({
    where: { businessId: business.id },
  });

  const feedbacks = await Promise.all(
    feedbacksData.map(data =>
      prisma.feedback.create({
        data: {
          businessId: business.id,
          ...data,
          status: 'approved',
        },
      })
    )
  );

  console.log(`✅ Created ${feedbacks.length} feedbacks`);

  // Calculate average rating
  const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
  const avgRating = totalRating / feedbacks.length;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      totalFeedback: feedbacks.length,
      averageRating: avgRating,
    },
  });

  console.log('✅ Business stats updated');

  // Create some daily analytics
  const today = new Date();
  
  // حذف التحليلات القديمة
  await prisma.dailyAnalytics.deleteMany({
    where: { businessId: business.id },
  });

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    await prisma.dailyAnalytics.create({
      data: {
        businessId: business.id,
        date,
        views: Math.floor(Math.random() * 50) + 10,
        feedbacks: Math.floor(Math.random() * 10) + 1,
        avgRating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
        rating1: Math.floor(Math.random() * 2),
        rating2: Math.floor(Math.random() * 3),
        rating3: Math.floor(Math.random() * 5),
        rating4: Math.floor(Math.random() * 8),
        rating5: Math.floor(Math.random() * 10) + 5,
      },
    });
  }

  console.log('✅ Daily analytics created');

  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: admin@example.com');
  console.log('Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔗 URLs:');
  console.log('Dashboard: http://localhost:3000/dashboard');
  console.log('Feedback Page: http://localhost:3000/r/demo-business');
  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
