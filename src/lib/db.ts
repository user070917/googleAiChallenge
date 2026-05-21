'use client';

import { createClient } from '@supabase/supabase-js';

// Get environment variables properly (no local storage fallback)
export const getEnv = (key: string): string => {
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  }
  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }
  return '';
};

export const isLiveMode = (): boolean => {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// Types
// ==========================================
export interface Document {
  id: string;
  created_at: string;
  file_name: string;
  source_type: 'email' | 'slack' | 'docx' | 'pdf' | 'txt';
  raw_content: string;
}

export interface Card {
  id: string;
  created_at: string;
  project: string;
  client: string;
  event_date: string;
  summary: string;
  source_type: string;
  doc_id?: string;
}

// ==========================================
// Local Storage Mock (Fallback if .env is missing)
// ==========================================
const MOCK_STORAGE_KEY = 'mock_caremonitor_data';

const getMockData = (): { documents: Document[]; cards: Card[] } => {
  if (typeof window === 'undefined') return { documents: [], cards: [] };
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }

  // Default Initial Data
  const defaultData = {
    documents: [
      {
        id: 'doc-1',
        created_at: new Date().toISOString(),
        file_name: '영업_이메일_백업.mbox',
        source_type: 'email' as const,
        raw_content: 'From: manager@solutionsinc.com\nTo: team@solutionsinc.com\nSubject: 2분기 영업 타겟 및 계약 갱신 현황\nDate: Sun, 10 May 2026 14:22:00 +0900\n\n안녕하세요. 영업팀입니다.\n\n2분기 영업 타겟 거래처 리스트 분석이 완료되었습니다. 주요 조율 사항은 아래와 같습니다.\n- 솔루션즈아이엔씨 유지보수 계약 갱신 조건 최종 조율 진행\n- 하반기 신규 매출 15% 성장을 위한 파트너십 구축 계획 수립 완료\n\n세부 내용은 첨부파일을 확인해 주세요.'
      },
      {
        id: 'doc-2',
        created_at: new Date().toISOString(),
        file_name: '개발팀_슬랙_기록.json',
        source_type: 'slack' as const,
        raw_content: '[User: dev_lead, Time: 2026-05-15 10:30:15] 스마트팩토리 IoT 센서 데이터 수집 서버 구축 완료 및 통신 테스트에 성공했습니다.\n[User: designer, Time: 2026-05-15 11:15:22] 대시보드 화면 1차 피드백 반영하여 UI 편의성 대폭 개선했습니다.\n[User: pm, Time: 2026-05-15 14:00:00] 좋습니다. 6월 초 공장 시험 가동을 위해 5월 25일까지 사전 점검 완료해 주세요.'
      },
      {
        id: 'doc-3',
        created_at: new Date().toISOString(),
        file_name: '보안_패치_가이드.pdf',
        source_type: 'pdf' as const,
        raw_content: '[보안 패치 및 가이드라인 문서]\n\n1. 방화벽 패치 버전 2.0 배포가 완료되었으며 주요 보안 취약점 사전 패치가 적용되었습니다.\n2. 거래처 요청 사항인 실시간 차단 모니터링 모듈이 추가 구현되었습니다.\n3. 다음주 월요일부터 실운영 환경 배포 및 배포 이후 24시간 동안 이상 여부 모니터링을 진행할 예정입니다.'
      },
      {
        id: 'doc-4',
        created_at: new Date().toISOString(),
        file_name: '마이그레이션_기획서.docx',
        source_type: 'docx' as const,
        raw_content: '개발 과제: 프론트엔드 Next.js 마이그레이션 기획 및 완료 보고서\n\n- 전체 마이그레이션 공정이 성공적으로 완료되었습니다.\n- Lighthouse 성능 지표 측정 결과, 기존 렌더링 성능 대비 약 40%가 향상된 것을 검증하였습니다.\n- 최종 코드베이스에 대한 거래처(테크네트웍스) 최종 소스코드 검수 및 피드백을 대기 중입니다.'
      }
    ],
    cards: [
      {
        id: '1',
        created_at: new Date().toISOString(),
        project: '영업전략 수립',
        client: '솔루션즈아이엔씨',
        event_date: '2026-05-10',
        summary: '• 2분기 영업 타겟 거래처 리스트 및 분석 자료 정리 완료\n• 솔루션즈아이엔씨 유지보수 계약 갱신 조건 최종 조율\n• 하반기 매출 15% 성장을 위한 신규 파트너십 구축 계획 수립',
        source_type: 'email',
        doc_id: 'doc-1'
      },
      {
        id: '2',
        created_at: new Date().toISOString(),
        project: '스마트팩토리 구축',
        client: '한양제조',
        event_date: '2026-05-15',
        summary: '• 설비 IoT 센서 데이터 수집 서버 구축 및 통신 테스트 성공\n• 대시보드 화면 1차 피드백 반영 및 UI 편의성 개선 완료\n• 6월 초 공장 시험 가동을 위한 사전 점검 진행 중 (5/25 완료 예정)',
        source_type: 'slack',
        doc_id: 'doc-2'
      },
      {
        id: '3',
        created_at: new Date().toISOString(),
        project: '알파고 보안 솔루션',
        client: '보안시스템즈',
        event_date: '2026-05-02',
        summary: '• 방화벽 패치 버전 2.0 배포 및 보안 취약점 사전 패치 완료\n• 거래처 요구사항으로 실시간 차단 모니터링 모듈 추가 구현\n• 다음주 월요일부터 실운영 환경 배포 및 이상 여부 대기 관찰',
        source_type: 'pdf',
        doc_id: 'doc-3'
      },
      {
        id: '4',
        created_at: new Date().toISOString(),
        project: 'Next.js 마이그레이션',
        client: '테크네트웍스',
        event_date: '2026-04-12',
        summary: '• 프론트엔드 프레임워크 Next.js로 마이그레이션 전체 공정 완료\n• Lighthouse 렌더링 성능 지표 기존 대비 40% 향상 검증\n• 거래처(테크네트웍스) 최종 소스코드 검수 및 피드백 대기 중',
        source_type: 'docx',
        doc_id: 'doc-4'
      }
    ]
  };

  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

const saveMockData = (data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  }
};

