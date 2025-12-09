import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessId, feedbackId, rating, customerName, customerPhone } = req.body;

    console.log('📥 Creating coupon for rating:', rating);

    // جلب إعدادات المكافآت
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        rewardsEnabled: true,
        reward5Type: true,
        reward5Value: true,
        reward5Details: true,
        reward4Type: true,
        reward4Value: true,
        reward4Details: true,
        reward3Type: true,
        reward3Value: true,
        reward3Details: true,
        rewardExpiryDays: true,
      }
    });

    if (!business || !business.rewardsEnabled) {
      return res.status(400).json({ error: 'Rewards not enabled' });
    }

    // تحديد نوع المكافأة حسب التقييم
    let rewardType, rewardValue, rewardDetails;
    
    if (rating === 5) {
      rewardType = business.reward5Type;
      rewardValue = business.reward5Value;
      rewardDetails = business.reward5Details;
    } else if (rating === 4) {
      rewardType = business.reward4Type;
      rewardValue = business.reward4Value;
      rewardDetails = business.reward4Details;
    } else if (rating === 3) {
      rewardType = business.reward3Type;
      rewardValue = business.reward3Value;
      rewardDetails = business.reward3Details;
    } else {
      return res.status(400).json({ error: 'Rating must be 3 or higher' });
    }

    // إنشاء كود فريد
    const code = `STAR${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // حساب تاريخ الانتهاء
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + business.rewardExpiryDays);

    // إنشاء الكوبون
    const coupon = await prisma.coupon.create({
      data: {
        businessId,
        code,
        rewardType,
        rewardValue,
        rewardDetails,
        feedbackId,
        customerName,
        customerPhone,
        expiresAt,
      }
    });

    // ربط الكوبون بالتقييم
    if (feedbackId) {
      await prisma.feedback.update({
        where: { id: feedbackId },
        data: { couponCode: code }
      });
    }

    console.log('✅ Coupon created:', code);

    return res.status(201).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        rewardType: coupon.rewardType,
        rewardValue: coupon.rewardValue,
        rewardDetails: coupon.rewardDetails,
        expiresAt: coupon.expiresAt,
      }
    });

  } catch (error) {
    console.error('❌ Create coupon error:', error);
    return res.status(500).json({ error: 'حدث خطأ' });
  }
}
