import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  } else if (req.method === 'GET') {
    return handleList(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCreate(req, res) {
  try {
    const { businessSlug, rating, comment, visitorName, visitorEmail, visitorPhone } = req.body;

    if (!businessSlug || !rating) {
      return res.status(400).json({ error: 'Business slug and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        businessId: business.id,
        rating,
        comment: comment || null,
        visitorName: visitorName || null,
        visitorEmail: visitorEmail || null,
        visitorPhone: visitorPhone || null,
        visitorIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        status: 'pending',
      },
    });

    const allFeedbacks = await prisma.feedback.findMany({
      where: { 
        businessId: business.id,
        status: 'approved'
      },
    });

    const totalRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = allFeedbacks.length > 0 ? totalRating / allFeedbacks.length : 0;

    await prisma.business.update({
      where: { id: business.id },
      data: {
        totalFeedback: { increment: 1 },
        averageRating: avgRating,
      },
    });

    return res.status(201).json({
      success: true,
      feedback,
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleList(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { businessId, limit = 10, page = 1, status } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      businessId,
      ...(status && { status }),
    };

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip,
      }),
      prisma.feedback.count({ where }),
    ]);

    return res.status(200).json({
      feedbacks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
