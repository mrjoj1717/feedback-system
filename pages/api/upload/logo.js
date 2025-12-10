import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Parse form data
    const form = formidable({
      maxFileSize: 2 * 1024 * 1024, // 2MB
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'logos'),
      keepExtensions: true,
    });

    // تأكد من وجود المجلد
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const businessId = fields.businessId[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // تحقق من الملكية
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { ownedBusinesses: true }
    });

    if (!user || !user.ownedBusinesses.includes(businessId)) {
      // احذف الملف
      fs.unlinkSync(file.filepath);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // احصل على اسم الملف
    const fileName = path.basename(file.filepath);
    const fileUrl = `/uploads/logos/${fileName}`;

    // حدّث في Database
    await prisma.business.update({
      where: { id: businessId },
      data: { logo: fileUrl },
    });

    console.log('✅ Logo uploaded:', fileUrl);

    return res.json({ 
      success: true,
      url: fileUrl 
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ 
      error: 'فشل رفع الملف',
      details: error.message 
    });
  }
}
