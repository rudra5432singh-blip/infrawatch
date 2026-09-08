import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Layers, 
  AlertTriangle, 
  BarChart3, 
  Bot, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Menu, 
  X,
  MapPin,
  TrendingUp
} from 'lucide-react';
import HexLogo from './HexLogo';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/map', label: 'Surveillance Map', icon: MapPin },
    { to: '/projects', label: 'Projects Registry', icon: Layers },
    { to: '/alerts', label: 'Risk Surveillance', icon: AlertTriangle, badge: 'EWAS' },
    { to: '/benchmarks', label: 'Benchmarking & Analytics', icon: BarChart3 },
    { to: '/drivers', label: 'Cost Drivers & What-If', icon: TrendingUp },
    { to: '/assistant', label: 'Intelligence Core', icon: Bot, isAi: true }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9F5] text-[#1B1C1A]">
      {/* MOBILE BACKDROP OVERLAY WITH GLASS BLUR */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#1B1C1A]/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* DESKTOP & MOBILE SIDEBAR (FROSTED GLASS DOCK) */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-[rgba(61,58,52,0.08)] bg-[#FAF9F5]/85 backdrop-blur-xl transition-all duration-300 shadow-[0_12px_32px_rgba(61,58,52,0.06)] md:shadow-none ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Top Sovereign Branding */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-[rgba(61,58,52,0.08)]">
            <div className="flex items-center gap-3">
              <HexLogo size={32} />
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-serif font-bold tracking-tight text-lg sm:text-xl text-[#1B1C1A] flex items-center gap-1.5">
                    INFRAWATCH <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#655E4E] font-mono font-bold border border-[rgba(61,58,52,0.1)]">v2.0</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#8D8574] tracking-widest uppercase font-semibold">
                    National Intelligence
                  </span>
                </div>
              )}
            </div>
            {/* Close button on mobile drawer */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-full text-[#655E4E] hover:bg-[#EFECE6] md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1E1E1E] text-[#FAF9F5] font-semibold shadow-[0_4px_16px_rgba(30,30,30,0.18)]'
                      : 'text-[#655E4E] hover:text-[#1B1C1A] hover:bg-[rgba(239,236,230,0.7)] border border-transparent'
                  }`}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <Icon size={18} className={isActive ? 'text-[#D97706]' : 'text-[#8D8574]'} />
                  {(!collapsed || mobileOpen) && (
                    <span className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                          isActive 
                            ? 'bg-[#FAF9F5]/20 text-[#FAF9F5] border-white/20' 
                            : 'bg-[rgba(194,94,62,0.12)] text-[#C25E3E] border-[rgba(194,94,62,0.25)]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.isAi && (
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                          isActive 
                            ? 'bg-[#FAF9F5]/20 text-[#FAF9F5] border-white/20' 
                            : 'bg-[rgba(217,119,6,0.12)] text-[#D97706] border-[rgba(217,119,6,0.25)]'
                        }`}>
                          AI CORE
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status & Collapse Toggle */}
        <div className="p-3 border-t border-[rgba(61,58,52,0.08)] space-y-2 bg-[#FAF9F5]/70">
          {(!collapsed || mobileOpen) && (
            <div className="p-3 rounded-2xl glass-card text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-[#655E4E]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Activity size={12} className="text-[#4A5D4E]" />
                  Predictive ML Engine
                </span>
                <span className="font-mono text-[#2D3A30] font-bold bg-[rgba(74,93,78,0.12)] border border-[rgba(74,93,78,0.22)] px-2 py-0.5 rounded-full text-[10px]">
                  ACTIVE
                </span>
              </div>
              <div className="text-[10px] text-[#8D8574] font-mono">
                XGBoost + SHAP + Groq LLM
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center p-2 rounded-full text-[#8D8574] hover:text-[#1B1C1A] hover:bg-[#EFECE6] transition-colors text-xs"
          >
            {collapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 font-medium"><ChevronLeft size={16} /> <span>Collapse Dock</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden architectural-canvas min-w-0">
        {/* Top Frosted Intelligence Header */}
        <header className="h-14 sm:h-16 border-b border-[rgba(61,58,52,0.08)] bg-[#FAF9F5]/85 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-20 shadow-[0_4px_20px_-4px_rgba(61,58,52,0.03)] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-full text-[#1B1C1A] hover:bg-[#EFECE6] md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#D97706]"></span>
            </span>
            
            <span className="font-serif font-semibold text-xs sm:text-base text-[#1B1C1A] tracking-tight truncate">
              National Infrastructure Surveillance
            </span>
            
            <span className="hidden lg:inline-block text-[11px] font-mono text-[#D97706] bg-[rgba(217,119,6,0.1)] border border-[rgba(217,119,6,0.22)] px-2.5 py-0.5 rounded-full font-semibold shrink-0">
              1,775 Assets Synced
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[#3D3A34] bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.12)] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium shadow-2xs">
              <Clock size={13} className="text-[#D97706]" />
              <span>{timeStr || 'LIVE'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#655E4E] font-medium">
              <ShieldCheck size={15} className="text-[#4A5D4E]" />
              <span className="hidden xl:inline">MoSPI Protocol CUF-Compliant</span>
            </div>
          </div>
        </header>

        {/* Animated Scrollable Page Body */}
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
