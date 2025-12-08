import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessId, type } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    // تحديث عدد الزيارات
    if (type === 'view') {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          totalViews: { increment: 1 },
        },
      });

      console.log('✅ View tracked for business:', businessId);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Track error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
