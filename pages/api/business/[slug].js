import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { slug } = req.query;

  // GET بدون Authentication - للصفحة العامة
  if (req.method === 'GET' && !req.headers.authorization) {
    try {
      console.log('🔍 Public lookup for:', slug);

      const business = await prisma.business.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          whatsappPhone: true,
          googlePlaceId: true,
          googleReviewUrl: true,
          totalViews: true,
          totalFeedback: true,
          averageRating: true,
        },
      });

      if (!business) {
        console.error('❌ Business not found:', slug);
        return res.status(404).json({ error: 'Business not found' });
      }

      console.log('✅ Business found:', business);
      return res.status(200).json(business);

    } catch (error) {
      console.error('Error fetching business:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET مع Authentication - للـ Dashboard
  if (req.method === 'GET' && req.headers.authorization) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('🔍 Authenticated lookup for:', slug);

      // يمكن البحث بـ slug أو id
      let business;
      
      // إذا كان slug يبدو مثل MongoDB ID
      if (slug.length === 24 && /^[a-f\d]{24}$/i.test(slug)) {
        console.log('📦 Looking up by ID:', slug);
        business = await prisma.business.findUnique({
          where: { id: slug },
        });
      } else {
        console.log('📦 Looking up by slug:', slug);
        business = await prisma.business.findUnique({
          where: { slug },
        });
      }

      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // التحقق من الملكية
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.ownedBusinesses.includes(business.id)) {
        return res.status(403).json({ error: 'Forbidden - Not your business' });
      }

      console.log('✅ Authenticated business found:', business);
      return res.status(200).json(business);

    } catch (error) {
      console.error('Authenticated fetch error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT - تحديث البيانات (يتطلب Authentication)
  if (req.method === 'PUT') {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { name, email, whatsappPhone, googleReviewUrl } = req.body;

      console.log('🔄 Updating business:', slug);

      // البحث بـ ID أو slug
      let business;
      if (slug.length === 24 && /^[a-f\d]{24}$/i.test(slug)) {
        business = await prisma.business.findUnique({ where: { id: slug } });
      } else {
        business = await prisma.business.findUnique({ where: { slug } });
      }

      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // التحقق من الملكية
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.ownedBusinesses.includes(business.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedBusiness = await prisma.business.update({
        where: { id: business.id },
        data: {
          name,
          email,
          whatsappPhone,
          googleReviewUrl,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Business updated successfully');
      return res.status(200).json(updatedBusiness);

    } catch (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
