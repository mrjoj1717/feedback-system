// pages/api/dashboard/stats.js
import { authenticateToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

async function handler(req, res) {
  try {
    const [
      totalFeedbacks,
      totalBusinesses,
      pendingFeedbacks,
      avgRating
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.business.count(),
      prisma.feedback.count({ where: { status: 'pending' } }),
      prisma.feedback.aggregate({ _avg: { rating: true } })
    ]);

    return res.json({
      success: true,
      stats: {
        totalFeedbacks,
        totalBusinesses,
        pendingFeedbacks,
        avgRating: avgRating._avg.rating || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default authenticateToken(handler);
