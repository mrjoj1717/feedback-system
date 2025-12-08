import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function FeedbackPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [business, setBusiness] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchBusiness();
    }
  }, [slug]);

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/business/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setBusiness(data);
        
        // تتبع الزيارة (لا نوقف التحميل إذا فشل)
        try {
          await fetch(`/api/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId: data.id, type: 'view' }),
          });
        } catch (err) {
          console.warn('Failed to track view:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching business:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('الرجاء اختيار التقييم');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('📤 Sending feedback:', {
        businessSlug: slug,
        rating,
        comment,
        visitorName: customerName,
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: slug,
          rating,
          comment: comment || '',
          visitorName: customerName || '',
          visitorEmail: '',
          visitorPhone: '',
        }),
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Feedback submitted:', data);
        
        setSubmitted(true);
        
        // توجيه حسب التقييم
        setTimeout(() => {
          if (rating >= 4 && business.googleReviewUrl) {
            window.location.href = business.googleReviewUrl;
          } else if (rating < 4 && business.whatsappPhone) {
            const message = `شكراً على تقييمك! نود خدمتك بشكل أفضل`;
            window.location.href = `https://wa.me/${business.whatsappPhone}?text=${encodeURIComponent(message)}`;
          }
        }, 2500);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'فشل إرسال التقييم');
      }
    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gold-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <Head>
          <title>شكراً لك! - {business.name}</title>
        </Head>
        
        <div className="max-w-md w-full text-center animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
            <div className="mb-6 animate-bounce">
              <div className="text-8xl mb-4">🎉</div>
              <div className="text-6xl">✨</div>
            </div>
            
            <h1 className="text-4xl font-bold text-green-600 mb-4">
              شكراً لك!
            </h1>
            
            <p className="text-xl text-gray-700 mb-6">
              نقدر وقتك وتقييمك الثمين
            </p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(rating)].map((_, i) => (
                <span key={i} className="text-4xl animate-pulse">⭐</span>
              ))}
            </div>
            
            {rating >= 4 && business.googleReviewUrl && (
              <p className="text-sm text-gray-600 animate-pulse">
                جاري التوجيه لمراجعة Google...
              </p>
            )}
            
            {rating < 4 && business.whatsappPhone && (
              <p className="text-sm text-gray-600 animate-pulse">
                جاري فتح واتساب للتواصل معك...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const ratingLabels = {
    1: 'غير راضٍ 😞',
    2: 'يحتاج تحسين 😕',
    3: 'جيد 😊',
    4: 'ممتاز 😃',
    5: 'رائع جداً 🤩',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-blue-50 py-8 px-4">
      <Head>
        <title>تقييمك يهمنا - {business.name}</title>
        <meta name="description" content={`شارك تجربتك مع ${business.name}`} />
      </Head>

      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center transform hover:scale-105 transition-all duration-300">
          <div className="text-6xl mb-4 animate-bounce">✨</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {business.name}
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            شارك تجربتك معنا
          </p>
          
          {/* Stats */}
          {business.totalFeedback > 0 && (
            <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-gray-200">
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-3xl">⭐</span>
                  <span className="text-3xl font-bold text-gold-600">
                    {parseFloat(business.averageRating).toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">متوسط التقييم</p>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {business.totalFeedback}
                </div>
                <p className="text-sm text-gray-600">تقييم</p>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                كيف تقيّم تجربتك معنا؟
              </h3>
              
              <div className="flex justify-center gap-3 mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transform transition-all duration-200 hover:scale-125 focus:outline-none"
                  >
                    <span
                      className={`text-6xl transition-all duration-200 ${
                        value <= (hoverRating || rating)
                          ? 'opacity-100 drop-shadow-lg'
                          : 'opacity-30 grayscale'
                      }`}
                    >
                      ⭐
                    </span>
                  </button>
                ))}
              </div>
              
              {(hoverRating || rating) > 0 && (
                <p className="text-center text-2xl font-semibold text-gold-600 animate-fadeIn">
                  {ratingLabels[hoverRating || rating]}
                </p>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3 text-right">
                تعليقك (اختياري)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg resize-none"
                placeholder="شارك تفاصيل تجربتك..."
              />
            </div>

            {/* Name Section */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3 text-right">
                اسمك (اختياري)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="أدخل اسمك"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className={`w-full py-5 px-6 rounded-2xl text-white text-xl font-bold transition-all duration-300 transform ${
                isSubmitting || rating === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">⏳</span>
                  جاري الإرسال...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <span>إرسال التقييم</span>
                  <span className="text-2xl">🚀</span>
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          © {new Date().getFullYear()} {business.name} - جميع الحقوق محفوظة
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
