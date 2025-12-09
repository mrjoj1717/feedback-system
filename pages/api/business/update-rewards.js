import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not defined');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const {
      businessId,
      rewardsEnabled,
      reward5Type,
      reward5Value,
      reward5Details,
      reward4Type,
      reward4Value,
      reward4Details,
      reward3Type,
      reward3Value,
      reward3Details,
      rewardExpiryDays,
    } = req.body;

    console.log('📝 Updating business:', businessId);
    console.log('Settings to update:', {
      rewardsEnabled,
      reward5Type,
      reward5Value,
      reward5Details,
      reward4Type,
      reward4Value,
      reward4Details,
      reward3Type,
      reward3Value,
      reward3Details,
      rewardExpiryDays
    });

    // تحقق من وجود Business
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!existingBusiness) {
      console.error('❌ Business not found:', businessId);
      return res.status(404).json({ error: 'Business not found' });
    }

    console.log('✅ Business found, proceeding with update...');

    // تحديث الإعدادات - بشكل آمن
    const updateData = {
      rewardsEnabled: Boolean(rewardsEnabled),
      rewardExpiryDays: parseInt(rewardExpiryDays) || 30,
    };

    // أضف الحقول فقط إذا كانت موجودة
    if (reward5Type !== undefined) updateData.reward5Type = String(reward5Type);
    if (reward5Value !== undefined) updateData.reward5Value = String(reward5Value);
    if (reward5Details !== undefined) updateData.reward5Details = reward5Details || null;
    
    if (reward4Type !== undefined) updateData.reward4Type = String(reward4Type);
    if (reward4Value !== undefined) updateData.reward4Value = String(reward4Value);
    if (reward4Details !== undefined) updateData.reward4Details = reward4Details || null;
    
    if (reward3Type !== undefined) updateData.reward3Type = String(reward3Type);
    if (reward3Value !== undefined) updateData.reward3Value = String(reward3Value);
    if (reward3Details !== undefined) updateData.reward3Details = reward3Details || null;

    console.log('📦 Final update data:', updateData);

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: updateData
    });

    console.log('✅ Rewards settings updated successfully');

    return res.json({ 
      success: true,
      business: {
        id: updated.id,
        rewardsEnabled: updated.rewardsEnabled,
        reward5Type: updated.reward5Type,
        reward5Value: updated.reward5Value,
        reward5Details: updated.reward5Details,
        reward4Type: updated.reward4Type,
        reward4Value: updated.reward4Value,
        reward4Details: updated.reward4Details,
        reward3Type: updated.reward3Type,
        reward3Value: updated.reward3Value,
        reward3Details: updated.reward3Details,
        rewardExpiryDays: updated.rewardExpiryDays,
      }
    });

  } catch (error) {
    console.error('❌ Update rewards error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'حدث خطأ في التحديث',
      details: error.message,
      errorType: error.name
    });
  }
}
