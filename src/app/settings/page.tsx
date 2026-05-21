'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { RefreshCw, Database, Lock, ShieldCheck, Mail, Link2, RotateCw, Unlink } from 'lucide-react';
import { 
  resetDatabase, 
  isLiveMode, 
  getEmailConnections, 
  EmailConnection, 
  addEmailConnection, 
  removeEmailConnection, 
  getDocuments, 
  addDocument, 
  addCard 
} from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useUploads } from '@/components/UploadContext';

export default function SettingsPage() {
  const router = useRouter();
  const { addNotification } = useUploads();
  const [liveMode, setLiveMode] = useState(false);
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  const fetchConnections = async () => {
    try {
      const data = await getEmailConnections();
      setConnections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  useEffect(() => {
    setLiveMode(isLiveMode());
    
    // Check if redirecting back from OAuth callback
    const searchParams = new URLSearchParams(window.location.search);
    const linked = searchParams.get('linked');
    const provider = searchParams.get('provider') as 'gmail' | 'outlook' | null;
    const email = searchParams.get('email');
    const refresh_token = searchParams.get('refresh_token');
    
    if (linked === 'success' && provider && email) {
      const handleLinkedCallback = async () => {
        await addEmailConnection(provider, email, refresh_token || undefined);
        addNotification(`Google Gmail 계정이 성공적으로 연동되었습니다 (${email}).`, 'success');
        // Clear query parameters from URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        await fetchConnections();
      };
      handleLinkedCallback();
    } else {
      fetchConnections();
    }
  }, []);

  const handleReset = async () => {
    if (confirm('모든 데이터를 초기화하고 기본 샘플 데이터로 복구하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) {
      await resetDatabase();
      alert('데이터베이스가 초기화되었습니다.');
      router.refresh();
    }
  };

  const handleGmailLink = () => {
    router.push('/api/auth/email/gmail');
  };

  const handleGmailDisconnect = async () => {
    if (!confirm('Gmail 연동을 해제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/email/disconnect?provider=gmail', { method: 'POST' });
      if (res.ok) {
        await removeEmailConnection('gmail');
        addNotification('Google Gmail 계정 연동이 해제되었습니다.', 'success');
        alert('연동이 성공적으로 해제되었습니다.');
        fetchConnections();
      } else {
        alert('연동 해제에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    }
  };

  const handleGmailSync = async () => {
    setIsSyncing(true);
    try {
      const currentGmail = connections.find(c => c.provider === 'gmail');
      const res = await fetch('/api/email/sync?provider=gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: currentGmail?.refresh_token || null
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        if (result.live) {
          if (result.count > 0) {
            addNotification(`이메일 동기화 완료: 새로운 인수인계 메일 ${result.count}건을 수집하고 요약 카드를 생성했습니다.`, 'success');
            alert(`동기화 완료!\n새로운 인수인계 이메일 ${result.count}건이 추가되었습니다.`);
          } else {
            alert('이미 최신 메일이 모두 동기화되었습니다.');
          }
          router.refresh();
          fetchConnections();
        } else {
          // Local Simulation Mode (Client-side ingestion)
          const existingDocs = await getDocuments();
          const syncedDocs = existingDocs.map(d => d.file_name);
          const newEmails = (result.emails || []).filter((email: any) => !syncedDocs.includes(email.file_name));
          
          if (newEmails.length === 0) {
            alert('이미 최신 메일이 모두 동기화되었습니다.');
          } else {
            let addedCount = 0;
            for (const email of newEmails) {
              const doc = await addDocument(email.file_name, 'email', email.raw_content, email.doc_id);
              await addCard({
                project: email.project,
                client: email.client,
                event_date: email.event_date,
                summary: email.summary,
                source_type: 'email',
                doc_id: doc.id
              });
              addedCount++;
            }
            
            // Update last_synced_at timestamp by re-inserting the connection info
            if (currentGmail) {
              await addEmailConnection('gmail', currentGmail.email_address, currentGmail.refresh_token);
            }

            addNotification(`이메일 동기화 완료: 새로운 인수인계 메일 ${addedCount}건을 수집하고 요약 카드를 생성했습니다.`, 'success');
            alert(`동기화 완료!\n새로운 인수인계 이메일 ${addedCount}건이 추가되었습니다.`);
          }
          
          router.refresh();
          fetchConnections();
        }
      } else {
        alert(result.error || '동기화 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('동기화 실패: 네트워크 오류');
    } finally {
      setIsSyncing(false);
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

        {/* Email Integration Card - Glassmorphism */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden transition-colors">
          <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-200/50 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 transition-colors">
            <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 animate-pulse" />
              이메일 자동 연동 관리 (Google Gmail / MS Outlook)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              사용자의 이메일 API와 안전하게 연동하여 인수인계 관련 업무 보고, 피드백, 인계서 전달 메일을 실시간으로 가져옵니다.
            </p>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            {isLoadingConnections ? (
              <div className="py-6 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Gmail Sync Card */}
                {connections.some(c => c.provider === 'gmail') ? (
                  connections.filter(c => c.provider === 'gmail').map(conn => (
                    <div key={conn.provider} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/80 dark:bg-black/25 rounded-2xl border border-teal-200/80 dark:border-teal-500/20 shadow-sm transition-all hover:bg-white dark:hover:bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center border border-teal-200 dark:border-teal-500/30 flex-shrink-0">
                          <Mail className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">Google Gmail 연동 완료</span>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-500/10 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              동기화 활성화
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-all">{conn.email_address}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">마지막 동기화: {conn.last_synced_at || '기록 없음'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                        <button
                          onClick={handleGmailSync}
                          disabled={isSyncing}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white dark:text-teal-950 text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                          <span>{isSyncing ? '동기화 중...' : '지금 동기화'}</span>
                        </button>
                        <button
                          onClick={handleGmailDisconnect}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200/20 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>연동 해제</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/80 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <Mail className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Google Gmail 연동</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">인수/인계 메일을 실시간 수집 및 분석할 수 있습니다.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGmailLink}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/25 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer w-full md:w-auto"
                    >
                      <Link2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Google 계정 연동</span>
                    </button>
                  </div>
                )}

                {/* Outlook Sync Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-100/30 dark:bg-black/10 rounded-2xl border border-slate-200/30 dark:border-white/5 opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/10 dark:border-slate-700/50 flex-shrink-0">
                      <Mail className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Microsoft Outlook 연동</p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Enterprise Outlook 이메일 계정을 연동합니다. (준비 중)</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/20 text-slate-400 dark:text-slate-600 text-xs font-bold rounded-xl cursor-not-allowed w-full md:w-auto"
                  >
                    <span>지원 예정</span>
                  </button>
                </div>
              </div>
            )}
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
