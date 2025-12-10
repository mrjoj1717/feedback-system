import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Head from 'next/head';

export default function CustomizePage() {
  const { user } = useUser();
  const [settings, setSettings] = useState({
    logo: '',
    primaryColor: '#F59E0B',
    secondaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (user?.ownedBusinesses?.[0]) {
      fetchSettings(user.ownedBusinesses[0]);
    }
  }, [user]);

  const fetchSettings = async (businessId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/business/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      
      setSettings({
        logo: data.logo || '',
        primaryColor: data.primaryColor || '#F59E0B',
        secondaryColor: data.secondaryColor || '#3B82F6',
        backgroundColor: data.backgroundColor || '#FFFFFF',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // تحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      alert('❌ الرجاء اختيار صورة');
      return;
    }

    // تحقق من الحجم (أقل من 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('❌ حجم الصورة يجب أن يكون أقل من 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', user.ownedBusinesses[0]);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setSettings({ ...settings, logo: data.url });
      alert('✅ تم رفع الشعار بنجاح!');
    } catch (error) {
      alert('❌ فشل رفع الشعار: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/business/update-customize', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId: user.ownedBusinesses[0],
          ...settings,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      alert('✅ تم حفظ الإعدادات بنجاح!');
    } catch (error) {
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
        <title>تخصيص الصفحة - Dashboard</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎨 تخصيص صفحة التقييم</h1>
          <p className="text-gray-600 mt-1">خصّص ألوان وشعار صفحتك</p>
        </div>

        {/* الشعار */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🖼️</span>
            <span>الشعار</span>
          </h2>

          <div className="flex items-center gap-6">
            {/* معاينة الشعار */}
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <span className="text-gray-400 text-sm text-center">
                  لا يوجد شعار
                </span>
              )}
            </div>

            {/* زر الرفع */}
            <div className="flex-1">
              <label
                htmlFor="logo-upload"
                className={`block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-center cursor-pointer ${
                  uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingLogo ? '⏳ جاري الرفع...' : '📤 رفع شعار جديد'}
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <p className="text-sm text-gray-600 mt-2">
                PNG, JPG - أقل من 2MB
              </p>
            </div>
          </div>
        </div>

        {/* الألوان */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🎨</span>
            <span>الألوان</span>
          </h2>

          <div className="space-y-4">
            {/* اللون الأساسي */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اللون الأساسي (الأزرار والعناصر الرئيسية):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings({ ...settings, primaryColor: e.target.value })
                  }
                  className="w-20 h-12 rounded-xl border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings({ ...settings, primaryColor: e.target.value })
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
                  placeholder="#F59E0B"
                />
              </div>
            </div>

            {/* اللون الثانوي */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اللون الثانوي (الروابط والعناصر الفرعية):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    setSettings({ ...settings, secondaryColor: e.target.value })
                  }
                  className="w-20 h-12 rounded-xl border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    setSettings({ ...settings, secondaryColor: e.target.value })
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* لون الخلفية */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                لون الخلفية:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    setSettings({ ...settings, backgroundColor: e.target.value })
                  }
                  className="w-20 h-12 rounded-xl border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    setSettings({ ...settings, backgroundColor: e.target.value })
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-gold-300 focus:border-gold-500"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* معاينة */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>👁️</span>
            <span>معاينة</span>
          </h2>

          <div
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: settings.backgroundColor }}
          >
            {settings.logo && (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-24 h-24 object-contain mx-auto mb-4"
              />
            )}
            
            <h3 className="text-2xl font-bold mb-4" style={{ color: settings.primaryColor }}>
              {user?.name || 'اسم النشاط'}
            </h3>

            <button
              className="px-8 py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: settings.primaryColor }}
            >
              زر تجريبي
            </button>

            <p className="mt-4" style={{ color: settings.secondaryColor }}>
              رابط تجريبي
            </p>
          </div>
        </div>

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
