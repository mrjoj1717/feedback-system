import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.ownedBusinesses?.length > 0) {
      fetchAnalytics(user.ownedBusinesses[0], period);
    } else if (user) {
      setIsLoading(false);
      setError('لا توجد أعمال مرتبطة بحسابك');
    }
  }, [user, period]);

  const fetchAnalytics = async (businessId, days) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('الرجاء تسجيل الدخول مرة أخرى');
      }

      const response = await fetch(`/api/analytics?businessId=${businessId}&days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل تحميل البيانات');
      }

      const data = await response.json();
      
      setStats(data.stats);
      setChartData(data.last7Days || []);

    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message);
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">خطأ</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalFeedbacks = stats?.totalFeedback || 0;
  const avgRating = parseFloat(stats?.averageRating || 0);

  // حساب توزيع التقييمات
  const ratingDistribution = chartData.reduce((acc, day) => {
    return {
      rating1: (acc.rating1 || 0) + (day.rating1 || 0),
      rating2: (acc.rating2 || 0) + (day.rating2 || 0),
      rating3: (acc.rating3 || 0) + (day.rating3 || 0),
      rating4: (acc.rating4 || 0) + (day.rating4 || 0),
      rating5: (acc.rating5 || 0) + (day.rating5 || 0),
    };
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التحليلات التفصيلية</h1>
            <p className="text-gray-600 mt-2">تقارير شاملة لأداء أعمالك</p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setPeriod(7)}
              className={`px-4 py-2 rounded-lg transition ${
                period === 7
                  ? 'bg-gold-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              7 أيام
            </button>
            <button
              onClick={() => setPeriod(30)}
              className={`px-4 py-2 rounded-lg transition ${
                period === 30
                  ? 'bg-gold-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              30 يوم
            </button>
            <button
              onClick={() => setPeriod(90)}
              className={`px-4 py-2 rounded-lg transition ${
                period === 90
                  ? 'bg-gold-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              90 يوم
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="إجمالي الزيارات"
            value={stats?.totalViews || 0}
            icon="👁️"
            color="blue"
          />
          <StatsCard
            title="إجمالي التقييمات"
            value={totalFeedbacks}
            icon="⭐"
            color="yellow"
          />
          <StatsCard
            title="متوسط التقييم"
            value={avgRating.toFixed(1)}
            icon="📊"
            color="green"
          />
          <StatsCard
            title="معدل التحويل"
            value={`${stats?.conversionRate || 0}%`}
            icon="📈"
            color="purple"
          />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            اتجاه الزيارات والتقييمات - آخر {period} يوم
          </h2>
          {chartData.length > 0 ? (
            <AnalyticsChart data={chartData} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات لعرضها
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">توزيع التقييمات</h2>
          {totalFeedbacks > 0 ? (
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[`rating${star}`] || 0;
                const percentage = totalFeedbacks > 0 ? (count / totalFeedbacks) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-20">
                      <span className="font-semibold">{star}</span>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gold-500 h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-semibold">{count}</span>
                      <span className="text-gray-500 text-sm"> ({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد تقييمات بعد
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Day */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 أفضل يوم</h3>
            {chartData.length > 0 ? (
              <>
                <div className="text-3xl font-bold text-gold-600 mb-2">
                  {chartData.reduce((max, day) => 
                    (day.feedbacks || 0) > (max.feedbacks || 0) ? day : max, 
                    chartData[0]
                  )?.date || '-'}
                </div>
                <p className="text-gray-600">أكثر يوم حصل على تقييمات</p>
              </>
            ) : (
              <p className="text-gray-500">لا توجد بيانات</p>
            )}
          </div>

          {/* Satisfaction Rate */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">😊 معدل الرضا</h3>
            {totalFeedbacks > 0 ? (
              <>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {(((ratingDistribution.rating4 || 0) + (ratingDistribution.rating5 || 0)) / totalFeedbacks * 100).toFixed(0)}%
                </div>
                <p className="text-gray-600">نسبة التقييمات 4 و 5 نجوم</p>
              </>
            ) : (
              <p className="text-gray-500">لا توجد بيانات</p>
            )}
          </div>
        </div>

        {/* Insights */}
        {totalFeedbacks > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💡 رؤى وملاحظات</h3>
            <div className="space-y-3 text-gray-700">
              {avgRating >= 4.5 && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎉</span>
                  <p>ممتاز! متوسط تقييمك مرتفع جداً. استمر في تقديم خدمة رائعة!</p>
                </div>
              )}
              {avgRating >= 3 && avgRating < 4.5 && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👍</span>
                  <p>جيد! يمكنك تحسين الخدمة للوصول لمتوسط أعلى.</p>
                </div>
              )}
              {avgRating < 3 && totalFeedbacks > 5 && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p>انتبه! متوسط التقييم منخفض. تحقق من التقييمات السلبية واعمل على تحسين الخدمة.</p>
                </div>
              )}
              {(stats?.conversionRate || 0) < 10 && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📢</span>
                  <p>معدل التحويل منخفض. جرّب تشجيع العملاء على ترك تقييماتهم.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
