'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Loader2, 
  Database,
  Eye,
  Copy,
  Check,
  Download,
  X,
  ArrowRight,
  ExternalLink,
  Trash2,
  Filter,
  Clock,
  Briefcase,
  Building2,
  RotateCcw
} from 'lucide-react';
import Header from '@/components/Header';
import { getCards, getDocuments, deleteCard, Card, Document } from '@/lib/db';

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Filtering states
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const handleClearAll = async () => {
    if (cards.length === 0 && documents.length === 0) {
      alert('삭제할 데이터가 없습니다.');
      return;
    }

    if (!window.confirm('대시보드의 모든 분석 카드와 업로드된 진짜 파일 원본들을 전부 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 복구가 불가능합니다.')) {
      return;
    }

    setIsClearing(true);
    try {
      // 서버 사이드 API를 통해 service_role key로 RLS 우회 삭제
      const res = await fetch('/api/clear', { method: 'DELETE' });
      const result = await res.json();

      if (!res.ok) {
        console.error('서버 삭제 오류:', result.error);
        alert('삭제 중 오류가 발생했습니다: ' + (result.error || '알 수 없는 오류'));
        return;
      }

      // 로컬 UI 상태 초기화
      setCards([]);
      setDocuments([]);
    } catch (err) {
      console.error('Error during clear all:', err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const fetchedCards = await getCards();
      const fetchedDocs = await getDocuments();
      setCards(fetchedCards);
      setDocuments(fetchedDocs);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
        <Header title="대시보드 (Dashboard)" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin" />
        </div>
      </main>
    );
  }

  // Derived Statistics (No classification grouping, focused on data source types)
  const totalCards = cards.length;
  
  // Dialog/Conversation source types
  const conversationCount = cards.filter(c => c.source_type === 'email' || c.source_type === 'slack').length;
  
  // File/Document attachment source types
  const docAttachmentCount = cards.filter(c => c.source_type === 'pdf' || c.source_type === 'docx' || c.source_type === 'txt').length;

  // Extract unique projects and clients for the dropdowns
  const uniqueProjects = Array.from(new Set(cards.map(c => c.project).filter(Boolean)));
  const uniqueClients = Array.from(new Set(cards.map(c => c.client).filter(Boolean)));

  // Source type counts
  const getSourceCount = (type: string) => {
    if (type === 'all') return cards.length;
    return cards.filter(c => c.source_type === type).length;
  };

  const filteredCards = cards.filter(c => {
    if (selectedSource !== 'all' && c.source_type !== selectedSource) return false;
    if (selectedProject !== 'all' && c.project !== selectedProject) return false;
    if (selectedClient !== 'all' && c.client !== selectedClient) return false;
    return true;
  });

  const timelineCards = [...filteredCards].sort((a, b) => {
    const dateA = new Date(a.event_date).getTime();
    const dateB = new Date(b.event_date).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const getSourceIcon = (type: string) => {
    switch(type) {
      case 'email': 
        return (
          <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            <Mail className="w-3 h-3" /> EMAIL
          </span>
        );
      case 'slack': 
        return (
          <span className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            <MessageSquare className="w-3 h-3" /> SLACK
          </span>
        );
      case 'pdf': 
        return (
          <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            <FileText className="w-3 h-3" /> PDF
          </span>
        );
      case 'docx': 
        return (
          <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            <FileText className="w-3 h-3" /> DOCX
          </span>
        );
      default: 
        return (
          <span className="flex items-center gap-1 bg-slate-200 dark:bg-slate-500/20 border border-slate-300 dark:border-slate-500/30 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            <FileText className="w-3 h-3" /> TXT
          </span>
        );
    }
  };

  const handleCopy = () => {
    if (!selectedDoc) return;
    navigator.clipboard.writeText(selectedDoc.raw_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    const element = document.createElement("a");
    const file = new Blob([selectedDoc.raw_content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = selectedDoc.file_name.endsWith('.txt') 
      ? selectedDoc.file_name 
      : `${selectedDoc.file_name.split('.')[0]}_원본_추출텍스트.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDelete = async (cardId: string, docId?: string, fileName?: string) => {
    const confirmMsg = fileName
      ? `"${fileName}" 문서와 분석 카드를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      : '이 분석 카드를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.';
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(cardId);
    try {
      // Delete from DB
      const dbOk = await deleteCard(cardId, docId);
      if (!dbOk) {
        alert('삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
        return;
      }

      // Delete physical file from server disk if we have a doc
      if (docId && fileName) {
        await fetch(`/api/files/${encodeURIComponent(`${docId}_${fileName}`)}`, {
          method: 'DELETE',
        });
      }

      // Update local UI state
      setCards(prev => prev.filter(c => c.id !== cardId));
      if (docId) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-colors duration-500">
      <Header title="대시보드 (Dashboard)" />
      
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 relative">
        
        {/* Top Control Bar with Clear All button */}
        <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 px-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm transition-colors">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">데이터 저장소 관리</span>
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isClearing ? '모든 파일 지우는 중...' : '모든 파일 지우기'}</span>
          </button>
        </div>
        
        {/* Metric Cards - Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center gap-5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] transition-colors flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[clamp(0.75rem,1.1vw,0.875rem)] text-slate-500 dark:text-slate-400 font-medium">분석 완료 문서</p>
              <h3 className="text-[clamp(1.25rem,2.5vw,1.875rem)] font-black text-slate-800 dark:text-white transition-colors">{totalCards} 건</h3>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center gap-5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-colors flex-shrink-0">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[clamp(0.75rem,1.1vw,0.875rem)] text-slate-500 dark:text-slate-400 font-medium">이메일 & 슬랙 기록</p>
              <h3 className="text-[clamp(1.25rem,2.5vw,1.875rem)] font-black text-slate-800 dark:text-white transition-colors">{conversationCount} 건</h3>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center gap-5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-colors flex-shrink-0">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[clamp(0.75rem,1.1vw,0.875rem)] text-slate-500 dark:text-slate-400 font-medium">문서 및 첨부파일</p>
              <h3 className="text-[clamp(1.25rem,2.5vw,1.875rem)] font-black text-slate-800 dark:text-white transition-colors">{docAttachmentCount} 건</h3>
            </div>
          </div>
        </div>

        {/* Content Area - Glassmorphism */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col min-h-[400px] sm:min-h-[600px] transition-colors">
          <div className="px-6 py-5 border-b border-slate-200/50 dark:border-white/10 bg-slate-100/50 dark:bg-black/10 transition-colors flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              인수인계 요약 및 분석 기록
            </h2>
            {totalCards > 0 && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-white/5">
                총 {totalCards}건 중 {filteredCards.length}건 표시됨
              </span>
            )}
          </div>

          {/* Filters Control Panel */}
          {totalCards > 0 && (
            <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 transition-colors space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Source Type Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> 구분:
                  </span>
                  
                  {[
                    { id: 'all', label: '전체', icon: <Database className="w-3.5 h-3.5" /> },
                    { id: 'email', label: '이메일', icon: <Mail className="w-3.5 h-3.5" /> },
                    { id: 'slack', label: '슬랙', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                    { id: 'pdf', label: 'PDF', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'docx', label: 'DOCX', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'txt', label: 'TXT', icon: <FileText className="w-3.5 h-3.5" /> },
                  ].map(type => {
                    const count = getSourceCount(type.id);
                    const isActive = selectedSource === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedSource(type.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-teal-500 text-white border-teal-500 shadow-[0_2px_10px_rgba(20,184,166,0.3)] dark:shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                            : 'bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200/50 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        {type.icon}
                        <span>{type.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-2 self-end lg:self-auto">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 정렬:
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/50 dark:border-white/10 shadow-inner">
                    <button
                      onClick={() => setSortOrder('newest')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sortOrder === 'newest'
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      최신순
                    </button>
                    <button
                      onClick={() => setSortOrder('oldest')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sortOrder === 'oldest'
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      과거순
                    </button>
                  </div>
                </div>
              </div>

              {/* Project & Client filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Project Filter */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-teal-500" /> 프로젝트
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 bg-white/60 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  >
                    <option value="all">전체 프로젝트 ({uniqueProjects.length}개)</option>
                    {uniqueProjects.map(proj => (
                      <option key={proj} value={proj}>{proj}</option>
                    ))}
                  </select>
                </div>

                {/* Client Filter */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" /> 거래처 (클라이언트)
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-3 py-2 bg-white/60 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  >
                    <option value="all">전체 거래처 ({uniqueClients.length}개)</option>
                    {uniqueClients.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Button */}
                {(selectedSource !== 'all' || selectedProject !== 'all' || selectedClient !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedSource('all');
                      setSelectedProject('all');
                      setSelectedClient('all');
                    }}
                    className="sm:self-end flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer h-[38px] w-full sm:w-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>필터 초기화</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-4 sm:p-8 flex-1 bg-white/40 dark:bg-black/10 transition-colors">
            {totalCards === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-20">
                <Database className="w-16 h-16 mb-4 opacity-20" />
                <p>아직 분석된 인수인계 데이터가 없습니다.</p>
                <a href="/uploads" className="mt-4 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline text-sm font-semibold transition-colors">새로운 파일 업로드하기</a>
              </div>
            ) : timelineCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-20">
                <Database className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium text-slate-600 dark:text-slate-400">일치하는 분석 기록이 없습니다.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">필터 조건을 완화해 보거나 아래 버튼을 눌러 필터를 초기화해 보세요.</p>
                <button
                  onClick={() => {
                    setSelectedSource('all');
                    setSelectedProject('all');
                    setSelectedClient('all');
                  }}
                  className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white dark:text-teal-950 font-bold rounded-xl text-xs shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>필터 초기화</span>
                </button>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-white/10 space-y-8 sm:space-y-12 ml-2 sm:ml-6 py-4 transition-colors">
                {timelineCards.map((c) => {
                  const matchedDoc = documents.find(d => d.id === c.doc_id);
                  const fileName = matchedDoc ? matchedDoc.file_name : `${c.project} (${c.client})`;
                  
                  return (
                    <div key={c.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute left-0 -translate-x-1/2 top-2 sm:top-1 w-5 h-5 bg-white dark:bg-slate-900 border-4 border-teal-500 dark:border-teal-400 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.3)] dark:shadow-[0_0_12px_rgba(45,212,191,0.8)] transition-colors"></div>
                      
                      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 p-4 sm:p-6 rounded-2xl shadow-sm dark:shadow-lg hover:bg-white dark:hover:bg-white/10 transition-all">
                        
                        {/* Header metadata row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="font-mono font-bold text-[10px] sm:text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 sm:px-2 sm:py-1 rounded-md border border-teal-100 dark:border-teal-500/20 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {c.event_date}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base md:text-lg select-all">
                              {fileName}
                            </span>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {getSourceIcon(c.source_type)}
                          </div>
                        </div>

                        {/* Summary details */}
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-black/20 p-4 sm:p-5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors">
                          {c.summary.split('\n').map((line, idx) => (
                            <p key={idx} className="mb-1 last:mb-0 leading-relaxed font-medium">{line}</p>
                          ))}
                        </div>

                        {/* View original, Open real file, and Delete buttons */}
                        <div className="mt-4 flex flex-wrap justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => matchedDoc && setSelectedDoc(matchedDoc)}
                              disabled={!matchedDoc}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                matchedDoc
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 shadow-sm cursor-pointer'
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                              }`}
                              title={matchedDoc ? "파싱된 원본 텍스트 미리보기" : "연결된 원본 파일이 존재하지 않습니다."}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>텍스트 미리보기</span>
                            </button>

                            <button
                              onClick={() => {
                                if (matchedDoc) {
                                  window.open(`/api/files/${matchedDoc.id}_${matchedDoc.file_name}`, '_blank');
                                }
                              }}
                              disabled={!matchedDoc}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                matchedDoc
                                  ? 'bg-teal-500 hover:bg-teal-400 text-white dark:text-slate-950 border-teal-500 hover:border-teal-400 shadow-sm cursor-pointer'
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                              }`}
                              title={matchedDoc ? "진짜 파일 원본 열기 및 다운로드" : "연결된 원본 파일이 존재하지 않습니다."}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>진짜 파일 열기</span>
                            </button>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(c.id, c.doc_id, matchedDoc?.file_name)}
                            disabled={deletingId === c.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="이 카드와 문서를 삭제합니다"
                          >
                            {deletingId === c.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                            <span>{deletingId === c.id ? '삭제 중...' : '삭제'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Glassmorphic Original File Content Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/85 dark:border-white/15 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex-shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate select-all">{selectedDoc.file_name}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">추출된 원본 텍스트 데이터</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-black/30 font-mono text-xs sm:text-sm whitespace-pre-wrap select-text leading-relaxed text-slate-700 dark:text-slate-300 scrollbar-thin">
              {selectedDoc.raw_content ? (
                selectedDoc.raw_content
              ) : (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>본문 내용이 비어있거나 올바르게 파싱되지 않았습니다.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white dark:text-teal-950 text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  {copied ? <Check className="w-4 h-4 animate-scale" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '복사 완료' : '전체 복사'}</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>다운로드 (.txt)</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
