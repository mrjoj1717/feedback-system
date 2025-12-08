import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import Head from 'next/head';

export default function CreateBusinessPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    whatsappPhone: '',
    googleReviewUrl: '',
  });
  const [autoLink, setAutoLink] = useState(false); // ⬅️ جديد
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdBusiness, setCreatedBusiness] = useState(null); // ⬅️ جديد

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    setFormData({ ...formData, name, slug });
  };

  const handleSlugChange = (e) => {
    let slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setFormData({ ...formData, slug });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      console.log('📤 Sending data:', { ...formData, autoLink });
      
      const response = await fetch('/api/business/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, autoLink }), // ⬅️ جديد
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء العمل');
      }

      // عرض البيانات المنشأة
      setCreatedBusiness(data.business);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('تم النسخ! ✅');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  // عرض النتيجة بعد الإنشاء
  if (createdBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
        <Head>
          <title>تم الإنشاء بنجاح - TapLink</title>
        </Head>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                تم إنشاء العمل بنجاح!
              </h1>
            </div>

            <div className="space-y-4 mb-8">
              {/* Business ID */}
              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🆔 Business ID (انسخه):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createdBusiness.id}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => copyToClipboard(createdBusiness.id)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    نسخ
                  </button>
                </div>
              </div>

              {/* اسم العمل */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏢 اسم العمل:
                </label>
                <p className="text-lg">{createdBusiness.name}</p>
              </div>

              {/* Slug */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔗 الرابط المخصص:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/r/${createdBusiness.slug}`}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/r/${createdBusiness.slug}`)}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                  >
                    نسخ
                  </button>
                </div>
              </div>

              {/* واتساب */}
              {createdBusiness.whatsappPhone && (
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📱 واتساب:
                  </label>
                  <p className="text-lg">{createdBusiness.whatsappPhone}</p>
                </div>
              )}
            </div>

            {/* تعليمات */}
            <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span>💡</span>
                الخطوات التالية:
              </h3>
              {autoLink ? (
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span>✅</span>
                    <span>تم ربط Business بحسابك تلقائياً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✅</span>
                    <span>يمكنك الآن الذهاب للـ Dashboard</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span>1️⃣</span>
                    <span>انسخ <strong>Business ID</strong> أعلاه</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>2️⃣</span>
                    <span>استخدمه لربط Business بالمستخدم يدوياً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>3️⃣</span>
                    <span>أو شغّل Script: <code className="bg-gray-200 px-2 py-1 rounded">node scripts/link-manual.js</code></span>
                  </li>
                </ul>
              )}
            </div>

            {/* أزرار */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCreatedBusiness(null);
                  setFormData({
                    name: '',
                    slug: '',
                    email: '',
                    whatsappPhone: '',
                    googleReviewUrl: '',
                  });
                }}
                className="flex-1 py-4 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 font-semibold"
              >
                إنشاء عمل آخر
              </button>
              {autoLink && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-4 bg-gold-600 text-white rounded-2xl hover:bg-gold-700 font-semibold"
                >
                  الذهاب للـ Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-blue-50 py-12 px-4">
      <Head>
        <title>إنشاء عمل جديد - TapLink</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 أنشئ عملك الآن
          </h1>
          <p className="text-gray-600 text-lg">
            أدخل معلومات عملك لبدء جمع التقييمات
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اسم العمل */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                اسم العمل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                required
                minLength="3"
                maxLength="100"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="مثال: مؤسسة أناكت المنازل التجارية"
              />
            </div>

            {/* الرابط المخصص */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                الرابط المخصص <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-lg shrink-0">
                  /r/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  required
                  minLength="3"
                  maxLength="50"
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                  placeholder="almnazil"
                  dir="ltr"
                />
              </div>
            </div>

            {/* البريد */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="info@business.com"
                dir="ltr"
              />
            </div>

            {/* واتساب */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                رقم واتساب <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={handleChange}
                required
                pattern="^[0-9]{10,15}$"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="966538855824"
                dir="ltr"
              />
            </div>

            {/* Google Review */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                رابط Google Review (اختياري)
              </label>
              <input
                type="url"
                name="googleReviewUrl"
                value={formData.googleReviewUrl}
                onChange={handleChange}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="https://g.page/r/..."
                dir="ltr"
              />
            </div>

            {/* خيار الربط التلقائي */}
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLink}
                  onChange={(e) => setAutoLink(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-lg font-semibold">
                  ربط Business بحسابي تلقائياً
                </span>
              </label>
              <p className="text-sm text-gray-600 mt-2 mr-8">
                {autoLink 
                  ? '✅ سيتم ربط Business بحسابك مباشرة بعد الإنشاء' 
                  : '⏭️  سأقوم بربط Business يدوياً لاحقاً'}
              </p>
            </div>

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.slug || !formData.whatsappPhone}
              className={`w-full py-5 px-6 rounded-2xl text-white text-xl font-bold transition-all duration-300 transform ${
                isSubmitting || !formData.name || !formData.slug || !formData.whatsappPhone
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">⏳</span>
                  جاري الإنشاء...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <span>إنشاء العمل</span>
                  <span className="text-2xl">🚀</span>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
