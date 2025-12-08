import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessSlug } = req.body;

    if (!businessSlug) {
      return res.status(400).json({ error: 'Business slug is required' });
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Record view
    await prisma.view.create({
      data: {
        businessId: business.id,
        visitorIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer || null,
      },
    });

    // Update total views
    await prisma.business.update({
      where: { id: business.id },
      data: {
        totalViews: { increment: 1 },
      },
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error recording view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
