import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { businessSlug } = req.body;

    if (!businessSlug) {
      return res.status(400).json({ error: 'Business slug مطلوب' });
    }

    // احصل على Business
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business غير موجود' });
    }

    // ربط Business بالمستخدم
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ownedBusinesses: [business.id] // أو { push: business.id }
      }
    });

    console.log('✅ Linked:', user.email, '→', business.name);

    return res.status(200).json({
      success: true,
      message: 'تم الربط بنجاح',
      user: {
        email: user.email,
        ownedBusinesses: user.ownedBusinesses
      },
      business: {
        name: business.name,
        slug: business.slug
      }
    });

  } catch (error) {
    console.error('❌ Link error:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ في الربط',
      details: error.message 
    });
  }
}
