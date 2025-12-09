import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessId, rating, comment, visitorName, visitorPhone } = req.body;

    console.log('📥 Creating feedback:', { businessId, rating });

    // حفظ التقييم
    const feedback = await prisma.feedback.create({
      data: {
        businessId,
        rating,
        comment: comment || null,
        visitorName: visitorName || null,
        visitorPhone: visitorPhone || null,
        status: 'pending',
      }
    });

    // تحديث إحصائيات Business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        totalFeedback: true,
        averageRating: true,
        rating1: true,
        rating2: true,
        rating3: true,
        rating4: true,
        rating5: true,
      }
    });

    const newTotalFeedback = business.totalFeedback + 1;
    const totalRatingSum = 
      (business.rating1 * 1) + 
      (business.rating2 * 2) + 
      (business.rating3 * 3) + 
      (business.rating4 * 4) + 
      (business.rating5 * 5) + 
      rating;
    
    const newAverageRating = totalRatingSum / newTotalFeedback;

    const ratingField = `rating${rating}`;

    await prisma.business.update({
      where: { id: businessId },
      data: {
        totalFeedback: newTotalFeedback,
        averageRating: newAverageRating,
        [ratingField]: business[ratingField] + 1,
      }
    });

    console.log('✅ Feedback created:', feedback.id);

    return res.status(201).json({
      success: true,
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
      }
    });

  } catch (error) {
    console.error('❌ Create feedback error:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ في حفظ التقييم',
      details: error.message 
    });
  }
}
