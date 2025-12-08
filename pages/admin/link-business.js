import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../../context/UserContext';

export default function LinkBusinessPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [businesses, setBusinesses] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchBusinesses();
    }
  }, [user, authLoading, router]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/business/list');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/link-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessSlug: selectedSlug }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ تم الربط بنجاح!' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 to-blue-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            ربط حسابك بعمل
          </h1>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {businesses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">لا توجد أعمال متاحة</p>
              <a
                href="/business/create"
                className="text-gold-600 hover:text-gold-700 font-semibold"
              >
                إنشاء عمل جديد
              </a>
            </div>
          ) : (
            <form onSubmit={handleLink} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  اختر العمل:
                </label>
                <select
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  required
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 transition-all text-lg"
                >
                  <option value="">-- اختر --</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.slug}>
                      {business.name} ({business.slug})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedSlug}
                className={`w-full py-4 px-6 rounded-2xl text-white text-xl font-bold transition-all ${
                  isSubmitting || !selectedSlug
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700'
                }`}
              >
                {isSubmitting ? 'جاري الربط...' : 'ربط الآن'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


