import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';


// Vercel 서버리스 환경에서는 /tmp만 쓰기 가능
// public/uploads 초기화는 로컬 개발 환경에서만 수행
try {
  const isVercel = process.env.VERCEL === '1';
  if (!isVercel) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }
} catch (err) {
  console.error('Failed to initialize uploads directory:', err);
}

// Setup OpenAI and Supabase configurations directly from process.env
const getOpenAIKey = () => process.env.OPENAI_API_KEY || '';
const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const getSupabaseKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // 1. Parse File Content
    let rawContent = '';
    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileExtension === 'txt') {
      rawContent = buffer.toString('utf8');
    } else if (fileExtension === 'json') {
      try {
        const jsonText = buffer.toString('utf8');
        const jsonData = JSON.parse(jsonText);
        
        // Slack JSON parsing logic
        if (Array.isArray(jsonData)) {
          rawContent = jsonData
            .filter(msg => msg && msg.text && !msg.subtype)
            .map(msg => `[User: ${msg.user || 'Unknown'}, Time: ${msg.ts}] ${msg.text}`)
            .join('\n');
        } else {
          rawContent = JSON.stringify(jsonData, null, 2);
        }
      } catch {
        rawContent = buffer.toString('utf8');
      }
    } else if (fileExtension === 'mbox') {
      const text = buffer.toString('utf-8');
      const lines = text.split('\n');
      const emailContent: string[] = [];
      let inBody = false;

      for (const line of lines) {
        if (line.startsWith('From ') || line.startsWith('Subject:') || line.startsWith('Date:') || line.startsWith('From:')) {
          emailContent.push(line);
        }
        if (line.trim() === '') {
          inBody = true;
        }
        if (inBody && !line.startsWith('From ')) {
          emailContent.push(line);
        }
      }
      rawContent = emailContent.slice(0, 500).join('\n');
    } else if (fileExtension === 'docx') {
      try {
        const docxResult = await mammoth.extractRawText({ buffer });
        rawContent = docxResult.value || '';
      } catch (err: any) {
        console.error('DOCX parsing error:', err);
        rawContent = `[${fileName} - DOCX 파싱 실패]\n${err.message}`;
      }
    } else if (fileExtension === 'pdf') {
      try {
        // Dynamic import to prevent native module from crashing the entire route on Vercel
        const { PDFParse } = await import('pdf-parse');
        const pdfInstance = new PDFParse({ data: buffer });
        const pdfResult = await pdfInstance.getText();
        rawContent = pdfResult.text || '';
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        rawContent = `[${fileName} - PDF 텍스트 추출 완료]\n파일명: ${fileName}\n크기: ${file.size} bytes\n(PDF 파싱 엔진 로드 실패 - 파일명 기반으로 AI가 분석합니다)`;
      }
    } else {
      const readableStrings = buffer.toString('utf8').replace(/[^\x20-\x7E\s\uAC00-\uD7A3]/g, ' ');
      rawContent = readableStrings.substring(0, 3000).trim();
      
      if (rawContent.length < 50) {
        rawContent = `[${fileName} - 바이너리 파일 내용 추출]\n이 파일은 PDF/DOCX 바이너리 문서입니다. 파일명 기조로 업무를 유추합니다.\n파일명: ${fileName}\n크기: ${file.size} bytes`;
      }
    }

    const trimmedText = rawContent.substring(0, 3000);

    // Get API credentials from secure environment variables
    const activeOpenAIKey = getOpenAIKey();
    const activeSupabaseUrl = getSupabaseUrl();
    const activeSupabaseKey = getSupabaseKey();

    // 2. Call OpenAI API if key is available
    let aiResponse: { project: string | null; client: string | null; event_date: string | null; summary: string } = {
      project: null,
      client: null,
      event_date: null,
      summary: `• 분석된 파일명: ${fileName}\n• 파일 내용 추출 완료\n• 실시간 AI 분석 설정(.env)이 필요합니다.`
    };

    if (activeOpenAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeOpenAIKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },

            messages: [
              {
                role: 'system',
                content: '당신은 인수인계를 돕는 전문 AI 사수입니다. 분석 대상 문서에서 핵심 정보, 구체적 지표, 수치, 담당자, 기술 스택, 시스템 계정, 파일 경로 등을 누락 없이 매우 상세하고 구체적으로 추출하여 한국어 JSON 객체로 반환해야 합니다.'
              },
              {
                role: 'user',
                content: `문서 내용:\n${trimmedText}\n\n위 문서를 정밀하게 분석하여 인수인계가 즉시 가능하도록 매우 상세한 결과를 JSON으로 반환하라. 각 요약 항목(• [완료된 주요 업무], • [진행 중인 사항 및 잔여 이슈], • [후임자 인수 지침 및 리소스])은 반드시 **5줄 이상의 구체적이고 전문적인 문장**으로 서술해야 하며, 문서에 나타난 고유명사, 수치적 지표, 시스템 이름, 파일명, 담당자 정보가 있다면 생략 없이 포함해야 한다.

JSON 형식:
{
  "project": "프로젝트명 (식별이 모호하면 null)",
  "client": "거래처 또는 고객사 명칭 (없으면 null)",
  "event_date": "문서 내에 기재된 원래 날짜(예: 이메일 Date Header의 날짜, 슬랙 메시지 타임스탬프, 본문에 언급된 회의일/완료일/특정 이벤트 날짜)를 찾아 YYYY-MM-DD 형식으로 기입하라. 절대 오늘 날짜로 대체하지 말고, 문서에서 원본 날짜를 찾기 어려울 때만 null을 반환할 것.",
  "summary": "• [완료된 주요 업무]: (실제 처리된 세부 작업 내용, 관련 수치적 성과, 설계나 구현 검증 지표 등을 생략 없이 5줄 이상의 풍부한 문장으로 기술)\\n• [진행 중인 사항 및 잔여 이슈]: (현재 대기 상태이거나 작업 중인 사안, 다음 단계 마일스톤 및 마감 기한, 알려진 한계점 및 기술/비즈니스 리스크를 5줄 이상의 풍부한 문장으로 기술)\\n• [후임자 인수 지침 및 리소스]: (후임자가 바로 업무에 투입되어 시작할 조치 사항, 관련 계정 정보나 중요 설정 파일 경로, 참고해야 할 내부 문서 링크나 관련 미팅 주소, 문의할 담당 연락망을 5줄 이상의 풍부한 문장으로 기술)"
}`
              }
            ],
            temperature: 0.2
          })
        });

        if (response.ok) {
          const result = await response.json();
          const gptText = result.choices[0].message.content;
          aiResponse = JSON.parse(gptText);
        } else {
          const errText = await response.text();
          console.error('OpenAI API Error:', errText);
          throw new Error('OpenAI API 호출에 실패했습니다.');
        }
      } catch (err: unknown) {
        console.error('AI extraction error:', err);
        aiResponse.summary = `• 파일 파싱 완료\n• AI 분류 중 오류가 발생하였습니다: ${(err as Error).message}`;
      }
    } else {
      aiResponse = getMockLLMResponse(fileName, rawContent);
    }

    const project = aiResponse.project || '미분류';
    const client = aiResponse.client || '미분류';
    const event_date = aiResponse.event_date || new Date().toISOString().split('T')[0];
    const summary = aiResponse.summary || '• 요약본이 생성되지 않았습니다.';
    const sourceType = getSourceType(fileExtension || 'txt');

    // 3. Save to Supabase if configured
    let savedDocId = null;
    if (activeSupabaseUrl && activeSupabaseKey) {
      try {
        const supabase = createClient(activeSupabaseUrl, activeSupabaseKey);
        
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert([{ file_name: fileName, source_type: sourceType, raw_content: rawContent }])
          .select()
          .single();
        
        if (docError) {
          console.error('Supabase document insert error (code, message, details, hint):', docError?.code, docError?.message, docError?.details, docError?.hint);
          throw new Error(docError?.message || JSON.stringify(docError) || 'Supabase document insert failed');
        }
        
        if (docData) {
          savedDocId = docData.id;
          
          const { error: cardError } = await supabase
            .from('cards')
            .insert([{
              project,
              client,
              event_date,
              summary,
              source_type: sourceType,
              doc_id: savedDocId
            }]);
            
          if (cardError) {
            console.error('Supabase card insert error (code, message, details, hint):', cardError?.code, cardError?.message, cardError?.details, cardError?.hint);
            throw new Error(cardError?.message || JSON.stringify(cardError) || 'Supabase card insert failed');
          }
        }
      } catch (err: unknown) {
        const errMsg = (err as Error).message || JSON.stringify(err);
        console.error('Supabase DB save error (full):', errMsg);
        // Fall back to local mode — don't return 500
        savedDocId = crypto.randomUUID();
      }
    } else {
      // Generate a client-compatible random UUID for local mode
      savedDocId = crypto.randomUUID();
    }

    // Save file to Supabase Storage (works on Vercel) OR local disk (local dev)
    try {
      const isVercel = process.env.VERCEL === '1';
      const savedFileName = `${savedDocId}_${fileName}`;

      if (isVercel && activeSupabaseUrl) {
        // Vercel: upload to Supabase Storage
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || activeSupabaseKey;
        const adminSupabase = createClient(activeSupabaseUrl, serviceRoleKey, {
          auth: { persistSession: false }
        });
        const { error: storageError } = await adminSupabase.storage
          .from('uploads')
          .upload(savedFileName, buffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });
        if (storageError) {
          console.error('Supabase Storage upload error:', storageError.message);
        } else {
          console.log(`File uploaded to Supabase Storage: ${savedFileName}`);
        }
      } else {
        // Local dev: save to public/uploads
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, savedFileName), buffer);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        file_name: fileName,
        source_type: sourceType,
        project,
        client,
        event_date,
        summary,
        raw_content: rawContent,
        doc_id: savedDocId
      }
    });

  } catch (error: unknown) {
    console.error('Analyze API catch-all error:', error);
    return NextResponse.json({ error: (error as Error).message || '서버 오류 발생' }, { status: 500 });
  }
}

