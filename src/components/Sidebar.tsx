'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  UploadCloud, 
  LayoutDashboard, 
  History, 
  Settings, 
  HelpCircle, 
  Brain,
  Plus,
  X
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();

  const menuItems = [
    { name: '홈 (Home)', href: '/', icon: Home },
    { name: '업로드 (Uploads)', href: '/uploads', icon: UploadCloud },
    { name: '대시보드 (Dashboard)', href: '/dashboard', icon: LayoutDashboard },
    { name: '이력 조회 (History)', href: '/history', icon: History },
    { name: '설정 (Settings)', href: '/settings', icon: Settings },
    { name: '고객지원 (Support)', href: '/support', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed inset-y-0 left-0 w-64 z-50 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 flex flex-col bg-white/95 dark:bg-slate-900/95 lg:bg-white/60 lg:dark:bg-slate-900/40 backdrop-blur-2xl text-slate-800 dark:text-slate-200 border-r border-slate-200/50 dark:border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${className}`}>
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between gap-3 border-b border-slate-200/50 dark:border-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center transition-all">
              <img src="/logo.png" alt="README Logo" className="w-9 h-9 object-contain dark:brightness-0 dark:invert" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">README</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Knowledge Restorer</p>
            </div>
          </div>

          {/* Close button for Mobile Sidebar */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="메뉴 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <div className="px-4 py-6">
          <Link 
            href="/uploads"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-teal-50 dark:text-teal-950 font-bold rounded-xl shadow-[0_4px_15px_rgba(20,184,166,0.3)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.5)] transition-all duration-300 transform active:scale-95 backdrop-blur-md border border-teal-400/50"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>새 인수인계 업로드</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-white/80 dark:bg-white/10 text-teal-700 dark:text-teal-300 font-bold border border-slate-200/50 dark:border-white/5 shadow-sm dark:shadow-inner' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 dark:bg-teal-400 shadow-[0_0_10px_#2dd4bf]"></div>
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-teal-600 dark:text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.3)] dark:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 'text-slate-400 dark:group-hover:text-slate-300'
                }`} />
                <span className="z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>



        {/* Footer Info */}
        <div className="p-3 text-center opacity-60">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">v2.0 • Team TLE</p>
        </div>
      </aside>
    </>
  );
}
