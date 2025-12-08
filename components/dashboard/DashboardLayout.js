import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, logout } = useUser();

  const menuItems = [
    { name: 'لوحة التحكم', icon: '📊', href: '/dashboard' },
    { name: 'التحليلات', icon: '📈', href: '/dashboard/analytics' },
    { name: 'رمز QR', icon: '📱', href: '/dashboard/qr-code' },
    { name: 'الإعدادات', icon: '⚙️', href: '/dashboard/settings' },
  ];

  const isActive = (href) => {
    return router.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gold-600">TapLink</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-700">مرحباً، {user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-screen shadow-lg">
          <nav className="mt-8 px-4">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-gold-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
