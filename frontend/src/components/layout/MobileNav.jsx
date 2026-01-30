import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, BarChart3, CreditCard, Target, Settings, 
  User, LogOut, Crown, MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  // Only show on dashboard pages when authenticated
  if (!isAuthenticated) return null;

  // Don't show on admin pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/backman')) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard', tab: 'overview' },
    { icon: BarChart3, label: 'Stats', path: '/dashboard', tab: 'analytics' },
    { icon: Crown, label: 'Plans', path: '/pricing', tab: null },
    { icon: CreditCard, label: 'Billing', path: '/dashboard', tab: 'billing' },
    { icon: User, label: 'Profile', path: '/dashboard', tab: 'settings' },
  ];

  const isActive = (item) => {
    if (item.path === '/pricing') {
      return location.pathname === '/pricing';
    }
    return location.pathname === '/dashboard';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden safe-area-bottom" data-testid="mobile-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Link
              key={item.label}
              to={item.tab ? `${item.path}?tab=${item.tab}` : item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors ${
                active 
                  ? 'text-pink-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-pink-600' : ''}`} />
              <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for iOS */}
      <style jsx="true">{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </nav>
  );
};

export default MobileNav;
