'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Lock, Mail, User, ArrowRight, Loader2, Database } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      setSuccessMessage('가입이 성공적으로 완료되었습니다! 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      
      <div className="w-full max-w-md bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 my-8 transition-colors">
        
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-5 flex items-center justify-center transition-all">
            <img src="/logo.png" alt="README Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain dark:brightness-0 dark:invert" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm transition-colors">새 계정 만들기</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-3 text-center font-medium leading-relaxed bg-white/80 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors">
            README 플랫폼에 오신 것을 환영합니다.<br/>
            <span className="text-teal-600 dark:text-teal-400/90 text-[10px] sm:text-[11px] font-bold">Scrypt + Salt + Pepper</span> 강력 암호화 적용
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm rounded-xl font-bold backdrop-blur-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl font-bold backdrop-blur-md">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 transition-colors">이름</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 dark:focus:ring-teal-400/30 focus:border-teal-500 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-black/40 transition-all font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-inner"
                placeholder="홍길동"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 transition-colors">이메일 주소</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 dark:focus:ring-teal-400/30 focus:border-teal-500 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-black/40 transition-all font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-inner"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 transition-colors">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 dark:focus:ring-teal-400/30 focus:border-teal-500 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-black/40 transition-all font-medium font-mono text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-inner"
                placeholder="최소 6자리 이상"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!successMessage}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-black rounded-xl shadow-[0_4px_15px_rgba(15,23,42,0.2)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:active:scale-100 disabled:hover:translate-y-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>안전하게 회원가입</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 py-3 rounded-lg border border-slate-200/50 dark:border-white/5 transition-colors">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors">
            로그인하기
          </Link>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mb-4 text-center text-slate-600 dark:text-slate-500 flex items-center gap-2 text-sm z-10 bg-white/60 dark:bg-black/20 px-4 py-2 rounded-full border border-slate-200/50 dark:border-white/5 backdrop-blur-md transition-colors">
        <Database className="w-4 h-4 text-teal-600 dark:text-teal-500/70" />
        <span className="font-medium">가입 정보를 저장하려면 Supabase 연결이 필수입니다.</span>
      </div>
    </div>
  );
}
