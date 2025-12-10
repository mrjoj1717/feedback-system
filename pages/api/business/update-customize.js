import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const {
      businessId,
      logo,
      primaryColor,
      secondaryColor,
      backgroundColor,
    } = req.body;

    console.log('🎨 Updating customize settings for:', businessId);

    // تحقق من الملكية
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { ownedBusinesses: true }
    });

    if (!user || !user.ownedBusinesses.includes(businessId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // تحديث الإعدادات
    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        logo: logo || '',
        primaryColor: primaryColor || '#F59E0B',
        secondaryColor: secondaryColor || '#3B82F6',
        backgroundColor: backgroundColor || '#FFFFFF',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Customize settings updated successfully');

    return res.json({ 
      success: true,
      business: {
        id: updated.id,
        logo: updated.logo,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        backgroundColor: updated.backgroundColor,
      }
    });

  } catch (error) {
    console.error('❌ Update customize error:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ في التحديث',
      details: error.message 
    });
  }
}
