import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, BookOpen, Video, BarChart2, ShieldAlert,
  GraduationCap, Settings, Bell, ChevronLeft, ChevronRight, X, Sparkles, Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}

/**
 * Primary navigation as a collapsible left rail. Dark indigo for a clear,
 * professional hierarchy against the light top header. Collapses to an icon
 * rail on desktop and slides in as a drawer on mobile. Carries the data-tour
 * anchors the onboarding spotlight points at.
 */
export function Sidebar({ collapsed, mobileOpen, onMobileClose, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navLinks = isAdmin
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
        { to: '/administration', label: 'Administration', icon: Settings, tourId: 'nav-administration' },
        { to: '/logs', label: 'Logs', icon: Bell, tourId: 'nav-logs' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
        { to: '/courses', label: 'My Courses', icon: BookOpen, tourId: 'nav-courses' },
        { to: '/sessions', label: 'Live Sessions', icon: Video, tourId: 'nav-sessions' },
        { to: '/calendar', label: 'Calendar', icon: Calendar, tourId: 'nav-calendar' },
        { to: '/engagement', label: 'Engagement', icon: BarChart2, tourId: 'nav-engagement' },
        { to: '/ai-insights', label: 'AI Insights', icon: Sparkles, tourId: 'nav-ai-insights' },
        { to: '/proctoring', label: 'Proctoring', icon: ShieldAlert, tourId: 'nav-proctoring' },
        { to: '/administration', label: 'Programme Management', icon: GraduationCap, tourId: 'nav-administration' },
      ];

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/' || location.pathname.startsWith('/dashboard')
      : location.pathname.startsWith(path);

  const go = (to: string) => { navigate(to); onMobileClose(); };

  // `lg:hidden` on labels: hide them only on desktop when collapsed — the mobile
  // drawer always renders full width, so labels stay visible there.
  const hideOnCollapse = collapsed ? 'lg:hidden' : '';

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={onMobileClose} aria-hidden />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-indigo-900 text-white shadow-xl
          transition-[width,transform] duration-300 ease-in-out w-64
          ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-2 px-3 border-b border-indigo-800/60 flex-shrink-0">
          <button onClick={() => go('/dashboard')} className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-950/40">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg font-bold tracking-wide whitespace-nowrap ${hideOnCollapse}`}>APES LMS</span>
          </button>
          <button onClick={onMobileClose} className="lg:hidden p-1.5 rounded-md text-indigo-200 hover:bg-indigo-800" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navLinks.map(link => {
            const active = isActive(link.to);
            return (
              <button
                key={link.to}
                data-tour={link.tourId}
                onClick={() => go(link.to)}
                title={collapsed ? link.label : undefined}
                className={`group relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${collapsed ? 'lg:justify-center' : ''}
                  ${active ? 'bg-white/15 text-white' : 'text-indigo-200 hover:bg-indigo-800/70 hover:text-white'}`}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-indigo-300" />}
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`whitespace-nowrap ${hideOnCollapse}`}>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block border-t border-indigo-800/60 p-2 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-indigo-200 hover:bg-indigo-800/70 hover:text-white ${collapsed ? 'justify-center' : ''}`}
          >
            {collapsed
              ? <ChevronRight className="w-5 h-5" />
              : <><ChevronLeft className="w-5 h-5" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
