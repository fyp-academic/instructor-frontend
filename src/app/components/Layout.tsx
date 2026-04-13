import React, { ReactNode } from 'react';
import { Header } from './Header';
import { useApp } from '../context/AppContext';
import { Edit3 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { editMode } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {editMode && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-amber-50 border-b border-amber-300 px-4 py-1.5 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-800 font-medium">Edit mode is active — You can add, edit, and rearrange course content</span>
        </div>
      )}
      <main className={`max-w-screen-2xl mx-auto px-4 py-6 ${editMode ? 'mt-[6.5rem]' : 'mt-14'}`}>
        {children}
      </main>
    </div>
  );
}
