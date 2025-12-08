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

    const { name, slug, email, whatsappPhone, googleReviewUrl } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'الاسم والـ slug مطلوبان' });
    }

    // تحقق من أن slug غير مستخدم
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existingBusiness) {
      return res.status(400).json({ error: 'هذا الرابط محجوز مسبقاً' });
    }

    // إنشاء Business
    const business = await prisma.business.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        email: email || '',
        whatsappPhone: whatsappPhone || '',
        googleReviewUrl: googleReviewUrl || '',
        totalViews: 0,
        totalFeedback: 0,
        averageRating: 0,
        rating1: 0,
        rating2: 0,
        rating3: 0,
        rating4: 0,
        rating5: 0,
      },
    });

    console.log('✅ Business created:', business.id);

    // ربط Business بالمستخدم
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ownedBusinesses: [business.id],
      },
    });

    console.log('✅ Linked to user:', decoded.userId);

    return res.status(201).json({
      success: true,
      business,
    });

  } catch (error) {
    console.error('❌ Create error:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ في إنشاء العمل',
      details: error.message 
    });
  }
}
