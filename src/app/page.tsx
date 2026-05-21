'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  UploadCloud, 
  LayoutDashboard, 
  Zap, 
  Brain,
  Server,
  FileText
} from 'lucide-react';
import Header from '@/components/Header';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
      <Header title="홈 (Home)" />
      
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center my-6 sm:my-0">
          
          {/* Text Content */}
          <div className="space-y-6 sm:space-y-8 relative z-10">

            
            <h1 className="text-[clamp(1.85rem,5.2vw,4.5rem)] font-black text-slate-900 dark:text-white leading-tight drop-shadow-sm dark:drop-shadow-lg tracking-tight transition-colors">
              퇴사자의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 dark:from-teal-400 dark:to-blue-500">기억</span>을 <br/> 완벽하게 복원하다
            </h1>
            
            <p className="text-[clamp(0.9rem,1.2vw,1.125rem)] text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-white/60 dark:bg-black/20 p-4 sm:p-5 rounded-2xl border border-slate-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-inner transition-colors">
              과거 이메일, 슬랙 대화록, PDF, DOCX 파일 등 산재된 
              업무 기록을 업로드하세요. <strong className="text-teal-600 dark:text-teal-300">GPT-4o AI 모델</strong>이 문맥을 분석하여 
              프로젝트와 거래처별로 인수인계 대시보드를 자동 생성합니다.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 sm:pt-4">
              <Link 
                href="/uploads"
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-teal-500 hover:bg-teal-400 text-white dark:text-teal-950 font-black rounded-2xl transition-all shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_4px_30px_rgba(20,184,166,0.4)] transform hover:-translate-y-1 backdrop-blur-md border border-teal-400/50 text-center"
              >
                <UploadCloud className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
                <span>지금 바로 업로드하기</span>
              </Link>
              
              <Link 
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white font-bold rounded-2xl transition-all backdrop-blur-xl shadow-lg hover:-translate-y-1 text-center"
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <span>대시보드 둘러보기</span>
              </Link>
            </div>
          </div>

          {/* Visual Simulation Graphic - Glassmorphism */}
          <div className="relative h-[380px] sm:h-[500px] w-full rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-2xl flex items-center justify-center transition-colors">
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5"></div>
            
            {/* Node System */}
            <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between">
              
              <div className="flex justify-between items-center w-full px-2 sm:px-10 mt-2 sm:mt-0">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/50 dark:bg-black/40 border border-slate-200/50 dark:border-white/10 flex items-center justify-center shadow-sm dark:shadow-inner relative z-10 backdrop-blur-md transition-colors flex-shrink-0">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 dark:text-slate-300" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Raw Data</span>
                </div>

                <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-300 dark:from-slate-500/30 via-teal-500/50 to-teal-500 relative transition-colors">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf] animate-ping"></div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-teal-100/50 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.2)] dark:shadow-[0_0_30px_rgba(45,212,191,0.2)] relative z-10 backdrop-blur-lg transition-colors flex-shrink-0">
                    <Brain className="w-7 h-7 sm:w-10 sm:h-10 text-teal-600 dark:text-teal-300 animate-pulse" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-teal-600 dark:text-teal-400">GPT Engine</span>
                </div>

                <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500 via-blue-400/50 dark:via-blue-500/50 to-blue-300 dark:to-blue-500/30 relative transition-colors">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-100/50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)] relative z-10 backdrop-blur-md transition-colors flex-shrink-0">
                    <Server className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">Supabase</span>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-black/30 border border-slate-200/50 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-inner backdrop-blur-md transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
                  <h3 className="font-bold text-[clamp(0.85rem,1.1vw,1.05rem)] text-slate-800 dark:text-white">Live Extraction Log</h3>
                </div>
                <div className="space-y-2 sm:space-y-3 font-mono text-[clamp(0.6rem,0.85vw,0.75rem)]">
                  <div className="flex gap-2 sm:gap-4">
                    <span className="text-slate-400 dark:text-slate-500">14:02:11</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">[SUCCESS]</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate">Parsed email_backup.mbox</span>
                  </div>
                  <div className="flex gap-2 sm:gap-4">
                    <span className="text-slate-400 dark:text-slate-500">14:02:15</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">[AI_WORK]</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate">Extracting context from slack_history.json</span>
                  </div>
                  <div className="flex gap-2 sm:gap-4">
                    <span className="text-slate-400 dark:text-slate-500">14:02:18</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold flex-shrink-0">[DB_SYNC]</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate">Saved 3 new cards for Project 'Next.js Migration'</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