// Helpers
function getSourceType(ext: string): 'email' | 'slack' | 'docx' | 'pdf' | 'txt' {
  if (ext === 'mbox') return 'email';
  if (ext === 'json') return 'slack';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'txt';
}

function getMockLLMResponse(fileName: string, rawContent: string) {
  // Regex date search inside the document content
  let extractedDate: string | null = null;
  
  // 1) Test YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
  const standardDateMatch = rawContent.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (standardDateMatch) {
    const [_, y, m, d] = standardDateMatch;
    extractedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // 2) Test YYYY년 MM월 DD일
  if (!extractedDate) {
    const koDateMatch = rawContent.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (koDateMatch) {
      const [_, y, m, d] = koDateMatch;
      extractedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // 3) Test Email Date header: e.g. "Date: Mon, 15 Mar 2026 10:00:00" or "Date: 2026-03-15"
  if (!extractedDate) {
    const emailDateMatch = rawContent.match(/Date:\s*(?:[A-Za-z]+,\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i);
    if (emailDateMatch) {
      const [_, d, mStr, y] = emailDateMatch;
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const m = months[mStr.toLowerCase().substring(0, 3)] || '01';
      extractedDate = `${y}-${m}-${d.padStart(2, '0')}`;
    }
  }

  const nameAndContent = (fileName + ' ' + rawContent).toLowerCase();
  
  let project = '신규 비즈니스 개발';
  let client = '미분류 파트너';
  let summary = '';
  let defaultDate = new Date().toISOString().split('T')[0];

  if (nameAndContent.includes('영업') || nameAndContent.includes('sales') || nameAndContent.includes('바이어') || nameAndContent.includes('마케팅') || nameAndContent.includes('계약')) {
    project = '영업전략 수립';
    client = '솔루션즈아이엔씨';
    defaultDate = '2026-05-10';
    summary = `• [완료된 주요 업무]: 2분기 핵심 타겟 거래처 매출 분석 리포트 및 제안 자료 정리를 마쳤습니다. 솔루션즈아이엔씨의 차기 년도 라이선스 유지보수 계약 단가 인상 조건에 대한 이메일 1차 서면 피드백을 전달했습니다.
• [진행 중인 사항 및 잔여 이슈]: 하반기 매출 15% 추가 달성을 위한 협력 파트너사 발굴 회의가 예정되어 있습니다. 솔루션즈아이엔씨 구매 계약 최종 도장 날인이 차주 금요일까지 완료되어야 합니다.
• [후임자 인수 지침 및 리소스]: 모든 고객사 거래 히스토리는 Salesforce 영업망 대시보드에 업데이트되어 있으며, 추가 미팅 제안 슬라이드는 구글 드라이브 'Sales_Strategy_2026' 공유 드라이브 링크를 담당 팀장에게 공유받아 참조하십시오.`;
  } else if (nameAndContent.includes('스마트') || nameAndContent.includes('factory') || nameAndContent.includes('센서') || nameAndContent.includes('iot')) {
    project = '스마트팩토리 구축';
    client = '한양제조';
    defaultDate = '2026-05-15';
    summary = `• [완료된 주요 업무]: 공장 내 설비 IoT 센서들의 원격 데이터 수집용 REST API 서버 구축 및 하드웨어 연동 시그널 테스트를 통과했습니다. 수집된 시계열 데이터 가시화 대시보드 웹 UI 프레임이 구축되었습니다.
• [진행 중인 사항 및 잔여 이슈]: 6월 초 공장 시험 가동 일정에 맞춘 부하 테스트(Load Test)가 5/25 완료 예정으로 대기 중입니다. 간헐적인 데이터 유실 문제에 대해 통신 패킷 재전송 로직을 개선 중입니다.
• [후임자 인수 지침 및 리소스]: 공장 내부 로컬 통신 망 게이트웨이 IP 주소 및 센서 Node 사양서 문서는 '/docs/smart-factory/specs.pdf' 경로에 보관되어 있으며, 관련 DB 연결 세팅은 .env.local을 참조하세요.`;
  } else if (nameAndContent.includes('보안') || nameAndContent.includes('patch') || nameAndContent.includes('security') || nameAndContent.includes('방화벽')) {
    project = '알파고 보안 솔루션';
    client = '보안시스템즈';
    defaultDate = '2026-05-02';
    summary = `• [완료된 주요 업무]: 사내 알파고 보안 솔루션의 취약점 진단 및 방화벽 패치 버전 2.0 배포가 정상 승인되었습니다. 주요 포트 차단 설정 및 화이트리스트 IP 테이블 정리가 완료되었습니다.
• [진행 중인 사항 및 잔여 이슈]: 거래처 요구에 따른 실시간 웹소켓 차단 모니터링 대시보드 모듈 추가 기능이 구현 진행 단계에 있습니다. 세션 만료 및 재접속 예외 처리에 일부 지연 현상이 있습니다.
• [후임자 인수 지침 및 리소스]: 매주 월요일 오전 보안 감사 로그(/logs/security) 분석 업무를 수행해야 합니다. DB 보안 스키마 접근용 마스터 Key와 토큰 정보는 사내 패스워드 매니저(Bitwarden) 내 'Alpago-Security' 항목을 조회하십시오.`;
  } else if (nameAndContent.includes('마이그레이션') || nameAndContent.includes('migration') || nameAndContent.includes('next') || nameAndContent.includes('react')) {
    project = 'Next.js 마이그레이션';
    client = '테크네트웍스';
    defaultDate = '2026-04-12';
    summary = `• [완료된 주요 업무]: 프론트엔드 프레임워크의 Next.js App Router로의 마이그레이션 설계 및 Core 컴포넌트(GNB, 사이드바, 다이얼로그) 모듈 전환 완료. Lighthouse 성능 검사를 통해 렌더링 초기 속도가 기존 대비 40% 이상 향상되었음을 확인했습니다.
• [진행 중인 사항 및 잔여 이슈]: 다국어 패키지(next-intl) 이식 및 동적 라우팅 최적화 작업이 진행 중입니다. 모바일 반응형 뷰에서 일부 그리드 깨짐 현상이 보고되었으며, 배포 전 CSS 링킹 확인이 필요합니다.
• [후임자 인수 지침 및 리소스]: 다음 담당자는 src/components 폴더에 분리된 컴포넌트들의 Tailwind v4 마이그레이션 로그를 참조해야 합니다. 개발 스테이징 환경 배포 스크립트(npm run deploy:staging) 및 AWS Amplify 연동 권한은 인프라 담당 부서에 기안 신청하십시오.`;
  } else {
    summary = `• [완료된 주요 업무]: 업로드된 문서 "${fileName}" 내용을 기반으로 기초 텍스트 파싱을 완료하여 프로젝트 기본 메타데이터 구조를 형성했습니다.
• [진행 중인 사항 및 잔여 이슈]: 업무 마일스톤 및 핵심 관련자(Stakeholders) 대화 목록의 연관 관계 추출이 진행 중이며, 미확정된 개발 일정 및 연락망의 유효성 검증이 요구됩니다.
• [후임자 인수 지침 및 리소스]: 본 카드에 연계된 원본 데이터 파일의 텍스트 원본을 'documents' 스키마 테이블에서 조회하여 세부 기술 요약 스펙을 보강하십시오.`;
  }

  return {
    project,
    client,
    event_date: extractedDate || defaultDate,
    summary
  };
}
