import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    // التحقق من وجود Business
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // الحصول على التاريخ قبل 30 يوم
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. إجمالي الزيارات
    const totalVisits = await prisma.view.count({
      where: { businessId: id },
    });

    // 2. الزيارات آخر 30 يوم
    const recentVisits = await prisma.view.count({
      where: {
        businessId: id,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // 3. إجمالي التقييمات
    const totalFeedbacks = await prisma.feedback.count({
      where: { businessId: id },
    });

    // 4. التقييمات الإيجابية (3-5 نجوم)
    const positiveFeedbacks = await prisma.feedback.count({
      where: {
        businessId: id,
        rating: { gte: 3 },
      },
    });

    // 5. التقييمات السلبية (1-2 نجوم)
    const negativeFeedbacks = await prisma.feedback.count({
      where: {
        businessId: id,
        rating: { lte: 2 },
      },
    });

    // 6. متوسط التقييم
    const averageRating = business.averageRating || 0;

    // 7. معدل التحويل
    const conversionRate = totalVisits > 0 
      ? ((totalFeedbacks / totalVisits) * 100).toFixed(2)
      : '0.00';

    // 8. الكوبونات المستخدمة
    const couponsUsed = await prisma.coupon.count({
      where: {
        businessId: id,
        isUsed: true,
      },
    });

    // 9. الكوبونات النشطة
    const activeCoupons = await prisma.coupon.count({
      where: {
        businessId: id,
        isActive: true,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    // 10. توزيع التقييمات
    const ratingDistribution = [
      { rating: 5, count: business.rating5 || 0 },
      { rating: 4, count: business.rating4 || 0 },
      { rating: 3, count: business.rating3 || 0 },
      { rating: 2, count: business.rating2 || 0 },
      { rating: 1, count: business.rating1 || 0 },
    ];

    // 11. مصادر الزيارات
    const allViews = await prisma.view.findMany({
      where: { businessId: id },
      select: { source: true },
    });

    const visitSources = allViews.reduce((acc, view) => {
      const source = view.source || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const visitSourcesArray = Object.entries(visitSources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // 12. أوقات الذروة
    const allViewsWithTime = await prisma.view.findMany({
      where: { businessId: id },
      select: { createdAt: true },
      take: 1000,
    });

    const hourlyViews = allViewsWithTime.reduce((acc, view) => {
      const hour = view.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Object.entries(hourlyViews)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 13. التقييمات اليومية (آخر 7 أيام)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentFeedbacks = await prisma.feedback.findMany({
      where: {
        businessId: id,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const dailyFeedbacks = recentFeedbacks.reduce((acc, feedback) => {
      const date = feedback.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyFeedbacksArray = Object.entries(dailyFeedbacks)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // الإحصائيات النهائية
    const stats = {
      totalVisits,
      recentVisits,
      totalFeedbacks,
      positiveFeedbacks,
      negativeFeedbacks,
      averageRating: parseFloat(averageRating.toFixed(2)),
      conversionRate: parseFloat(conversionRate),
      couponsUsed,
      activeCoupons,
      ratingDistribution,
      visitSources: visitSourcesArray,
      peakHours,
      dailyFeedbacks: dailyFeedbacksArray,
    };

    console.log('✅ Stats fetched successfully');

    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message,
    });
  }
}
