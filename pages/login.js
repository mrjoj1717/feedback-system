import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../context/UserContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // إذا كان المستخدم مسجل دخول، وجهه للـ dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      console.log('✅ Login successful:', data.user);
      console.log('📦 Owned businesses:', data.user.ownedBusinesses);

      // حفظ التوكن والمستخدم
      login(data.token, data.user);

      // التوجيه
      router.push('/dashboard');

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // عرض loading أثناء التحقق من الـ auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold-600 mb-2">TapLink</h1>
          <h2 className="text-2xl font-bold text-gray-900">نظام إدارة التقييمات</h2>
          <p className="mt-2 text-gray-600">تسجيل الدخول</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gold-600 hover:bg-gold-700'
              }`}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ليس لديك حساب؟{' '}
              <a href="/register" className="text-gold-600 hover:text-gold-700 font-semibold">
                إنشاء حساب جديد
              </a>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">حساب تجريبي:</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="text-gray-700">
                <span className="font-semibold">Email:</span> admin@example.com
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Password:</span> password123
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} TapLink. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
}
