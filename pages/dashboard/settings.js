import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsappPhone: '',
    googleReviewUrl: '',
  });

  useEffect(() => {
    console.log('🔍 Settings - User:', user);
    console.log('📦 Owned Businesses:', user?.ownedBusinesses);

    if (!authLoading && !user) {
      router.push('/login');
    } else if (user?.ownedBusinesses?.length > 0) {
      fetchBusiness(user.ownedBusinesses[0]);
    } else if (user) {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const fetchBusiness = async (businessId) => {
    try {
      console.log('📡 Fetching business:', businessId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/business/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📈 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Business data:', data);
        
        setBusiness(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          whatsappPhone: data.whatsappPhone || '',
          googleReviewUrl: data.googleReviewUrl || '',
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch business');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/business/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح! ✅' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل حفظ التغييرات');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user?.ownedBusinesses || user.ownedBusinesses.length === 0) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">لا توجد أعمال مرتبطة</h2>
            <p className="text-red-700 mb-4">يجب ربط حسابك بنشاط تجاري أولاً</p>
            <details className="text-left bg-white p-4 rounded">
              <summary className="cursor-pointer text-blue-600">عرض معلومات التشخيص</summary>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">فشل تحميل بيانات العمل</p>
          {message.text && <p className="text-sm mt-2">{message.text}</p>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-gray-600 mt-2">إدارة معلومات عملك</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات العمل</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العمل *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                required
                placeholder="اسم مؤسستك أو متجرك"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="info@business.com"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم واتساب (مع كود الدولة) *
              </label>
              <input
                type="text"
                name="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={handleChange}
                placeholder="966501234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                dir="ltr"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                مثال: 966501234567 (بدون + أو 00)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط مراجعة Google *
              </label>
              <input
                type="url"
                name="googleReviewUrl"
                value={formData.googleReviewUrl}
                onChange={handleChange}
                placeholder="https://g.page/r/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                dir="ltr"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                احصل عليه من: Google Business Profile
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gold-600 hover:bg-gold-700'
              }`}
            >
              {isSaving ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
            </button>
          </form>
        </div>

        {/* روابط مفيدة */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔗 روابط مفيدة</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">صفحة التقييم</p>
                <p className="text-sm text-gray-600">شارك هذا الرابط مع عملائك</p>
              </div>
              <a
                href={`/r/${business.slug}`}
                target="_blank"
                className="bg-gold-600 text-white px-4 py-2 rounded-lg hover:bg-gold-700 transition"
              >
                فتح →
              </a>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">📋 انسخ الرابط:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${business.slug}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white rounded border border-blue-200 text-sm"
                  dir="ltr"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/r/${business.slug}`
                    );
                    alert('تم نسخ الرابط! ✅');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  نسخ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
