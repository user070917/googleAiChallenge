'use client';

import React from 'react';
import Header from '@/components/Header';
import { Mail, MessageCircle, HelpCircle, Coffee, Heart, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
      <Header title="고객지원 (Support)" />
      
      <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-teal-500" />
            무엇을 도와드릴까요?
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">
            서비스 이용 중 궁금하신 점이나 문제가 발생했다면 아래 방법으로 문의해 주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* FAQ / 1:1 문의 */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6">
              <MessageCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">실시간 채팅 상담</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              평일 오전 10시 ~ 오후 6시까지 실시간으로 답변해 드립니다.
            </p>
            <button className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-xl transition-colors">
              상담 시작하기
            </button>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">이메일 문의</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              상세한 내용이 필요하시다면 이메일로 보내주세요. 24시간 내로 답변해 드립니다.
            </p>
            <a href="mailto:support@readme.app" className="block w-full py-3.5 px-4 bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 font-bold rounded-xl transition-colors text-center">
              support@readme.app
            </a>
          </div>
        </div>

        {/* Coffee Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-700/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 dark:opacity-5 pointer-events-none">
            <Coffee className="w-64 h-64 text-amber-900 dark:text-amber-500" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 flex-shrink-0 rounded-full bg-white dark:bg-black/40 shadow-lg flex items-center justify-center border-4 border-amber-100 dark:border-amber-900/50">
              <Coffee className="w-10 h-10 text-amber-600 dark:text-amber-500" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-black text-amber-900 dark:text-amber-400 mb-3 flex items-center justify-center md:justify-start gap-2">
                이 개발자들에게 커피를 사주시고 싶으시다면? <Heart className="w-6 h-6 text-rose-500 animate-pulse fill-rose-500" />
              </h2>
              <p className="text-amber-800/80 dark:text-amber-200/70 font-medium mb-6 max-w-xl leading-relaxed">
                README 프로젝트는 Team TLE가 밤을 새워가며 정성껏 만들었습니다. 
                저희의 서비스가 마음에 드셨거나 업무에 도움이 되셨다면, 맛있는 커피 한 잔 어떠신가요? 
                보내주신 후원은 더 나은 서비스를 만드는 데 큰 힘이 됩니다!
              </p>
              
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:-translate-y-0.5">
                <Coffee className="w-5 h-5" />
                커피 후원하기 (Buy me a coffee)
                <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
