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
    // إنشاء المجلد إذا لم يكن موجوداً
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'feedback');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3, // حد أقصى 3 صور
      uploadDir,
      keepExtensions: true,
      filename: (name, ext, part) => {
        // اسم فريد للملف
        return `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // معالجة الملفات
    const uploadedFiles = [];
    const fileArray = Array.isArray(files.photos) ? files.photos : [files.photos];

    for (const file of fileArray) {
      if (!file) continue;

      // تحقق من نوع الملف
      if (!file.mimetype.startsWith('image/')) {
        fs.unlinkSync(file.filepath);
        continue;
      }

      const fileName = path.basename(file.filepath);
      const fileUrl = `/uploads/feedback/${fileName}`;
      uploadedFiles.push(fileUrl);
    }

    console.log('✅ Photos uploaded:', uploadedFiles);

    return res.json({ 
      success: true,
      photos: uploadedFiles 
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ 
      error: 'فشل رفع الصور',
      details: error.message 
    });
  }
}
