import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📋 Fetching businesses...');

    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        totalFeedback: true,
      },
    });

    console.log(`✅ Found ${businesses.length} businesses`);

    return res.status(200).json({ 
      success: true,
      businesses 
    });

  } catch (error) {
    console.error('❌ Error fetching businesses:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
}
