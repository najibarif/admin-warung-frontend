import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  Store, 
  LayoutDashboard, 
  PackageSearch, 
  Calculator,
  LogOut,
  User,
  Receipt
} from 'lucide-react';
import { cn } from '../utils';

export default function Layout() {
  const { user, logout, checkAuth } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user && !localStorage.getItem('admin_token')) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manajemen Produk', href: '/products', icon: PackageSearch },
    { name: 'Kasir POS', href: '/pos', icon: Calculator },
    { name: 'Riwayat Transaksi', href: '/transactions', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight">Toko Nabil</h1>
            <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-slate-400")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
