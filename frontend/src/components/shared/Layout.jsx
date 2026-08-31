import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  X 
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
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: Layers },
    { to: '/alerts', label: 'Risk Alerts', icon: AlertTriangle, badge: '127' },
    { to: '/benchmarks', label: 'Benchmarks', icon: BarChart3 },
    { to: '/assistant', label: 'AI Assistant', icon: Bot, isAi: true }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* DESKTOP & MOBILE SIDEBAR */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-[#E2E8F0] bg-[#FFFFFF] transition-all duration-300 shadow-lg md:shadow-none ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Top Branding */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <HexLogo size={32} />
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#0F172A] flex items-center gap-1.5">
                    INFRAWATCH <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-100">v2.0</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#64748B] tracking-wider uppercase font-semibold">
                    AI Risk Intelligence
                  </span>
                </div>
              )}
            </div>
            {/* Close button on mobile drawer */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent'
                  }`}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <Icon size={19} className={isActive ? 'text-indigo-600' : 'text-[#64748B]'} />
                  {(!collapsed || mobileOpen) && (
                    <span className="flex-1 flex items-center justify-between">
                      {item.label}
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded">
                          {item.badge}
                        </span>
                      )}
                      {item.isAi && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
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
        <div className="p-3 border-t border-[#E2E8F0] space-y-2 bg-[#F8FAFC]/60">
          {(!collapsed || mobileOpen) && (
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[11px] space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#475569]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Activity size={12} className="text-emerald-600" />
                  Predictive ML Engine
                </span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  ACTIVE
                </span>
              </div>
              <div className="text-[10px] text-[#64748B] font-mono">
                XGBoost + SHAP + Groq
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors text-xs"
          >
            {collapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 font-medium"><ChevronLeft size={16} /> <span>Collapse Sidebar</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden grid-bg min-w-0">
        {/* Top Intelligence Header */}
        <header className="h-14 sm:h-16 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20 shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
            </span>
            
            <span className="font-bold text-xs sm:text-sm text-[#0F172A] tracking-tight truncate">
              National Infrastructure Surveillance
            </span>
            
            <span className="hidden lg:inline-block text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-medium shrink-0">
              1,775 Assets Synced
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium">
              <Clock size={13} className="text-indigo-600" />
              <span>{timeStr || 'LIVE'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span className="hidden xl:inline">MoSPI Protocol CUF-Compliant</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
