import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  ClipboardCheck,
  Tag,
  Package,
  Truck,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/admin' },
  { icon: Pill, label: 'الأدوية', path: '/admin/medicines' },
  { icon: HeartPulse, label: 'خدمات التمريض', path: '/admin/nursing' },
  { icon: Package, label: 'إدارة الأقسام', path: '/admin/sections' },
  { icon: Tag, label: 'إدارة التصنيفات', path: '/admin/categories' },
  { icon: ShoppingCart, label: 'الطلبات', path: '/admin/orders' },
  { icon: Building2, label: 'الصيدليات', path: '/admin/pharmacies' },
  { icon: ClipboardCheck, label: 'مراجعة الأدوية', path: '/admin/medicine-review' },
  { icon: Truck, label: 'أسعار التوصيل', path: '/admin/delivery-settings' },
  { icon: Settings, label: 'الإعدادات', path: '/admin/settings' },
];

const pharmacistNavItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/pharmacist' },
  { icon: Pill, label: 'أدويتي', path: '/pharmacist/medicines' },
  { icon: ShoppingCart, label: 'طلباتي', path: '/pharmacist/orders' },
  { icon: Settings, label: 'الإعدادات', path: '/pharmacist/settings' },
];

const nurseNavItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/nurse' },
  { icon: HeartPulse, label: 'طلبات الزيارات', path: '/nurse/bookings' },
  { icon: Settings, label: 'الملف الشخصي', path: '/nurse/profile' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin, isNurse } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = isAdmin ? adminNavItems : isNurse ? nurseNavItems : pharmacistNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isItemActive = (itemPath: string) => {
    if (location.pathname === itemPath) return true;
    if (itemPath === '/admin' || itemPath === '/pharmacist') return false;
    return location.pathname.startsWith(`${itemPath}/`);
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col gradient-primary fixed right-0 top-0 h-screen z-40"
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground font-cairo">
                PharmaNow
              </span>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = isItemActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-cairo"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <Avatar className="w-10 h-10 border-2 border-sidebar-primary">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate font-cairo">
                  {user?.name}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {isAdmin ? 'مدير النظام' : isNurse ? 'ممرض أخصائي' : 'صيدلي'}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: mobileMenuOpen ? 0 : '100%' }}
        transition={{ type: 'tween' }}
        className="lg:hidden fixed right-0 top-0 h-screen w-72 gradient-primary z-50 flex flex-col"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground font-cairo">
              PharmaNow
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = isItemActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-cairo">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-200 hover:text-red-100 hover:bg-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-cairo">تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:mr-[280px]' : 'lg:mr-[80px]'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-lg border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-cairo">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="font-cairo cursor-pointer"
                  onClick={() => navigate(isAdmin ? '/admin/settings' : '/pharmacist/settings')}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-cairo cursor-pointer">
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
