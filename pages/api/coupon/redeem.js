import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.json({ 
        success: false, 
        error: 'الرجاء إدخال الكود' 
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.json({ 
        success: false, 
        error: 'كود غير صحيح' 
      });
    }

    if (coupon.isUsed) {
      return res.json({ 
        success: false, 
        error: 'تم استخدام هذا الكوبون من قبل' 
      });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return res.json({ 
        success: false, 
        error: 'انتهت صلاحية الكوبون' 
      });
    }

    // تحديث الكوبون
    await prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    return res.json({ 
      success: true,
      message: 'تم استخدام الكوبون بنجاح' 
    });

  } catch (error) {
    console.error('❌ Error redeeming coupon:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'حدث خطأ أثناء الاستخدام' 
    });
  }
}
