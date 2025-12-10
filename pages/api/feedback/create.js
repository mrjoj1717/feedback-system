import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      businessId, 
      rating, 
      comment, 
      visitorName, 
      visitorPhone,
      photos // ⬅️ جديد - الصور
    } = req.body;

    if (!businessId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get visitor IP
    const visitorIp = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress;

    // حفظ التقييم مع الصور
    const feedback = await prisma.feedback.create({
      data: {
        businessId,
        rating: parseInt(rating),
        comment: comment || null,
        visitorName: visitorName || null,
        visitorPhone: visitorPhone || null,
        visitorIp,
        photos: photos || [], // ⬅️ حفظ روابط الصور
        status: 'pending',
      },
    });

    // تحديث إحصائيات النشاط
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    const newTotalFeedback = business.totalFeedback + 1;
    const newAverageRating = 
      (business.averageRating * business.totalFeedback + rating) / newTotalFeedback;

    await prisma.business.update({
      where: { id: businessId },
      data: {
        totalFeedback: newTotalFeedback,
        averageRating: newAverageRating,
        [`rating${rating}`]: { increment: 1 },
      },
    });

    console.log('✅ Feedback created with photos:', feedback.id);

    return res.json({ 
      success: true, 
      feedback 
    });

  } catch (error) {
    console.error('❌ Create feedback error:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ',
      details: error.message 
    });
  }
}
