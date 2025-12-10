import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Invalid business ID' });
  }

  try {
    // الحصول على IP Address
    const visitorIp = 
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown';

    // الحصول على User Agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    // الحصول على Referrer
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'direct';

    // الحصول على Source من Body
    const source = req.body?.source || 'direct';

    // التحقق من أن Business موجود
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // تسجيل الزيارة
    const view = await prisma.view.create({
      data: {
        businessId: id,
        visitorIp,
        userAgent,
        referrer,
        source,
      },
    });

    // تحديث عدد الزيارات في Business
    await prisma.business.update({
      where: { id },
      data: {
        totalViews: { increment: 1 },
      },
    });

    console.log('✅ Visit recorded:', {
      businessId: id,
      viewId: view.id,
      source,
    });

    return res.status(200).json({ 
      success: true,
      viewId: view.id 
    });

  } catch (error) {
    console.error('❌ Error recording visit:', error);
    return res.status(500).json({ 
      error: 'Failed to record visit',
      details: error.message 
    });
  }
}
