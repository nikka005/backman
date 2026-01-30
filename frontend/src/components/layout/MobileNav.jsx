import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, BarChart2, Crown, Wallet, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Only show on user pages when authenticated
  if (!isAuthenticated) return null;

  // Don't show on admin pages or login/signup
  if (location.pathname.startsWith('/admin') || 
      location.pathname.startsWith('/backman') ||
      location.pathname === '/login' ||
      location.pathname === '/signup') {
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

  const handleNavClick = (item) => {
    if (item.tab) {
      navigate(`${item.path}?tab=${item.tab}`);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Spacer to prevent content from hiding behind nav */}
      <div className="h-24 lg:hidden" />
      
      {/* Modern Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-3 pb-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <nav 
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/15 border border-gray-200/50"
          data-testid="mobile-nav"
        >
          {/* Gradient accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 rounded-full" />
          
          <div className="flex items-center justify-around py-2 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className="relative flex flex-col items-center justify-center py-1.5 px-3 group"
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  {/* Active background pill */}
                  {active && (
                    <div className="absolute inset-0.5 bg-gradient-to-br from-pink-100 to-orange-100 rounded-xl -z-10" />
                  )}
                  
                  {/* Icon container */}
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 shadow-lg shadow-pink-500/30' 
                      : item.highlight 
                        ? 'bg-gradient-to-br from-orange-100 to-pink-100'
                        : 'bg-gray-100'
                  }`}>
                    <Icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        active 
                          ? 'text-white' 
                          : item.highlight
                            ? 'text-pink-500'
                            : 'text-gray-600'
                      }`} 
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[10px] mt-1 font-medium transition-all duration-200 ${
                    active 
                      ? 'text-pink-600' 
                      : item.highlight
                        ? 'text-pink-500'
                        : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileNav;
