'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Sun,
  Moon,
  Menu,
  LogIn,
  LogOut,
  User,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { useTheme } from '@/components/ThemeProvider';
import { useSidebar } from '@/components/SidebarContext';
import { useUploads } from '@/components/UploadContext';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toggle } = useSidebar();

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  const { notifications, clearNotification, clearAllNotifications, markAsRead } = useUploads();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-500">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Toggle Button for Mobile Sidebar */}
        <button
          onClick={toggle}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors flex-shrink-0"
          title="메뉴 열기"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h2 className="text-[clamp(0.95rem,2vw,1.25rem)] font-bold text-slate-800 dark:text-slate-100 transition-colors truncate max-w-[120px] xs:max-w-xs sm:max-w-none">{title}</h2>
        

      </div>

      <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
        {/* Search Bar (Glassmorphic) */}
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors" />
          <input 
            type="text" 
            placeholder="인수인계 내용 검색..." 
            className="w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 rounded-full text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:bg-white/80 dark:focus:bg-white/10 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Toggle */}
          {mounted && (
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 sm:p-2.5 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 transition-all shadow-sm dark:shadow-none"
              title="테마 변경"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 sm:p-2.5 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 transition-all relative group shadow-sm dark:shadow-none"
              title="알림 확인"
            >
              <Bell className="w-5 h-5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-300 transform origin-top-right">
                <div className="p-4 border-b border-slate-200/50 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">알림 ({unreadCount}건 미확인)</span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors"
                    >
                      모두 지우기
                    </button>
                  )}
                </div>
                
                <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-200/50 dark:divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">
                      새로운 알림이 없습니다.
                    </div>
                  ) : (
                    notifications.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          markAsRead(item.id);
                          setShowNotifications(false);
                          router.push('/dashboard');
                        }}
                        className={`p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group/item ${!item.read ? 'bg-teal-500/5 dark:bg-teal-500/5' : ''}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {item.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${!item.read ? 'font-semibold text-slate-900 dark:text-white' : ''}`}>
                            {item.message}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">
                            {item.timestamp}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors flex-shrink-0"
                          title="지우기"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-slate-300 dark:bg-white/10 mx-1"></div>
          
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 pr-2 sm:pr-3.5 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 transition-all shadow-sm dark:shadow-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hidden sm:inline">{user.name || 'Admin'}</span>
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1 hidden sm:block"></div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-center"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 p-1.5 pr-3 sm:pr-4 rounded-full bg-white/50 dark:bg-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all group shadow-sm dark:shadow-none"
              title="로그인"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-md flex-shrink-0 border border-slate-200 dark:border-white/5 group-hover:bg-teal-100 dark:group-hover:bg-teal-500/20 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-all">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold transition-colors hidden sm:inline">로그인</span>
              <LogIn className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
