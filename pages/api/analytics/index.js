import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { businessId, days = 7 } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const daysAgo = parseInt(days);
    const startDate = startOfDay(subDays(new Date(), daysAgo));
    const endDate = endOfDay(new Date());

    const dailyAnalytics = await prisma.dailyAnalytics.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const allFeedbacks = await prisma.feedback.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = allFeedbacks.length > 0 ? totalRating / allFeedbacks.length : 0;
    const conversionRate = business.totalViews > 0 
      ? ((business.totalFeedback / business.totalViews) * 100).toFixed(1)
      : 0;

    const stats = {
      totalViews: business.totalViews,
      totalFeedback: business.totalFeedback,
      averageRating: avgRating.toFixed(1),
      conversionRate,
    };

    const last7Days = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
      
      const analytics = dailyAnalytics.find(
        a => format(new Date(a.date), 'yyyy-MM-dd') === dateStr
      );

      last7Days.push({
        date: dateStr,
        views: analytics?.views || 0,
        feedbacks: analytics?.feedbacks || 0,
        avgRating: analytics?.avgRating || 0,
      });
    }

    return res.status(200).json({
      stats,
      last7Days,
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
