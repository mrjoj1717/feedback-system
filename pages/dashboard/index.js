import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Head from 'next/head';

export default function DashboardHome() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [stats, setStats] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user?.ownedBusinesses?.length > 0) {
      fetchData(user.ownedBusinesses[0]);
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

 const fetchData = async (businessId) => {
  try {
    const token = localStorage.getItem('token');

    // جلب بيانات Business
    const businessRes = await fetch(`/api/business/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (businessRes.ok) {
      const businessData = await businessRes.json();
      setBusiness(businessData);
    }

    // ✅ المسار الجديد
    const statsRes = await fetch(`/api/business/stats/${businessId}`);
    
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      setStats(statsData);
      console.log('✅ Stats loaded:', statsData);
    }
  } catch (error) {
    console.error('❌ Error fetching data:', error);
  } finally {
    setIsLoading(false);
  }
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

  if (!business || !stats) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">لا توجد بيانات متاحة</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>لوحة التحكم - {business.name}</title>
      </Head>

      <div className="space-y-6">
        {/* الترحيب */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            مرحباً في {business.name} 👋
          </h1>
          <p className="text-gray-600 mt-2">إليك نظرة عامة على أداء نشاطك</p>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* إجمالي الزيارات */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">👥</span>
              <div className="text-right">
                <p className="text-sm opacity-90">إجمالي الزيارات</p>
                <p className="text-3xl font-bold">{stats.totalVisits}</p>
              </div>
            </div>
            <div className="text-sm opacity-75">
              {stats.recentVisits} زيارة آخر 30 يوم
            </div>
          </div>

          {/* إجمالي التقييمات */}
          <div className="bg-gradient-to-br from-gold-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">⭐</span>
              <div className="text-right">
                <p className="text-sm opacity-90">إجمالي التقييمات</p>
                <p className="text-3xl font-bold">{stats.totalFeedbacks}</p>
              </div>
            </div>
            <div className="text-sm opacity-75">
              متوسط: {stats.averageRating} نجوم
            </div>
          </div>

          {/* معدل التحويل */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">📈</span>
              <div className="text-right">
                <p className="text-sm opacity-90">معدل التحويل</p>
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
              </div>
            </div>
            <div className="text-sm opacity-75">
              من الزيارات إلى تقييمات
            </div>
          </div>

          {/* الكوبونات */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">🎁</span>
              <div className="text-right">
                <p className="text-sm opacity-90">الكوبونات</p>
                <p className="text-3xl font-bold">{stats.couponsUsed}</p>
              </div>
            </div>
            <div className="text-sm opacity-75">
              {stats.activeCoupons} كوبون نشط
            </div>
          </div>
        </div>

        {/* توزيع التقييمات */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">⭐ توزيع التقييمات</h2>
          <div className="space-y-3">
            {stats.ratingDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  <span className="font-medium">{item.rating}</span>
                  <span className="text-gold-500">⭐</span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.rating >= 4 ? 'bg-green-500' :
                        item.rating === 3 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{
                        width: `${stats.totalFeedbacks > 0 ? (item.count / stats.totalFeedbacks) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right font-bold">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* مصادر الزيارات */}
        {stats.visitSources?.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">📱 مصادر الزيارات</h2>
            <div className="space-y-3">
              {stats.visitSources.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {source.source === 'google' ? '🔍' :
                       source.source === 'facebook' ? '📘' :
                       source.source === 'instagram' ? '📸' :
                       source.source === 'twitter' ? '🐦' :
                       source.source === 'whatsapp' ? '💬' :
                       source.source === 'tiktok' ? '🎵' :
                       source.source === 'direct' ? '🔗' : '🌐'}
                    </span>
                    <span className="font-medium capitalize">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">{source.count}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(source.count / stats.totalVisits) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {((source.count / stats.totalVisits) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أوقات الذروة */}
        {stats.peakHours?.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">⏰ أوقات الذروة</h2>
            <div className="grid grid-cols-5 gap-4">
              {stats.peakHours.map((peak) => (
                <div key={peak.hour} className="text-center bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {peak.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    {peak.hour}:00
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
