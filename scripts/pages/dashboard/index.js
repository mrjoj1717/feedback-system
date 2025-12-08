import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';
import RecentFeedbacks from '../../components/dashboard/RecentFeedbacks';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
useEffect(() => {
  console.log('👤 User:', user);
  console.log('📦 Owned Businesses:', user?.ownedBusinesses);
  
  if (user && user.ownedBusinesses?.length > 0) {
    console.log('✅ Loading business:', user.ownedBusinesses[0]);
    fetchDashboardData(user.ownedBusinesses[0]);
  } else if (user && user.ownedBusinesses?.length === 0) {
    console.error('❌ No businesses linked to user!');
    setIsLoading(false);
    setError('لا توجد أعمال مسجلة');
  }
}, [user]);

  useEffect(() => {
    
    if (user && user.ownedBusinesses?.length > 0) {
      fetchDashboardData(user.ownedBusinesses[0]);
    } else if (user && user.ownedBusinesses?.length === 0) {
      setIsLoading(false);
      setError('لا توجد أعمال مسجلة');
    }
  }, [user]);

  const fetchDashboardData = async (businessId) => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [analyticsRes, feedbackRes] = await Promise.all([
        fetch(`/api/analytics?businessId=${businessId}&days=7`, { headers }),
        fetch(`/api/feedback?businessId=${businessId}&limit=5&page=1`, { headers }),
      ]);

      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
      if (!feedbackRes.ok) throw new Error('Failed to fetch feedbacks');

      const analyticsData = await analyticsRes.json();
      const feedbackData = await feedbackRes.json();

      setStats(analyticsData.stats);
      setChartData(analyticsData.last7Days);
      setRecentFeedbacks(feedbackData.feedbacks);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          خطأ: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-2">مرحباً بعودتك، {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="إجمالي الزيارات"
            value={stats?.totalViews || 0}
            icon="👁️"
            color="blue"
          />
          <StatsCard
            title="إجمالي التقييمات"
            value={stats?.totalFeedback || 0}
            icon="⭐"
            color="yellow"
          />
          <StatsCard
            title="متوسط التقييم"
            value={stats?.averageRating || '0.0'}
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            الإحصائيات - آخر 7 أيام
          </h2>
          {chartData.length > 0 ? (
            <AnalyticsChart data={chartData} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات لعرضها
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">آخر التقييمات</h2>
          <RecentFeedbacks feedbacks={recentFeedbacks} />
        </div>
      </div>
    </DashboardLayout>
  );
}
