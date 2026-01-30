import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, BarChart2, Crown, Wallet, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Only show on user pages when authenticated
  if (!isAuthenticated) return null;

  // Don't show on admin pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/backman')) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard', tab: 'overview' },
    { icon: BarChart2, label: 'Stats', path: '/dashboard', tab: 'analytics' },
    { icon: Crown, label: 'Plans', path: '/pricing', tab: null, highlight: true },
    { icon: Wallet, label: 'Billing', path: '/dashboard', tab: 'billing' },
    { icon: User, label: 'Profile', path: '/dashboard', tab: 'settings' },
  ];

  const isActive = (item) => {
    if (item.path === '/pricing') {
      return location.pathname === '/pricing';
    }
    if (item.tab) {
      const params = new URLSearchParams(location.search);
      const currentTab = params.get('tab') || 'overview';
      return location.pathname === '/dashboard' && currentTab === item.tab;
    }
    return location.pathname === '/dashboard' && !location.search;
  };

  return (
    <>
      {/* Spacer to prevent content from hiding behind nav */}
      <div className="h-24 lg:hidden" />
      
      {/* Modern Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <nav 
          className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/20"
          data-testid="mobile-nav"
        >
          {/* Gradient accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 rounded-full" />
          
          <div className="flex items-center justify-around py-2 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              
              return (
                <Link
                  key={item.label}
                  to={item.tab ? `${item.path}?tab=${item.tab}` : item.path}
                  className="relative flex flex-col items-center justify-center py-2 px-4 group"
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  {/* Active background pill */}
                  {active && (
                    <div className="absolute inset-1 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl -z-10" />
                  )}
                  
                  {/* Highlight ring for special items */}
                  {item.highlight && !active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 rounded-full opacity-10 blur-lg" />
                  )}
                  
                  {/* Icon container */}
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                    active 
                      ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 shadow-lg shadow-pink-500/30 scale-110' 
                      : item.highlight 
                        ? 'bg-gradient-to-br from-orange-100 to-pink-100 group-hover:from-orange-200 group-hover:to-pink-200'
                        : 'bg-transparent group-hover:bg-gray-100'
                  }`}>
                    <Icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        active 
                          ? 'text-white' 
                          : item.highlight
                            ? 'text-pink-500'
                            : 'text-gray-500 group-hover:text-gray-700'
                      }`} 
                      strokeWidth={active ? 2.5 : 2}
                    />
                    
                    {/* Active dot indicator */}
                    {active && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-sm" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                    active 
                      ? 'text-pink-600' 
                      : item.highlight
                        ? 'text-pink-500'
                        : 'text-gray-500 group-hover:text-gray-700'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileNav;
