import { useState, useEffect } from 'react';
import RatingStars from './RatingStars';
import { motion } from 'framer-motion';

export default function FeedbackForm({ businessSlug }) {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    visitorName: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
  const [error, setError] = useState(null);

  // ⬅️ تحقق من businessSlug عند التحميل
  useEffect(() => {
    console.log('📦 businessSlug:', businessSlug); // للتأكد
    
    if (businessSlug) {
      fetchBusinessData();
    }
  }, [businessSlug]);

  const fetchBusinessData = async () => {
    try {
      setIsLoadingBusiness(true);
      
      const response = await fetch(`/api/business/${businessSlug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business data');
      }

      const data = await response.json();
      setBusinessData(data);
      
    } catch (err) {
      console.error('Error fetching business:', err);
      setError('فشل تحميل بيانات الأعمال');
    } finally {
      setIsLoadingBusiness(false);
    }
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⬅️ تحقق من البيانات قبل الإرسال
    console.log('📤 Submitting:', {
      businessSlug,
      rating: formData.rating,
      comment: formData.comment,
      visitorName: formData.visitorName,
    });

    if (formData.rating === 0) {
      alert('يرجى اختيار تقييم');
      return;
    }

    if (!businessSlug) {
      alert('خطأ: معرف الأعمال غير موجود');
      console.error('❌ businessSlug is missing!');
      return;
    }

    if (!businessData) {
      alert('لم يتم تحميل بيانات الأعمال');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          rating: formData.rating,
          comment: formData.comment,
          visitorName: formData.visitorName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل إرسال التقييم');
      }

      console.log('✅ Feedback submitted:', data);

      // التوجيه حسب التقييم
      if (formData.rating < 3) {
        if (businessData.whatsappPhone) {
          const message = encodeURIComponent(
            `مرحباً ${businessData.name}، لدي ملاحظات حول تجربتي\n\nالتقييم: ${formData.rating} نجوم${
              formData.comment ? `\n\nالتعليق: ${formData.comment}` : ''
            }${
              formData.visitorName ? `\n\nالاسم: ${formData.visitorName}` : ''
            }`
          );
          window.location.href = `https://wa.me/${businessData.whatsappPhone}?text=${message}`;
        } else {
          alert('رقم واتساب غير متوفر');
        }
      } else {
        if (businessData.googleReviewUrl) {
          window.location.href = businessData.googleReviewUrl;
        } else if (businessData.googlePlaceId) {
          window.location.href = `https://search.google.com/local/writereview?placeid=${businessData.googlePlaceId}`;
        } else {
          alert('رابط جوجل غير متوفر');
        }
      }

      setTimeout(() => {
        setFormData({ rating: 0, comment: '', visitorName: '' });
        setIsSubmitting(false);
      }, 1000);

    } catch (error) {
      console.error('❌ Submit error:', error);
      alert('حدث خطأ: ' + error.message);
      setIsSubmitting(false);
    }
  };

  if (isLoadingBusiness) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  if (error || !businessData) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-600">❌ {error || 'لم يتم العثور على بيانات الأعمال'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{businessData.name}</h2>
        <h3 className="text-xl font-semibold text-gray-700">كيف تقيّم تجربتك معنا؟</h3>
      </div>

      <div className="mb-6">
        <RatingStars rating={formData.rating} onRatingChange={handleRatingChange} />
        {formData.rating > 0 && (
          <p className="text-center text-gray-600 mt-2">
            اخترت {formData.rating} من 5 نجوم
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-right">
          تعليقك (اختياري)
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="شارك تفاصيل تجربتك..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-right">اسمك (اختياري)</label>
        <input
          type="text"
          value={formData.visitorName}
          onChange={(e) => setFormData(prev => ({ ...prev, visitorName: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="أدخل اسمك"
        />
      </div>

      {formData.rating > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mb-4 p-4 rounded-lg ${
            formData.rating < 3 ? 'bg-orange-50 border-2 border-orange-200' : 'bg-green-50 border-2 border-green-200'
          }`}
        >
          {formData.rating < 3 ? (
            <div className="text-right">
              <p className="text-orange-800 font-bold text-lg">💬 نأسف لعدم رضاك الكامل</p>
              <p className="text-orange-700 text-sm">سيتم توجيهك إلى واتساب للتواصل المباشر</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-green-800 font-bold text-lg">⭐ شكراً لتقييمك الرائع!</p>
              <p className="text-green-700 text-sm">سيتم توجيهك إلى خرائط جوجل</p>
            </div>
          )}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || formData.rating === 0}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          formData.rating === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? '⏳ جاري التوجيه...' : '📤 إرسال التقييم'}
      </button>
    </form>
  );
}
const fetchBusinessData = async () => {
  try {
    setIsLoadingBusiness(true);
    
    const response = await fetch(`/api/business/${businessSlug}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch business data');
    }

    const data = await response.json();
    
    // ⬅️ أضف هذه السطور للتحقق
    console.log('📦 Business Data:', data);
    console.log('📞 WhatsApp Phone:', data.whatsappPhone);
    console.log('🔗 Google URL:', data.googleReviewUrl);
    
    setBusinessData(data);
    
  } catch (err) {
    console.error('Error fetching business:', err);
    setError('فشل تحميل بيانات الأعمال');
  } finally {
    setIsLoadingBusiness(false);
  }
};
