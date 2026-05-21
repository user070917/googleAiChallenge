'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { RefreshCw, Database, Lock, ShieldCheck } from 'lucide-react';
import { resetDatabase, isLiveMode } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    setLiveMode(isLiveMode());
  }, []);

  const handleReset = async () => {
    if (confirm('모든 데이터를 초기화하고 기본 샘플 데이터로 복구하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) {
      await resetDatabase();
      alert('데이터베이스가 초기화되었습니다.');
      router.refresh();
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
      <Header title="환경 설정 (Settings)" />
      
      <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 relative">
        
        {/* Security Info Card - Glassmorphism */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-emerald-200 dark:border-emerald-500/20 rounded-3xl shadow-sm dark:shadow-[0_8px_32px_rgba(10,185,129,0.1)] overflow-hidden transition-colors">
          <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 transition-colors">
            <h2 className="text-base sm:text-xl font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 drop-shadow-sm">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              서버 환경변수 보안 모드 활성화됨
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-2 leading-relaxed">
              모든 API 키(Supabase, OpenAI)는 이제 프론트엔드가 아닌 서버의 <code className="bg-emerald-200/50 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-xs">.env.local</code> 파일을 통해 안전하게 보호되고 있습니다.<br/>
              브라우저 상에서 키를 수정하거나 열람할 수 없습니다.
            </p>
          </div>

          <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/80 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">데이터베이스 연결 상태</p>
                <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 leading-snug">
                  {liveMode ? (
                    <><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span> 라이브 Supabase 모드로 동작 중입니다.</>
                  ) : (
                    <><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></span> 로컬 시뮬레이션 모드로 동작 중입니다 (.env에 키 설정 필요).</>
                  )}
                </p>
              </div>
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0" />
            </div>

            <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/80 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">API 환경 변수 설정</p>
                <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  설정을 변경하려면 프로젝트 루트 디렉토리의 <code className="font-mono text-teal-600 dark:text-teal-400 text-[10px] sm:text-xs">.env.local</code> 파일을 열어 직접 편집한 후 서버를 재시작하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone - Glassmorphism */}
        <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 backdrop-blur-xl rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-sm dark:shadow-[0_8px_32px_rgba(225,29,72,0.1)] transition-colors">
          <div className="space-y-1">
            <h3 className="text-rose-600 dark:text-rose-400 font-bold text-base sm:text-lg drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">데이터베이스 초기화</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              업로드된 모든 인수인계 데이터를 삭제하고 4개의 초기 샘플 데이터로 롤백합니다.
            </p>
          </div>
          <button 
            onClick={handleReset}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-200 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-sm font-bold rounded-xl transition-all shadow-sm dark:shadow-lg hover:shadow-[0_4px_15px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>기본 데이터로 리셋</span>
          </button>
        </div>

      </div>
    </main>
  );
}
