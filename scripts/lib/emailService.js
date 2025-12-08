// lib/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendFeedbackNotification(business, feedback) {
  const emoji = feedback.rating >= 4 ? '🎉' : '⚠️';
  const color = feedback.rating >= 4 ? '#10B981' : '#EF4444';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: business.email,
    subject: `${emoji} تقييم جديد: ${feedback.rating}⭐ - ${business.name}`,
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: ${color}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">تقييم جديد ${emoji}</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333;">التقييم: ${'⭐'.repeat(feedback.rating)}</h2>
            <p style="font-size: 18px; color: #666;">
              <strong>العميل:</strong> ${feedback.visitorName || 'غير محدد'}
            </p>
            <p style="font-size: 16px; color: #666;">
              <strong>التعليق:</strong><br>
              ${feedback.comment || 'لا يوجد تعليق'}
            </p>
            <p style="font-size: 14px; color: #999;">
              ${new Date(feedback.createdAt).toLocaleString('ar-SA')}
            </p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="display: inline-block; background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            عرض لوحة التحكم
          </a>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
