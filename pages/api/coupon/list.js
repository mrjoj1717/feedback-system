import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

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

    // جلب User
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { ownedBusinesses: true }
    });

    if (!user || !user.ownedBusinesses || user.ownedBusinesses.length === 0) {
      return res.status(404).json({ error: 'No business found' });
    }

    const businessId = user.ownedBusinesses[0];

    // Filters من Query params
    const { status, search } = req.query;

    // Build where clause
    const where = { businessId };

    if (status === 'used') {
      where.isUsed = true;
    } else if (status === 'active') {
      where.isUsed = false;
      where.expiresAt = { gte: new Date() };
    } else if (status === 'expired') {
      where.isUsed = false;
      where.expiresAt = { lt: new Date() };
    }

    // Search
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // جلب الكوبونات
    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // حد أقصى 100 كوبون
    });

    // حساب الإحصائيات
    const now = new Date();
    const stats = {
      total: await prisma.coupon.count({ where: { businessId } }),
      used: await prisma.coupon.count({ where: { businessId, isUsed: true } }),
      active: await prisma.coupon.count({ 
        where: { 
          businessId, 
          isUsed: false, 
          expiresAt: { gte: now } 
        } 
      }),
      expired: await prisma.coupon.count({ 
        where: { 
          businessId, 
          isUsed: false, 
          expiresAt: { lt: now } 
        } 
      }),
    };

    return res.json({ coupons, stats });

  } catch (error) {
    console.error('❌ Error fetching coupons:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ',
      details: error.message 
    });
  }
}