// ==========================================
// API Methods
// ==========================================
export async function getDocuments(): Promise<Document[]> {
  if (supabase) {
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching documents:', error);
    return data || [];
  }
  return getMockData().documents;
}

export async function getCards(): Promise<Card[]> {
  if (supabase) {
    const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching cards:', error);
    return data || [];
  }
  return getMockData().cards;
}

export async function addDocument(file_name: string, source_type: Document['source_type'], raw_content: string, id?: string): Promise<Document> {
  const newDoc = {
    file_name,
    source_type,
    raw_content
  };

  if (supabase) {
    const { data, error } = await supabase.from('documents').insert([newDoc]).select().single();
    if (error) {
      console.error('Error inserting doc:', error);
      throw error;
    }
    return data;
  }

  // Mock
  const mockData = getMockData();
  const doc = { ...newDoc, id: id || Math.random().toString(36).substring(7), created_at: new Date().toISOString() };
  mockData.documents.push(doc);
  saveMockData(mockData);
  return doc as Document;
}

export async function addCard(cardData: Omit<Card, 'id' | 'created_at'>): Promise<Card> {
  if (supabase) {
    const { data, error } = await supabase.from('cards').insert([cardData]).select().single();
    if (error) {
      console.error('Error inserting card:', error);
      throw error;
    }
    return data;
  }

  // Mock
  const mockData = getMockData();
  const card = { ...cardData, id: Math.random().toString(36).substring(7), created_at: new Date().toISOString() };
  mockData.cards.push(card);
  saveMockData(mockData);
  return card as Card;
}

