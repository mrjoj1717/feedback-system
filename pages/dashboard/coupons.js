import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Head from 'next/head';

export default function CouponsPage() {
  const { user } = useUser();
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ 
    total: 0, 
    used: 0, 
    active: 0, 
    expired: 0 
  }); // ⬅️ هنا التعديل
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCoupons();
    }
  }, [user, filter, searchTerm]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = new URL('/api/coupon/list', window.location.origin);
      
      if (filter !== 'all') url.searchParams.append('status', filter);
      if (searchTerm) url.searchParams.append('search', searchTerm);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch coupons');
      }

      const data = await res.json();
      setCoupons(data.coupons || []);
      setStats(data.stats || { total: 0, used: 0, active: 0, expired: 0 });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
      setStats({ total: 0, used: 0, active: 0, expired: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;

    try {
      const res = await fetch('/api/coupon/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verifyCode.toUpperCase(),
          businessId: user.ownedBusinesses[0],
        }),
      });

      const data = await res.json();
      setVerifyResult(data);
    } catch (error) {
      setVerifyResult({ valid: false, message: 'حدث خطأ' });
    }
  };

  const handleRedeem = async (code) => {
    if (!confirm('هل أنت متأكد من استخدام هذا الكوبون؟')) return;

    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ تم استخدام الكوبون بنجاح!');
        fetchCoupons();
        setShowVerifyModal(false);
        setVerifyResult(null);
        setVerifyCode('');
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      alert('❌ حدث خطأ');
    }
  };

  const getCouponStatus = (coupon) => {
    if (coupon.isUsed) {
      return { text: 'مستخدم', color: 'bg-gray-100 text-gray-700' };
    }
    if (new Date() > new Date(coupon.expiresAt)) {
      return { text: 'منتهي', color: 'bg-red-100 text-red-700' };
    }
    return { text: 'نشط', color: 'bg-green-100 text-green-700' };
  };

  // دالة لعرض المكافأة
  const getRewardDisplay = (coupon) => {
    const { rewardType, rewardValue, rewardDetails } = coupon;
    
    if (rewardType === 'percentage_discount') {
      return `${rewardValue}%`;
    }
    if (rewardType === 'fixed_discount') {
      return `${rewardValue} ر.س`;
    }
    if (rewardType === 'free_item') {
      return rewardValue;
    }
    if (rewardType === 'service_discount') {
      return `${rewardValue}% على ${rewardDetails || 'الخدمة'}`;
    }
    if (rewardType === 'next_visit') {
      return `${rewardValue}% زيارة قادمة`;
    }
    
    return rewardValue;
  };

  return (
    <DashboardLayout>
      <Head>
        <title>إدارة الكوبونات - Dashboard</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎫 الكوبونات</h1>
            <p className="text-gray-600 mt-1">إدارة كوبونات الخصم</p>
          </div>
          
          <button
            onClick={() => setShowVerifyModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            ✅ التحقق من كوبون
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon="🎫"
            label="إجمالي الكوبونات"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon="✅"
            label="المستخدمة"
            value={stats.used}
            color="gray"
          />
          <StatCard
            icon="🟢"
            label="النشطة"
            value={stats.active}
            color="green"
          />
          <StatCard
            icon="🔴"
            label="المنتهية"
            value={stats.expired}
            color="red"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'used', 'expired'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl font-semibold transition ${
                    filter === status
                      ? 'bg-gold-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' && '🎫 الكل'}
                  {status === 'active' && '🟢 النشطة'}
                  {status === 'used' && '✅ المستخدمة'}
                  {status === 'expired' && '🔴 المنتهية'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالكود أو الاسم أو الجوال..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎫</div>
              <p className="text-xl text-gray-600">لا توجد كوبونات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الكود</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المكافأة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">العميل</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الصلاحية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">تاريخ الإنشاء</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-gold-600">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-lg">
                            {getRewardDisplay(coupon)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              {coupon.customerName || '-'}
                            </div>
                            <div className="text-gray-500" dir="ltr">
                              {coupon.customerPhone || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(coupon.expiresAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(coupon.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4">
                          {!coupon.isUsed && new Date() <= new Date(coupon.expiresAt) && (
                            <button
                              onClick={() => handleRedeem(coupon.code)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                            >
                              ✅ استخدام
                            </button>
                          )}
                          {coupon.isUsed && (
                            <span className="text-sm text-gray-500">
                              {new Date(coupon.usedAt).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">✅ التحقق من كوبون</h2>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifyResult(null);
                  setVerifyCode('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  كود الكوبون:
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="STARXXXXXX"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500 font-mono text-lg"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleVerify}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
              >
                تحقق
              </button>

              {verifyResult && (
                <div className={`p-4 rounded-xl ${
                  verifyResult.valid ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                }`}>
                  {verifyResult.valid ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-700 font-bold">
                        <span className="text-2xl">✅</span>
                        <span>كوبون صالح!</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">المكافأة:</span>
                          <span className="font-bold">{getRewardDisplay(verifyResult.coupon)}</span>
                        </div>
                        {verifyResult.coupon.customerName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">العميل:</span>
                            <span className="font-semibold">{verifyResult.coupon.customerName}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">صالح حتى:</span>
                          <span className="font-semibold">
                            {new Date(verifyResult.coupon.expiresAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRedeem(verifyCode)}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition mt-2"
                      >
                        ✅ استخدام الكوبون
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <span className="text-2xl">❌</span>
                      <span>{verifyResult.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Component - Stat Card
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    gray: 'from-gray-500 to-gray-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-4xl">{icon}</span>
        <span className="text-4xl font-bold">{value}</span>
      </div>
      <div className="text-sm font-semibold opacity-90">{label}</div>
    </div>
  );
}
