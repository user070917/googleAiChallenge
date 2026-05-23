'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  File as FileIcon, 
  FileText, 
  FileJson, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Plus,
  Brain,
  LayoutDashboard,
  RotateCw,
  Trash2
} from 'lucide-react';
import Header from '@/components/Header';
import { useUploads } from '@/components/UploadContext';

export default function UploadsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const authData = await res.json();
        if (!authData.authenticated || !authData.user) {
          router.push('/login');
          return;
        }
        setCurrentUser(authData.user);
      } catch (err) {
        console.error('Session verification failed on uploads page:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const { 
    uploads, 
    isProcessing, 
    addFiles, 
    removeFile, 
    startUploads,
    retryUpload,
    retryAllFailed
  } = useUploads();

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'mbox') return <Mail className="w-5 h-5 text-amber-500 dark:text-amber-400 drop-shadow-md" />;
    if (ext === 'json') return <FileJson className="w-5 h-5 text-emerald-500 dark:text-emerald-400 drop-shadow-md" />;
    if (ext === 'pdf') return <FileIcon className="w-5 h-5 text-rose-500 dark:text-rose-400 drop-shadow-md" />;
    if (ext === 'docx') return <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400 drop-shadow-md" />;
    return <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400 drop-shadow-md" />;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addMockFiles = () => {
    const mockFiles = [
      new File(["mock content for marketing email backup"], "마케팅_팀_이메일_백업.mbox", { type: "text/plain" }),
      new File(["mock content for slack export"], "개발팀_슬랙_기록.json", { type: "application/json" }),
      new File(["mock content for security patch pdf"], "알파고_보안_패치_가이드.pdf", { type: "application/pdf" }),
    ];
    addFiles(mockFiles);
  };

  const hasCompleted = uploads.some(u => u.status === 'completed');
  const hasFailed = uploads.some(u => u.status === 'error');
  const isFinished = uploads.length > 0 && !isProcessing && !uploads.some(u => u.status === 'queued' || u.status === 'analyzing');

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
        <Header title="업로드 (Upload Queue)" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
      <Header title="업로드 (Upload Queue)" />
      
      <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 relative">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md transition-colors">인수인계 소스 파일 업로드</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">이메일(.mbox), 슬랙(.json), PDF, Word(.docx), 텍스트(.txt) 형식 지원</p>
          </div>
          <button
            onClick={addMockFiles}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200/50 dark:border-white/20 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 backdrop-blur-md shadow-sm dark:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>임시 샘플 파일 추가</span>
          </button>
        </div>

        {/* Dropzone - Glassmorphism */}
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center transition-all cursor-pointer backdrop-blur-xl shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden group ${
            isProcessing 
              ? 'border-slate-300 dark:border-white/10 bg-slate-100/50 dark:bg-black/10 opacity-60' 
              : 'border-teal-400/50 dark:border-teal-400/50 bg-teal-50/50 dark:bg-teal-500/5 hover:bg-teal-100/50 dark:hover:bg-teal-500/10 hover:border-teal-500 dark:hover:border-teal-400/80 hover:shadow-[0_0_20px_rgba(45,212,191,0.1)] dark:hover:shadow-[0_0_30px_rgba(45,212,191,0.15)]'
          }`}
        >
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/0 via-teal-500/0 to-teal-500/10 dark:to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            accept=".mbox,.json,.pdf,.docx,.txt"
          />
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm dark:shadow-inner border border-slate-200/50 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500 dark:text-teal-400 drop-shadow-[0_0_5px_rgba(20,184,166,0.3)] dark:drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 drop-shadow-sm transition-colors">여기에 파일을 놓거나 브라우저에서 선택하세요</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">최대 파일 크기: 50MB</p>
        </div>

        {/* Uploads List - Glassmorphism */}
        {uploads.length > 0 && (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden transition-colors">
            <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200/50 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base transition-colors">
                <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 shadow-[0_0_8px_#14b8a6] dark:shadow-[0_0_8px_#2dd4bf] animate-pulse"></span>
                업로드 대기열 ({uploads.length}건)
              </h3>
              {uploads.some(u => u.status === 'queued') && (
                <button
                  onClick={startUploads}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white dark:text-teal-950 font-bold rounded-xl text-sm shadow-[0_4px_15px_rgba(20,184,166,0.2)] dark:shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.3)] dark:hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  <span>{isProcessing ? 'AI 분석 중...' : '분석 실행하기'}</span>
                </button>
              )}
            </div>
            
            <div className="divide-y divide-slate-200/50 dark:divide-white/5 transition-colors">
              {uploads.map(item => (
                <div key={item.id} className="p-4 sm:p-5 sm:px-8 hover:bg-white/80 dark:hover:bg-white/5 transition-colors flex items-center gap-3 sm:gap-5">
                  <div className="flex-shrink-0 bg-white dark:bg-black/40 p-2 sm:p-3 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm dark:shadow-inner">
                    {getFileIcon(item.file.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-4 transition-colors">{item.file.name}</p>
                      <span className="text-[10px] sm:text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-black/30 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5 transition-colors flex-shrink-0">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-black/50 rounded-full overflow-hidden shadow-inner border border-slate-300/50 dark:border-white/5 transition-colors w-full">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                            item.status === 'completed' ? 'bg-emerald-500 dark:bg-emerald-400' : 
                            item.status === 'error' ? 'bg-rose-500 dark:bg-rose-400' : 'bg-teal-500 dark:bg-teal-400'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        >
                          {/* Inner glow for progress bar */}
                          <div className="absolute inset-0 bg-white/30 rounded-full"></div>
                        </div>
                      </div>
                      <span className={`text-[10px] sm:text-xs font-bold w-24 sm:w-32 truncate flex-shrink-0 ${
                        item.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 
                        item.status === 'error' ? 'text-rose-600 dark:text-rose-400' : 
                        item.status === 'analyzing' ? 'text-teal-600 dark:text-teal-400 animate-pulse drop-shadow-[0_0_3px_rgba(20,184,166,0.3)] dark:drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]' : 'text-slate-500'
                      }`}>
                        {item.message}
                      </span>
                    </div>
                  </div>

                  {!isProcessing && item.status === 'error' && (
                    <button 
                      onClick={() => retryUpload(item.id)}
                      className="p-2.5 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-500/10 rounded-xl transition-all border border-transparent hover:border-teal-200 dark:hover:border-teal-500/20 flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm"
                      title="재시도"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="hidden sm:inline">재시도</span>
                    </button>
                  )}

                  {!isProcessing && item.status !== 'completed' && (
                    <button 
                      onClick={() => removeFile(item.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                      title="제거"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  
                  {item.status === 'completed' && (
                    <div className="p-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion & Error Actions */}
        {isFinished && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {hasFailed && (
              <button
                onClick={retryAllFailed}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold rounded-2xl shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <RotateCw className="w-5 h-5" />
                <span>실패한 파일 모두 재시도</span>
              </button>
            )}

            {hasCompleted && (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm sm:text-base font-black rounded-2xl shadow-[0_8px_20px_rgba(15,23,42,0.3)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-transform transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>대시보드로 이동하기</span>
              </button>
            )}
          </div>
        )}

      </div>
    </main>
  );
}