import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import prisma from '../../lib/prisma';
import Head from 'next/head';

export default function FeedbackPage({ business }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [photos, setPhotos] = useState([]); // ⬅️ جديد
  const [uploadingPhotos, setUploadingPhotos] = useState(false); // ⬅️ جديد
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ⬅️ جديد - تسجيل الزيارة عند تحميل الصفحة
  useEffect(() => {
    if (business?.id) {
      recordVisit();
    }
  }, [business?.id]);

  // ⬅️ دالة تسجيل الزيارة
  const recordVisit = async () => {
    try {
const response = await fetch(`/api/business/track/${business.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: getVisitSource(),
        }),
      });

      if (response.ok) {
        console.log('✅ Visit recorded successfully');
      }
    } catch (error) {
      console.error('❌ Error recording visit:', error);
    }
  };

  // ⬅️ دالة تحديد مصدر الزيارة
  const getVisitSource = () => {
    // التحقق من URL parameters
    if (typeof window === 'undefined') return 'direct';
    
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source') || params.get('utm_source');
    
    if (source) return source;
    
    // التحقق من Referrer
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('google')) return 'google';
    if (referrer.includes('facebook')) return 'facebook';
    if (referrer.includes('instagram')) return 'instagram';
    if (referrer.includes('twitter') || referrer.includes('x.com')) return 'twitter';
    if (referrer.includes('whatsapp')) return 'whatsapp';
    if (referrer.includes('tiktok')) return 'tiktok';
    if (referrer.includes('snapchat')) return 'snapchat';
    
    return 'direct';
  };

  // دالة رفع الصور - جديد
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // تحقق من عدد الصور (حد أقصى 3)
    if (photos.length + files.length > 3) {
      alert('❌ يمكنك رفع 3 صور كحد أقصى');
      return;
    }

    // تحقق من حجم كل صورة (أقل من 5MB)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ حجم الصورة يجب أن يكون أقل من 5MB');
        return;
      }
    }

    setUploadingPhotos(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const res = await fetch('/api/upload/feedback-photo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setPhotos([...photos, ...data.photos]);
      
      console.log('✅ Photos uploaded:', data.photos);

    } catch (error) {
      alert('❌ فشل رفع الصور: ' + error.message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  // دالة حذف صورة - جديد
  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. حفظ التقييم مع الصور
      const feedbackRes = await fetch('/api/feedback/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          rating,
          comment,
          visitorName,
          visitorPhone,
          photos, // ⬅️ إرسال الصور
        }),
      });

      const feedbackData = await feedbackRes.json();

      if (!feedbackRes.ok) {
        throw new Error(feedbackData.error);
      }

      // 2. للتقييمات المنخفضة (1-2 نجوم)
      if (rating <= 2) {
        const complaintNumber = business.complaintPhone || business.whatsappPhone;
        
        if (complaintNumber) {
          const message = `مرحباً، لدي ملاحظات بخصوص تجربتي مع ${business.name}.\n\nالتقييم: ${'⭐'.repeat(rating)}${comment ? `\n\nالتعليق: ${comment}` : ''}${visitorName ? `\n\nالاسم: ${visitorName}` : ''}`;
          
          window.location.href = `https://wa.me/${complaintNumber}?text=${encodeURIComponent(message)}`;
          return;
        }
      }

      // 3. للتقييمات 3 نجوم أو أكثر → إنشاء كوبون
      if (rating >= 3 && business.rewardsEnabled) {
        const couponRes = await fetch('/api/coupon/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            feedbackId: feedbackData.feedback.id,
            rating,
            customerName: visitorName,
            customerPhone: visitorPhone,
          }),
        });

        const couponData = await couponRes.json();
        
        if (couponRes.ok && couponData.success) {
          setCoupon(couponData.coupon);
        }
      }

      // 4. عرض شاشة النجاح
      setShowSuccess(true);

    } catch (error) {
      alert('حدث خطأ: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة معاينة المكافأة
  const getRewardPreview = (selectedRating) => {
    if (!business.rewardsEnabled || selectedRating < 3) return null;

    const rewardType = business[`reward${selectedRating}Type`];
    const rewardValue = business[`reward${selectedRating}Value`];
    const rewardDetails = business[`reward${selectedRating}Details`];

    let rewardText = '';
    let icon = '🎁';

    if (rewardType === 'percentage_discount') {
      rewardText = `خصم ${rewardValue}%`;
      icon = '💰';
    } else if (rewardType === 'fixed_discount') {
      rewardText = `خصم ${rewardValue} ريال`;
      icon = '💵';
    } else if (rewardType === 'free_item') {
      rewardText = rewardValue;
      icon = '🎁';
    } else if (rewardType === 'service_discount') {
      rewardText = `خصم ${rewardValue}%${rewardDetails ? ` على ${rewardDetails}` : ''}`;
      icon = '🛠️';
    } else if (rewardType === 'next_visit') {
      rewardText = `خصم ${rewardValue}% على زيارتك القادمة`;
      icon = '🔄';
    }

    return (
      <div 
        className="mt-4 p-4 rounded-xl text-center border-2"
        style={{
          background: `linear-gradient(to right, ${business.primaryColor}15, ${business.secondaryColor}15)`,
          borderColor: business.primaryColor
        }}
      >
        <div className="text-4xl mb-2">{icon}</div>
        <p 
          className="font-bold text-lg"
          style={{ color: business.primaryColor }}
        >
          {rewardText}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          ستحصل على كوبون خصم بعد التقييم! 🎉
        </p>
      </div>
    );
  };

  if (showSuccess) {
    return <SuccessScreen business={business} rating={rating} coupon={coupon} />;
  }

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={{
        background: `linear-gradient(to bottom right, ${business.backgroundColor}, ${business.primaryColor}10, ${business.secondaryColor}10)`
      }}
    >
      <Head>
        <title>{business.name} - شاركنا رأيك</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {business.logo && (
            <img
              src={business.logo}
              alt={business.name}
              className="w-24 h-24 object-contain mx-auto mb-4 rounded-2xl"
            />
          )}
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: business.primaryColor }}
          >
            {business.name}
          </h1>
          <p className="text-xl text-gray-600">
            شاركنا تجربتك معنا
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4 text-center">
                كيف كانت تجربتك معنا؟
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-6xl transition-transform hover:scale-110"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              
              {rating > 0 && getRewardPreview(rating)}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                أخبرنا المزيد (اختياري)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl transition-all resize-none"
                style={{
                  borderColor: comment ? business.primaryColor : '#D1D5DB'
                }}
                placeholder="ما الذي أعجبك؟ كيف يمكننا التحسين؟"
              />
            </div>

            {/* صور التقييم - جديد */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                أضف صور (اختياري - حتى 3 صور)
              </label>

              {/* معاينة الصور */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* زر رفع الصور */}
              {photos.length < 3 && (
                <label
                  className="block w-full py-4 border-2 border-dashed rounded-xl text-center cursor-pointer hover:bg-gray-50 transition"
                  style={{
                    borderColor: business.primaryColor,
                    color: business.primaryColor
                  }}
                >
                  {uploadingPhotos ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>جاري الرفع...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>📷</span>
                      <span>اضغط لإضافة صور ({3 - photos.length} متبقية)</span>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhotos}
                    className="hidden"
                  />
                </label>
              )}

              <p className="text-sm text-gray-500 mt-2 text-center">
                PNG, JPG, GIF - حتى 5MB لكل صورة
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                الاسم (اختياري)
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl transition-all"
                style={{
                  borderColor: visitorName ? business.primaryColor : '#D1D5DB'
                }}
                placeholder="اسمك"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                رقم الجوال (اختياري)
              </label>
              <input
                type="tel"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl transition-all"
                style={{
                  borderColor: visitorPhone ? business.primaryColor : '#D1D5DB'
                }}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!rating || isSubmitting || uploadingPhotos}
              className="w-full py-5 px-6 rounded-2xl text-white text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: !rating || isSubmitting || uploadingPhotos ? '#9CA3AF' : business.primaryColor,
                cursor: !rating || isSubmitting || uploadingPhotos ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">⏳</span>
                  جاري الإرسال...
                </span>
              ) : uploadingPhotos ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">📷</span>
                  جاري رفع الصور...
                </span>
              ) : (
                <span>إرسال التقييم</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}



