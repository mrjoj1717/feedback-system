import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Request body:', req.body);

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name, slug, email, whatsappPhone, googleReviewUrl, autoLink = false } = req.body; // ⬅️ جديد

    // Validation
    if (!name || !slug) {
      return res.status(400).json({ error: 'الاسم والـ slug مطلوبان' });
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({ error: 'اسم العمل يجب أن يكون بين 3 و 100 حرف' });
    }

    if (slug.length < 3 || slug.length > 50) {
      return res.status(400).json({ error: 'الـ slug يجب أن يكون بين 3 و 50 حرف' });
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ error: 'الـ slug يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط' });
    }

    console.log('✅ Validation passed');

    // تحقق من slug
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    });

    if (existingBusiness) {
      return res.status(400).json({ error: 'هذا الرابط محجوز مسبقاً' });
    }

    console.log('✅ Slug available');

    // إنشاء Business
    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        slug: slug.toLowerCase().trim(),
        email: email?.trim() || '',
        whatsappPhone: whatsappPhone?.replace(/[^0-9]/g, '') || '',
        googleReviewUrl: googleReviewUrl?.trim() || '',
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

    // ربط بالمستخدم (اختياري)
    if (autoLink) {
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          ownedBusinesses: [business.id],
        },
      });
      console.log('✅ Linked to user:', decoded.userId);
    } else {
      console.log('⏭️  Skipped auto-linking');
    }

    return res.status(201).json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        whatsappPhone: business.whatsappPhone,
      },
      message: autoLink ? 'تم إنشاء العمل وربطه بنجاح' : 'تم إنشاء العمل بنجاح',
    });

  } catch (error) {
    console.error('❌ Create business error:', error);
    
    return res.status(500).json({ 
      error: 'حدث خطأ في إنشاء العمل',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
