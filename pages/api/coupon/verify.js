import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, businessId } = req.body;

    if (!code || !businessId) {
      return res.json({ 
        valid: false, 
        message: 'بيانات غير كاملة' 
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.json({ 
        valid: false, 
        message: 'كود غير صحيح' 
      });
    }

    if (coupon.businessId !== businessId) {
      return res.json({ 
        valid: false, 
        message: 'هذا الكوبون لا ينتمي لنشاطك' 
      });
    }

    if (coupon.isUsed) {
      return res.json({ 
        valid: false, 
        message: 'تم استخدام هذا الكوبون من قبل' 
      });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return res.json({ 
        valid: false, 
        message: 'انتهت صلاحية الكوبون' 
      });
    }

    return res.json({ 
      valid: true, 
      coupon 
    });

  } catch (error) {
    console.error('❌ Error verifying coupon:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'حدث خطأ في التحقق' 
    });
  }
}