// شاشة النجاح مع الكوبون
function SuccessScreen({ business, rating, coupon }) {
  const [copied, setCopied] = useState(false);
  const [googleOpened, setGoogleOpened] = useState(false);
  const [autoOpenAttempted, setAutoOpenAttempted] = useState(false);

  const copyCode = () => {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogle = () => {
    if (business.googleReviewUrl) {
      window.open(business.googleReviewUrl, '_blank', 'noopener,noreferrer');
      setGoogleOpened(true);
    }
  };

  // محاولة فتح Google تلقائياً
// فتح Google Reviews في tab جديد للتقييمات 3 نجوم فأكثر
useEffect(() => {
  if (rating >= 3 && business.googleReviewUrl && !googleOpened) {
    // محاولة فتح النافذة بعد 2 ثانية
    const timer = setTimeout(() => {
      const opened = window.open(business.googleReviewUrl, '_blank', 'noopener,noreferrer');
      
      // إذا تم حظر النافذة من المتصفح
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        console.log('⚠️ Popup blocked by browser');
        setGoogleOpened(false); // سيظهر زر "افتح Google"
      } else {
        setGoogleOpened(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [rating, business.googleReviewUrl, googleOpened]);


  // باقي الكود كما هو...
  // دالة لعرض نص المكافأة
  const getRewardText = () => {
    if (!coupon) return '';
    
    const { rewardType, rewardValue, rewardDetails } = coupon;
    
    if (rewardType === 'percentage_discount') {
      return `خصم ${rewardValue}%`;
    }
    if (rewardType === 'fixed_discount') {
      return `خصم ${rewardValue} ريال`;
    }
    if (rewardType === 'free_item') {
      return rewardValue;
    }
    if (rewardType === 'service_discount') {
      return `خصم ${rewardValue}% على ${rewardDetails || 'الخدمة'}`;
    }
    if (rewardType === 'next_visit') {
      return `خصم ${rewardValue}% على زيارتك القادمة`;
    }
    
    return `خصم ${rewardValue}%`;
  };

  const getRewardIcon = () => {
    if (!coupon) return '🎁';
    
    const { rewardType } = coupon;
    
    if (rewardType === 'percentage_discount') return '💰';
    if (rewardType === 'fixed_discount') return '💵';
    if (rewardType === 'free_item') return '🎁';
    if (rewardType === 'service_discount') return '🛠️';
    if (rewardType === 'next_visit') return '🔄';
    
    return '🎁';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Head>
        <title>شكراً لك! - {business.name}</title>
      </Head>

      <div className="max-w-2xl w-full">
        {/* شكراً */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            شكراً لك!
          </h1>
          <p className="text-xl text-gray-600">
            نقدّر وقتك ومشاركتك تجربتك معنا
          </p>
        </div>

        {/* الكوبون */}
        {coupon && (
          <div className="bg-gradient-to-br from-gold-400 via-yellow-500 to-orange-500 rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{getRewardIcon()}</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  مكافأة خاصة لك!
                </h2>
                <p className="text-white/90 text-xl font-semibold">
                  {getRewardText()}
                </p>
                {coupon.rewardDetails && (
                  <p className="text-white/80 text-sm mt-2">
                    {coupon.rewardDetails}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 mb-6">
                <div className="text-sm text-gray-600 mb-2 text-center">
                  كود الخصم:
                </div>
                <div className="text-4xl font-bold text-gold-600 tracking-widest text-center mb-4 font-mono">
                  {coupon.code}
                </div>
                
                <button
                  onClick={copyCode}
                  className="w-full py-3 bg-gold-600 text-white rounded-xl font-semibold hover:bg-gold-700 transition flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <span>✅</span>
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between text-white text-sm">
                  <span>📅 صالح حتى:</span>
                  <span className="font-semibold">
                    {new Date(coupon.expiresAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>كيفية الاستخدام:</span>
                </h3>
                <ul className="text-white/90 text-sm space-y-1">
                  <li>1️⃣ احفظ الكود أو خذ screenshot</li>
                  <li>2️⃣ أرنا الكود عند الدفع في زيارتك القادمة</li>
                  <li>3️⃣ استمتع بخصمك! 🎉</li>
                </ul>
              </div>

              {business.whatsappPhone && (
                <a
                  href={`https://wa.me/${business.whatsappPhone}?text=مرحباً! عندي كود خصم: ${coupon.code} 🎁`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition text-center"
                >
                  💬 احجز الآن عبر واتساب
                </a>
              )}
            </div>
          </div>
        )}

        {/* إشعار Google - محسّن */}
        {rating >= 3 && business.googleReviewUrl && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-center shadow-2xl mb-6 animate-pulse">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-5xl">🌟</div>
              <div className="text-white text-right">
                <h3 className="text-2xl font-bold">خطوة أخيرة مهمة!</h3>
                <p className="text-sm opacity-90">شارك تجربتك على Google Maps</p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
              {!googleOpened ? (
                <>
                  <p className="text-white text-sm font-semibold mb-2">
                    💫 تقييمك يساعدنا على التحسين
                  </p>
                  <p className="text-white/80 text-xs">
                    اضغط الزر أدناه لفتح صفحة Google
                  </p>
                </>
              ) : (
                <p className="text-white text-sm font-semibold">
                  ✅ تم فتح صفحة Google - تفضل بإضافة تقييمك!
                </p>
              )}
            </div>

            <button
              onClick={openGoogle}
              className="w-full py-5 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-3 text-xl"
            >
              <span className="text-2xl">⭐</span>
              <span>اضغط هنا للتقييم على Google</span>
              <span className="text-2xl">🚀</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


export async function getServerSideProps({ params }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappPhone: true,
      complaintPhone: true,
      googleReviewUrl: true,
      rewardsEnabled: true,
      
      // التخصيص
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      backgroundColor: true,
      
      // النظام المتقدم
      reward5Type: true,
      reward5Value: true,
      reward5Details: true,
      reward4Type: true,
      reward4Value: true,
      reward4Details: true,
      reward3Type: true,
      reward3Value: true,
      reward3Details: true,
      
      rewardExpiryDays: true,
    }
  });

  if (!business) {
    return { notFound: true };
  }

  return {
    props: { 
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        whatsappPhone: business.whatsappPhone || null,
        complaintPhone: business.complaintPhone || null,
        googleReviewUrl: business.googleReviewUrl || null,
        rewardsEnabled: business.rewardsEnabled ?? true,
        
        // التخصيص
        logo: business.logo || '',
        primaryColor: business.primaryColor || '#F59E0B',
        secondaryColor: business.secondaryColor || '#3B82F6',
        backgroundColor: business.backgroundColor || '#FFFFFF',
        
        reward5Type: business.reward5Type || 'percentage_discount',
        reward5Value: business.reward5Value || '15',
        reward5Details: business.reward5Details || null,
        reward4Type: business.reward4Type || 'percentage_discount',
        reward4Value: business.reward4Value || '10',
        reward4Details: business.reward4Details || null,
        reward3Type: business.reward3Type || 'percentage_discount',
        reward3Value: business.reward3Value || '5',
        reward3Details: business.reward3Details || null,
        
        rewardExpiryDays: business.rewardExpiryDays || 30,
      }
    }
  };
}
