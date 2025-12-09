import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Head from 'next/head';

// أنواع المكافآت
const REWARD_TYPES = [
  { value: 'percentage_discount', label: 'خصم بالنسبة %', icon: '💰', example: '15% خصم' },
  { value: 'fixed_discount', label: 'خصم بمبلغ ثابت', icon: '💵', example: '50 ريال خصم' },
  { value: 'free_item', label: 'منتج مجاني', icon: '🎁', example: 'قهوة مجانية' },
  { value: 'service_discount', label: 'خصم على خدمة', icon: '🛠️', example: '20% على التنظيف' },
  { value: 'next_visit', label: 'خصم الزيارة القادمة', icon: '🔄', example: '25% زيارتك القادمة' },
];

export default function RewardsSettingsPage() {
  const { user } = useUser();
  const [businessId, setBusinessId] = useState(null);
  const [settings, setSettings] = useState({
    rewardsEnabled: true,
    reward5Type: 'percentage_discount',
    reward5Value: '15',
    reward5Details: '',
    reward4Type: 'percentage_discount',
    reward4Value: '10',
    reward4Details: '',
    reward3Type: 'percentage_discount',
    reward3Value: '5',
    reward3Details: '',
    rewardExpiryDays: 30,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewRating, setPreviewRating] = useState(5);

  useEffect(() => {
    if (user?.ownedBusinesses?.[0]) {
      fetchSettings(user.ownedBusinesses[0]);
    }
  }, [user]);

  const fetchSettings = async (businessId) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching settings for:', businessId);
      
      const res = await fetch(`/api/business/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch business');
      }
      
      const data = await res.json();
      
      console.log('✅ Settings loaded:', data);
      
      // حفظ businessId
      setBusinessId(data.id);
      
      setSettings({
        rewardsEnabled: data.rewardsEnabled ?? true,
        reward5Type: data.reward5Type || 'percentage_discount',
        reward5Value: data.reward5Value || '15',
        reward5Details: data.reward5Details || '',
        reward4Type: data.reward4Type || 'percentage_discount',
        reward4Value: data.reward4Value || '10',
        reward4Details: data.reward4Details || '',
        reward3Type: data.reward3Type || 'percentage_discount',
        reward3Value: data.reward3Value || '5',
        reward3Details: data.reward3Details || '',
        rewardExpiryDays: data.rewardExpiryDays || 30,
      });
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      alert('فشل تحميل الإعدادات: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessId) {
      alert('❌ خطأ: معرّف النشاط غير موجود');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      console.log('💾 Saving settings for:', businessId);
      
      const res = await fetch(`/api/business/update-rewards`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          ...settings,
        }),
      });

      if (res.ok) {
        alert('✅ تم حفظ الإعدادات بنجاح!');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل الحفظ');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      alert('❌ حدث خطأ: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>إعدادات المكافآت - Dashboard</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ إعدادات المكافآت</h1>
          <p className="text-gray-600 mt-1">تحكم في نظام الكوبونات والخصومات</p>
        </div>

        {/* تفعيل/إيقاف */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <label className="flex items-center gap-4 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.rewardsEnabled}
                onChange={(e) => setSettings({...settings, rewardsEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-16 h-9 bg-gray-300 peer-checked:bg-green-500 rounded-full peer transition-all"></div>
              <div className="absolute top-1 left-1 w-7 h-7 bg-white rounded-full peer-checked:translate-x-7 transition-all shadow-md"></div>
            </div>
            <div>
              <div className="font-bold text-xl text-gray-900">تفعيل نظام المكافآت</div>
              <div className="text-sm text-gray-600 mt-1">
                {settings.rewardsEnabled ? (
                  <span className="text-green-600 font-semibold">✅ النظام مفعّل</span>
                ) : (
                  <span className="text-red-600 font-semibold">⏸️ النظام متوقف</span>
                )}
              </div>
            </div>
          </label>
        </div>

        {settings.rewardsEnabled && (
          <>
            {/* إعدادات المكافآت */}
            <div className="space-y-6">
              {/* 5 نجوم */}
              <RewardCard
                stars={5}
                type={settings.reward5Type}
                value={settings.reward5Value}
                details={settings.reward5Details}
                onChange={(field, val) => setSettings({...settings, [`reward5${field}`]: val})}
                color="gold"
              />

              {/* 4 نجوم */}
              <RewardCard
                stars={4}
                type={settings.reward4Type}
                value={settings.reward4Value}
                details={settings.reward4Details}
                onChange={(field, val) => setSettings({...settings, [`reward4${field}`]: val})}
                color="blue"
              />

              {/* 3 نجوم */}
              <RewardCard
                stars={3}
                type={settings.reward3Type}
                value={settings.reward3Value}
                details={settings.reward3Details}
                onChange={(field, val) => setSettings({...settings, [`reward3${field}`]: val})}
                color="green"
              />
            </div>

            {/* مدة الصلاحية */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>⏰</span>
                <span>مدة صلاحية الكوبون</span>
              </h2>
              
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.rewardExpiryDays}
                  onChange={(e) => setSettings({...settings, rewardExpiryDays: parseInt(e.target.value) || 1})}
                  className="w-32 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-3xl font-bold focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
                />
                <span className="text-2xl font-bold text-gray-900">يوم</span>
              </div>
            </div>

            {/* معاينة الكوبون */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>👁️</span>
                <span>معاينة الكوبون</span>
              </h2>

              <div className="flex gap-2 mb-6">
                {[5, 4, 3].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setPreviewRating(rating)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      previewRating === rating
                        ? 'bg-gold-500 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {'⭐'.repeat(rating)}
                  </button>
                ))}
              </div>

              <CouponPreview
                rating={previewRating}
                type={settings[`reward${previewRating}Type`]}
                value={settings[`reward${previewRating}Value`]}
                details={settings[`reward${previewRating}Details`]}
                expiryDays={settings.rewardExpiryDays}
              />
            </div>
          </>
        )}

        {/* زر الحفظ */}
        <div className="sticky bottom-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-2xl transition-all transform ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 hover:scale-105'
            }`}
          >
            {isSaving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Component - بطاقة إعداد مكافأة
function RewardCard({ stars, type, value, details, onChange, color }) {
  const colors = {
    gold: 'from-gold-400 to-gold-500',
    blue: 'from-blue-400 to-blue-500',
    green: 'from-green-400 to-green-500',
  };

  const selectedType = REWARD_TYPES.find(t => t.value === type);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">{'⭐'.repeat(stars)}</div>
        <div>
          <div className="font-bold text-xl text-gray-900">تقييم {stars} نجوم</div>
          <div className="text-sm text-gray-600">اختر نوع المكافأة وقيمتها</div>
        </div>
      </div>

      {/* نوع المكافأة */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">نوع المكافأة:</label>
        <select
          value={type}
          onChange={(e) => onChange('Type', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
        >
          {REWARD_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.icon} {rt.label} - {rt.example}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* القيمة */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {type.includes('percentage') ? 'النسبة %' : 
             type.includes('fixed') ? 'المبلغ (ريال)' : 
             'القيمة'}:
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange('Value', e.target.value)}
            placeholder={type.includes('free_item') ? 'قهوة مجانية' : '15'}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
          />
        </div>

        {/* تفاصيل إضافية */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            تفاصيل (اختياري):
          </label>
          <input
            type="text"
            value={details || ''}
            onChange={(e) => onChange('Details', e.target.value)}
            placeholder="مثل: على جميع المنتجات"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300"
          />
        </div>
      </div>
    </div>
  );
}

// Component - معاينة الكوبون
function CouponPreview({ rating, type, value, details, expiryDays }) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  const rewardType = REWARD_TYPES.find(t => t.value === type);
  
  const getRewardText = () => {
    if (type === 'percentage_discount') return `خصم ${value}%`;
    if (type === 'fixed_discount') return `خصم ${value} ريال`;
    if (type === 'free_item') return value;
    if (type === 'service_discount') return `خصم ${value}% على ${details || 'الخدمة'}`;
    if (type === 'next_visit') return `خصم ${value}% على زيارتك القادمة`;
    return value;
  };

  return (
    <div className="bg-gradient-to-br from-gold-400 via-yellow-500 to-orange-500 rounded-2xl p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative z-10 text-center">
        <div className="text-5xl mb-3">{rewardType?.icon}</div>
        <h3 className="text-2xl font-bold mb-2">مكافأة خاصة لك!</h3>
        <p className="text-xl font-semibold mb-2">{getRewardText()}</p>
        {details && <p className="text-sm opacity-90 mb-4">{details}</p>}
        
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="text-sm text-gray-600 mb-1">كود الخصم:</div>
          <div className="text-3xl font-bold text-gold-600 font-mono">
            STAR{Math.random().toString(36).substring(2, 8).toUpperCase()}
          </div>
        </div>
        
        <p className="text-white/80 text-sm">
          صالح حتى {expiryDate.toLocaleDateString('ar-SA')}
        </p>
      </div>
    </div>
  );
}
