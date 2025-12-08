// pages/api/businesses/index.js
import { authenticateToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

async function handler(req, res) {
  if (req.method === 'GET') {
    // جلب جميع الأعمال
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, businesses });
  }

  if (req.method === 'POST') {
    // إضافة عمل جديد
    const { name, slug, whatsappPhone, googleReviewUrl } = req.body;
    
    const business = await prisma.business.create({
      data: { name, slug, whatsappPhone, googleReviewUrl }
    });
    
    return res.json({ success: true, business });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authenticateToken(handler);
