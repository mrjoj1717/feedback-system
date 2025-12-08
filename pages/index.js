import Link from 'next/link';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-gold-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gold-600">TapLink</h1>
          <div className="space-x-4 space-x-reverse">
            <Link
              href="/login"
              className="px-6 py-2 text-gold-600 hover:text-gold-700 font-semibold"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 font-semibold"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            نظام إدارة التقييمات الذكي
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            اجمع تقييمات عملائك بذكاء. وجّه العملاء غير الراضين لواتساب للتواصل المباشر،
            والعملاء السعداء لخرائط جوجل لنشر تقييماتهم الإيجابية.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gold-500 text-white rounded-lg hover:bg-gold-600 font-bold text-lg"
            >
              ابدأ مجاناً
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-gold-600 border-2 border-gold-500 rounded-lg hover:bg-gold-50 font-bold text-lg"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          مميزات النظام
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-5xl mb-4">⭐</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              توجيه ذكي للتقييمات
            </h4>
            <p className="text-gray-600">
              وجّه التقييمات المنخفضة لواتساب والعالية لجوجل تلقائياً
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-5xl mb-4">📊</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              تحليلات شاملة
            </h4>
            <p className="text-gray-600">
              تتبع الزيارات والتقييمات والإحصائيات بشكل لحظي
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              روابط سهلة
            </h4>
            <p className="text-gray-600">
              أنشئ روابط تقييم مخصصة لعملك بسهولة
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} TapLink. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
