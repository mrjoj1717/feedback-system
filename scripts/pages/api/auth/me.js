import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('🔍 Looking for user:', decoded.userId);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        ownedBusinesses: true,  // ⬅️ هذا مهم جداً!
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.email);
    console.log('📦 ownedBusinesses field:', user.ownedBusinesses);
    console.log('📊 Full user object:', JSON.stringify(user, null, 2));

    return res.status(200).json(user);

  } catch (error) {
    console.error('❌ Auth me error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