export async function resetDatabase() {
  if (supabase) {
    await supabase.from('cards').delete().not('id', 'is', null);
    await supabase.from('documents').delete().not('id', 'is', null);

    // Add default initial records to Supabase
    const defaultData = getMockData().cards.map(({ id, created_at, ...rest }) => rest);
    await supabase.from('cards').insert(defaultData);

    return true;
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    getMockData();
  }
  return true;
}

export async function clearDatabase(): Promise<boolean> {
  if (supabase) {
    try {
      const { error: cardError } = await supabase.from('cards').delete().not('id', 'is', null);
      if (cardError) console.error('Error clearing cards:', cardError);

      const { error: docError } = await supabase.from('documents').delete().not('id', 'is', null);
      if (docError) console.error('Error clearing documents:', docError);

      return !cardError && !docError;
    } catch (err) {
      console.error('Exception during clearDatabase:', err);
      return false;
    }
  }

  if (typeof window !== 'undefined') {
    const emptyData = { documents: [], cards: [] };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(emptyData));
  }
  return true;
}

export async function deleteCard(cardId: string, docId?: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error: cardError } = await supabase.from('cards').delete().eq('id', cardId);
      if (cardError) {
        console.error('Error deleting card:', cardError);
        return false;
      }
      
      if (docId) {
        const { error: docError } = await supabase.from('documents').delete().eq('id', docId);
        if (docError) {
          console.error('Error deleting document:', docError);
        }
      }
      return true;
    } catch (err) {
      console.error('Exception during deleteCard database query:', err);
      return false;
    }
  }

  // Mock Mode fallback
  try {
    const mockData = getMockData();
    mockData.cards = mockData.cards.filter(c => c.id !== cardId);
    if (docId) {
      mockData.documents = mockData.documents.filter(d => d.id !== docId);
    }
    saveMockData(mockData);
    return true;
  } catch (err) {
    console.error('Error deleting mock card:', err);
    return false;
  }
}

// ==========================================
// Email Connection Methods for OAuth
// ==========================================
export interface EmailConnection {
  provider: 'gmail' | 'outlook';
  email_address: string;
  refresh_token?: string;
  created_at: string;
  last_synced_at?: string;
}

export async function getEmailConnections(): Promise<EmailConnection[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('email_connections').select('*');
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase email_connections table may not exist, falling back to mock storage.');
    }
  }
  
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('mock_email_connections');
    return data ? JSON.parse(data) : [];
  }
  return [];
}

export async function addEmailConnection(provider: 'gmail' | 'outlook', email_address: string, refresh_token?: string): Promise<boolean> {
  const newConnection: EmailConnection = {
    provider,
    email_address,
    refresh_token,
    created_at: new Date().toISOString(),
    last_synced_at: '방금 전'
  };

  if (supabase) {
    try {
      // First clean up any existing connection for this provider
      await supabase.from('email_connections').delete().eq('provider', provider);
      const { error } = await supabase.from('email_connections').insert([newConnection]);
      if (!error) return true;
    } catch (err) {
      console.error('Failed to insert email connection into Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('mock_email_connections');
    const list: EmailConnection[] = data ? JSON.parse(data) : [];
    const filtered = list.filter(c => c.provider !== provider);
    filtered.push(newConnection);
    localStorage.setItem('mock_email_connections', JSON.stringify(filtered));
    return true;
  }
  return false;
}

export async function removeEmailConnection(provider: 'gmail' | 'outlook'): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('email_connections').delete().eq('provider', provider);
      if (!error) return true;
    } catch (err) {
      console.error('Failed to delete email connection from Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('mock_email_connections');
    if (data) {
      const list: EmailConnection[] = JSON.parse(data);
      const filtered = list.filter(c => c.provider !== provider);
      localStorage.setItem('mock_email_connections', JSON.stringify(filtered));
      return true;
    }
  }
  return false;
}

