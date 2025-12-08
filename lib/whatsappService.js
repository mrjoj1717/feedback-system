// lib/whatsappService.js
export async function sendWhatsAppNotification(phone, business, feedback) {
  const message = `
🔔 *تقييم جديد - ${business.name}*

⭐ التقييم: ${feedback.rating}/5

👤 العميل: ${feedback.visitorName || 'غير محدد'}

💬 التعليق:
${feedback.comment || 'لا يوجد'}

🕐 ${new Date().toLocaleString('ar-SA')}
  `.trim();

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  
  // يمكن استخدام WhatsApp Business API للإرسال التلقائي
  return url;
}
