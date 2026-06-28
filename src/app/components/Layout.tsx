import React, { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useApp } from '../context/AppContext';
import { Edit3 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { editMode } = useApp();
  // Collapsed state persists across navigations (Layout re-mounts per route).
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () =>
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('sidebar_collapsed', next ? '1' : '0');
      return next;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      <div className={`flex flex-col min-h-screen transition-[padding] duration-300 ${collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'}`}>
        <Header onMenuClick={() => setMobileOpen(true)} />

        {editMode && (
          <div className="bg-amber-50 border-b border-amber-300 px-4 py-1.5 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800 font-medium">Edit mode is active — You can add, edit, and rearrange course content</span>
          </div>
        )}

        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
