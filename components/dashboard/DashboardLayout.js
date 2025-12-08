import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

<<<<<<< HEAD
  // ابحث عن القائمة واضف هذا العنصر
const menuItems = [
  { name: 'لوحة التحكم', icon: '📊', href: '/dashboard' },
  { name: 'التحليلات', icon: '📈', href: '/dashboard/analytics' },
  { name: 'رمز QR', icon: '📱', href: '/dashboard/qr-code' }, // ⬅️ جديد
  { name: 'الإعدادات', icon: '⚙️', href: '/dashboard/settings' },
];

=======
  const menuItems = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
    { href: '/dashboard/analytics', label: 'التحليلات', icon: '📈' },
    { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
  ];
>>>>>>> dbf23449599f38b6c9c6051867fd45c195ef6420

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gold-500">
            TapLink
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.name || user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded-lg ${
                  router.pathname === item.href
                    ? 'bg-gold-100 text-gold-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
