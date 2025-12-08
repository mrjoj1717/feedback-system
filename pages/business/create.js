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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    setFormData({ ...formData, name, slug });
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
      
      const response = await fetch('/api/business/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء العمل');
      }

      console.log('✅ Business created:', data.business);

      alert('🎉 تم إنشاء عملك بنجاح!');
      router.push('/dashboard');

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
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
                اسم العمل *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="مثال: مؤسسة أناكت المنازل التجارية"
              />
            </div>

            {/* الرابط المخصص */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                الرابط المخصص *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-lg">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/r/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                  placeholder="anakt"
                  dir="ltr"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                أحرف إنجليزية صغيرة وأرقام وشرطات فقط
              </p>
            </div>

            {/* البريد الإلكتروني */}
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

            {/* رقم واتساب */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                رقم واتساب (مع كود الدولة) *
              </label>
              <input
                type="tel"
                name="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                placeholder="966501234567"
                dir="ltr"
              />
              <p className="text-sm text-gray-500 mt-1">
                مثال: 966501234567 (بدون + أو 00)
              </p>
            </div>

            {/* رابط Google Reviews */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                رابط مراجعة Google (اختياري)
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

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 px-6 rounded-2xl text-white text-xl font-bold transition-all duration-300 transform ${
                isSubmitting
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
