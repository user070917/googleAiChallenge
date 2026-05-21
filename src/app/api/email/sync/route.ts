import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Define simulated email data (Fallback simulation mode)
const mockEmails = [
  {
    doc_id: 'mock-email-1',
    file_name: 'email_infra_transfer.mbox',
    source_type: 'email' as const,
    project: '인프라 이전',
    client: 'AWS테크',
    event_date: '2026-05-18',
    summary: '• [완료된 주요 업무]: 케어모니터 시스템의 레거시 가상 서버 인프라에서 AWS EKS 기반 컨테이너 환경으로 이전을 전면 완료하고 RDS PostgreSQL DB 복제본(Read Replica) 구성을 마쳤습니다.\n• [진행 중인 사항 및 잔여 이슈]: EKS 클러스터 모니터링 툴(Prometheus/Grafana) 대시보드 로그 연동 작업을 80% 진행했습니다. SSL 인증서 만료일이 2026년 6월 15일로 확인되어 와일드카드 인증서로의 갱신이 시급합니다. 대용량 파일 전송 타임아웃 이슈 방지를 위한 ALB Idle Timeout 시간 설정 조정(60초 -> 300초)이 필요합니다.\n• [후임자 인수 지침 및 리소스]: AWS 루트 키는 사내 보안 금고(Vault) 내 \'AWS_ROOT_KEY\'에서 획득 가능합니다. 인프라 구조도 및 테라폼(Terraform) 구성 코드는 깃허브 \'caremonitor-infra\' 프라이빗 레포지토리에 저장되어 있으므로 소스코드를 참조하시기 바랍니다.',
    raw_content: `From: lead-engineer@awstech-consulting.com
To: dev-team@caremonitor.co.kr
Subject: [기술 인계] 클라우드 인프라 아키텍처 이전 완료 및 자원 이관 보고
Date: Mon, 18 May 2026 09:15:00 +0900

안녕하세요. AWS테크의 김태우 리드 엔지니어입니다.

지난 3개월간 진행되었던 케어모니터 시스템의 클라우드 인프라 아키텍처 이전 및 AWS 리소스 이관이 성공적으로 완료되었습니다. 후임자 및 운영팀을 위한 주요 인수인계 사항을 보고드립니다.

[인수 인계 주요 사항]
1. 클라우드 아키텍처 이전 완료:
   - 레거시 가상 서버에서 AWS EKS 기반 컨테이너 아키텍처로 완전 이전 완료.
   - RDS PostgreSQL 데이터베이스 이관 및 읽기 복제본(Read Replica) 구성 완료.
   - S3 버킷 권한 및 CDN(CloudFront) 캐싱 최적화 반영.

2. 진행 중인 잔여 이슈:
   - EKS 클러스터 내 모니터링 툴(Prometheus/Grafana) 대시보드 로그 연동 중 (현재 80% 진행).
   - 기존 SSL/TLS 인증서의 갱신 만료일이 2026년 6월 15일이므로, 이전에 Let's Encrypt 또는 AWS ACM으로 와일드카드 인증서 전환 교체 작업 필요.
   - 대용량 파일 업로드 시 일시적 네트워크 타임아웃 방지를 위해 ALB 연결 유휴 시간(Idle Timeout) 조정 필요 (현재 60초에서 300초로 상향 권장).

3. 후임 지침 및 참고 리소스:
   - AWS 루트 관리자 계정 정보는 사내 보안 금고(Vault)의 'AWS_ROOT_KEY'를 조회하십시오.
   - 인프라 인프라 구조도 및 테라폼(Terraform) 스크립트 소스는 Github 'caremonitor-infra' 프라이빗 레포지토리에 저장되어 있습니다.
   - 긴급 인프라 오류 발생 시, AWS테크 서포트 라인(support@awstech.com) 또는 제 개인 연락망(010-XXXX-XXXX)으로 문의 바랍니다.

감사합니다.
김태우 드림.`
  },
  {
    doc_id: 'mock-email-2',
    file_name: 'email_qa_feedback.mbox',
    source_type: 'email' as const,
    project: '서비스 안정화',
    client: '테크네트웍스',
    event_date: '2026-05-20',
    summary: '• [완료된 주요 업무]: 1차 QA 과정에서 보고되었던 핵심 버그 12건 중 10건(로그인 세션 풀림, 결제 모듈 사후 스크립트 등)에 대한 소스코드 패치 및 로딩 스피너, 다국어 폰트 UI 검증을 성공적으로 마쳤습니다.\n• [진행 중인 사항 및 잔여 이슈]: 모바일 가로 모드 시 그리드 뷰 레이아웃 깨짐 현상과 PDF 인쇄 영역 잘림 문제 등 잔여 마이너 버그 2건에 대한 패치를 진행하고 있습니다. 최종 빌드 본의 배포 및 실 서버 환경 테스트를 앞두고 있습니다.\n• [후임자 인수 지침 및 리소스]: 차주 화요일(5/26) 오전 10시 실서비스 환경에 대한 최종 릴리즈가 예정되어 있으므로 30분간 서비스 정지에 대한 사전 안내 기안이 필요합니다. QA 피드백 시트 공유 스프레드시트를 참고하시고 문의는 QA팀 박선우 책임(010-YYYY-YYYY)에게 하시기 바랍니다.',
    raw_content: `From: pm@technetworks.co.kr
To: contact@caremonitor.co.kr
Subject: [검수 요청] QA 피드백 반영 및 차주 배포 일정 안내 (테크네트웍스)
Date: Wed, 20 May 2026 16:45:00 +0900

안녕하세요. 테크네트웍스 PM 이민아입니다.

개발 최종 단계인 서비스 안정화 프로젝트의 2차 QA 테스트 결과를 공유해 드리며 피드백 반영 및 배포 일정을 안내해 드립니다.

[인수 인계 주요 사항]
1. 완료 업무:
   - 1차 QA에서 발견된 핵심 오류 12건 중 10건(로그인 세션 풀림, 결제 모듈 사후 처리 스크립트 등)에 대한 코드 패치 및 검증 완료.
   - 로딩 스피너 도입 및 다국어 폰트 최적화로 UI 만족도 향상.

2. 진행 중인 사항:
   - 잔여 마이너 버그 2건(모바일 가로 모드 시 레이아웃 깨짐, PDF 리포트 다운로드 인쇄 영역 잘림) 패치 진행 중.
   - 최종 빌드 본의 배포 및 실 서버 환경 테스트 대기 중.

3. 후임 지침 및 참고 리소스:
   - 차주 화요일(2026-05-26) 오전 10시 실서비스 환경에 서비스 배포가 예정되어 있습니다. 배포 작업 중 30분간 순간 서비스 정지 또는 지연이 발생할 수 있으니 사전 공지가 필요합니다.
   - QA 피드백 요약 및 검수 항목 체크리스트 시트는 구글 스프레드시트 링크(https://docs.google.com/spreadsheets/d/mock-qa-sheet)를 확인하세요.
   - 관련하여 문의가 있으시면 QA 팀의 박선우 책임(010-YYYY-YYYY)에게 문의하시기 바랍니다.

감사합니다.
이민아 드림.`
  }
];

// Helper functions for Gmail payload processing
function decodeBase64(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function getBodyText(payload: any): string {
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = getBodyText(part);
      if (text) return text;
    }
  }
  return '';
}

// Fallback rule-based summarizer
function summarizeEmailFallback(subject: string, bodyText: string, dateStr: string): { project: string; client: string; event_date: string; summary: string } {
  let project = '업무 공유';
  if (subject.includes('인수인계') || subject.includes('인계')) project = '인수인계';
  else if (subject.includes('인프라')) project = '인프라 관리';
  else if (subject.includes('QA') || subject.includes('검수')) project = '서비스 안정화';
  else if (subject.includes('보고')) project = '업무 보고';
  else if (subject.includes('퇴사')) project = '인력 퇴사';

  let client = '자사';
  if (bodyText.includes('AWS') || bodyText.includes('awstech')) client = 'AWS테크';
  else if (bodyText.includes('테크네트웍스')) client = '테크네트웍스';
  
  let event_date = new Date().toISOString().split('T')[0];
  try {
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        event_date = parsedDate.toISOString().split('T')[0];
      }
    }
  } catch {}

  const summaryLines = [
    `• [완료된 주요 업무]: 메일 제목 "${subject}"을 수집하였습니다.`,
    `• [진행 중인 사항 및 잔여 이슈]: 본문 크기 ${bodyText.length}글자의 내용 동기화가 완료되었습니다. 상세 사항을 확인해 주세요.`,
    `• [후임자 인수 지침 및 리소스]: 동기화된 이메일(${event_date} 수집) 원본은 상세 보기의 .mbox 파일을 통해 확인할 수 있습니다.`
  ];

  return {
    project,
    client,
    event_date,
    summary: summaryLines.join('\n')
  };
}

// OpenAI API Summarizer
async function summarizeEmailWithOpenAI(subject: string, bodyText: string): Promise<{ project: string; client: string; event_date: string; summary: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('No OpenAI API key');
  }

  const prompt = `
당신은 업무 이메일을 분석하여 핵심 정보를 추출하고 대시보드 카드용 요약을 작성하는 유능한 AI 사수입니다.
다음 이메일을 분석하여 JSON 형식으로만 응답해 주세요. 마크다운 블록(\`\`\`json)은 포함하지 말고 순수 JSON 문자열만 반환해 주세요.

[이메일 제목]
${subject}

[이메일 본문]
${bodyText}

[출력 요구 JSON 포맷]
{
  "project": "프로젝트 이름 (예: 인프라 이전, 서비스 안정화 등 핵심 주제를 2~5단어로 요약)",
  "client": "고객사/협력사 이름 또는 발신 회사명 (최대한 본문이나 도메인 등에서 식별하여 적절히 기입. 식별 불가 시 '자사' 혹은 '확인 불가')",
  "event_date": "이메일 내에서 언급된 중요한 이벤트 날짜 또는 이메일 작성 날짜 (YYYY-MM-DD 형식)",
  "summary": "핵심 요약 사항 (글머리 기호 '•'를 사용하여 3개의 문장으로 구성하고 각 문장 끝에 줄바꿈 문자 \\n을 추가하세요. 반드시 완료된 업무, 진행 중인 사항/잔여 이슈, 후임자 지침/참고 리소스를 요약해야 합니다)"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI API request failed');
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isLive = !!supabaseUrl && !!supabaseKey;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Retrieve client refresh token from POST body if any
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      // Body may not exist
    }
    const clientRefreshToken = requestBody?.refresh_token;

    // Self-healing: Ensure public/uploads folder exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Determine if we should perform a real Gmail sync
    let targetRefreshToken = clientRefreshToken;
    let supabaseClient = null;

    if (isLive) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      // Fetch connection to get stored refresh token
      const { data: connections } = await supabaseClient.from('email_connections').select('*').eq('provider', 'gmail');
      if (connections && connections.length > 0) {
        targetRefreshToken = connections[0].refresh_token || targetRefreshToken;
      }
    }

    const isRealMode = !!(clientId && clientSecret && targetRefreshToken && targetRefreshToken !== 'mock_refresh_token');

    if (isRealMode) {
      // 1. Refresh Access Token using Refresh Token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: targetRefreshToken,
          grant_type: 'refresh_token',
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh Google OAuth access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 2. Fetch Message list from Gmail API
      const searchUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent('subject:(인수인계 OR 업무 OR 보고 OR 퇴사)') + '&maxResults=5';
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!searchResponse.ok) {
        throw new Error('Failed to retrieve messages from Gmail API');
      }

      const searchData = await searchResponse.json();
      const messagesList = searchData.messages || [];

      // Fetch existing documents to prevent duplication
      let syncedDocs: string[] = [];
      if (isLive && supabaseClient) {
        const { data: existingDocs } = await supabaseClient.from('documents').select('file_name');
        syncedDocs = existingDocs?.map(d => d.file_name) || [];
      }

      const processedEmails: any[] = [];
      let addedCount = 0;

      for (const msg of messagesList) {
        const fileName = `gmail_${msg.id}.mbox`;
        
        // Skip duplicate
        if (isLive && syncedDocs.includes(fileName)) {
          continue;
        }

        // 3. Fetch Message Detail
        const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!detailResponse.ok) {
          console.error(`Failed to fetch email details for message ID: ${msg.id}`);
          continue;
        }

        const msgDetail = await detailResponse.json();
        const headers = msgDetail.payload.headers || [];

        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(제목 없음)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'unknown@gmail.com';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || 'me@gmail.com';
        const dateStr = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        const bodyText = getBodyText(msgDetail.payload) || '본문 내용 없음';
        
        // Assemble standard .mbox format content
        const rawContent = `From: ${from}
To: ${to}
Subject: ${subject}
Date: ${dateStr}

${bodyText}`;

        // 4. Summarize Email Content (OpenAI or Fallback)
        let cardDetails;
        try {
          if (process.env.OPENAI_API_KEY) {
            cardDetails = await summarizeEmailWithOpenAI(subject, bodyText);
          } else {
            cardDetails = summarizeEmailFallback(subject, bodyText, dateStr);
          }
        } catch (err) {
          console.error('Failed to summarize with OpenAI, using fallback:', err);
          cardDetails = summarizeEmailFallback(subject, bodyText, dateStr);
        }

        const finalEmailObj = {
          doc_id: `gmail_${msg.id}`,
          file_name: fileName,
          source_type: 'email' as const,
          project: cardDetails.project,
          client: cardDetails.client,
          event_date: cardDetails.event_date,
          summary: cardDetails.summary,
          raw_content: rawContent
        };

        if (isLive && supabaseClient) {
          // Write to Supabase DB
          const { data: docData, error: docError } = await supabaseClient
            .from('documents')
            .insert([{ file_name: fileName, source_type: 'email', raw_content: rawContent }])
            .select()
            .single();

          if (docError) {
            console.error(`Error inserting doc ${fileName}:`, docError);
            continue;
          }

          if (docData) {
            const { error: cardError } = await supabaseClient
              .from('cards')
              .insert([{
                project: finalEmailObj.project,
                client: finalEmailObj.client,
                event_date: finalEmailObj.event_date,
                summary: finalEmailObj.summary,
                source_type: 'email',
                doc_id: docData.id
              }]);

            if (cardError) {
              console.error(`Error inserting card for ${fileName}:`, cardError);
              continue;
            }

            // Write physical file
            try {
              const filePath = path.join(uploadDir, `${docData.id}_${fileName}`);
              fs.writeFileSync(filePath, rawContent, 'utf-8');
            } catch (writeErr) {
              console.error(`Failed to write physical file for ${fileName}:`, writeErr);
            }

            addedCount++;
          }
        } else {
          // In Local Mode (with real token but local storage flow)
          // Write physical file beforehand using mock pattern name
          try {
            const filePath = path.join(uploadDir, `gmail_${msg.id}_${fileName}`);
            fs.writeFileSync(filePath, rawContent, 'utf-8');
          } catch (writeErr) {
            console.error(`Failed to write physical file for ${fileName}:`, writeErr);
          }

          processedEmails.push(finalEmailObj);
          addedCount++;
        }
      }

      // Update last synced timestamp in DB if live
      if (isLive && supabaseClient) {
        const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        await supabaseClient
          .from('email_connections')
          .update({ last_synced_at: timeString })
          .eq('provider', 'gmail');
        
        return NextResponse.json({
          success: true,
          count: addedCount,
          live: true
        });
      } else {
        // Return structured emails list for local storage synchronization
        return NextResponse.json({
          success: true,
          count: addedCount,
          live: false,
          emails: processedEmails
        });
      }

    } else {
      // --- Fallback Simulation Mode ---
      // Save files physically to public/uploads beforehand
      for (const email of mockEmails) {
        try {
          const filePath = path.join(uploadDir, `${email.doc_id}_${email.file_name}`);
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, email.raw_content, 'utf-8');
          }
        } catch (writeErr) {
          console.error(`Failed to pre-write physical file for simulation:`, writeErr);
        }
      }

      if (isLive && supabaseClient) {
        // Fetch existing docs to prevent duplication
        const { data: existingDocs } = await supabaseClient.from('documents').select('file_name');
        const syncedDocs = existingDocs?.map(d => d.file_name) || [];
        const newEmailsToSync = mockEmails.filter(email => !syncedDocs.includes(email.file_name));

        let addedCount = 0;
        for (const email of newEmailsToSync) {
          const { data: docData, error: docError } = await supabaseClient
            .from('documents')
            .insert([{ file_name: email.file_name, source_type: email.source_type, raw_content: email.raw_content }])
            .select()
            .single();

          if (docError) {
            console.error(`Error inserting doc ${email.file_name}:`, docError);
            continue;
          }

          if (docData) {
            const { error: cardError } = await supabaseClient
              .from('cards')
              .insert([{
                project: email.project,
                client: email.client,
                event_date: email.event_date,
                summary: email.summary,
                source_type: email.source_type,
                doc_id: docData.id
              }]);

            if (cardError) {
              console.error(`Error inserting card for ${email.file_name}:`, cardError);
              continue;
            }

            // Write physical file
            try {
              const filePath = path.join(uploadDir, `${docData.id}_${email.file_name}`);
              fs.writeFileSync(filePath, email.raw_content, 'utf-8');
            } catch (writeErr) {
              console.error(`Failed to write physical file for ${email.file_name}:`, writeErr);
            }

            addedCount++;
          }
        }

        const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        await supabaseClient.from('email_connections').update({ last_synced_at: timeString }).eq('provider', 'gmail');

        return NextResponse.json({
          success: true,
          count: addedCount,
          live: true
        });
      } else {
        // Return simulated emails for client mock database injection
        return NextResponse.json({
          success: true,
          count: mockEmails.length,
          live: false,
          emails: mockEmails
        });
      }
    }

  } catch (error: any) {
    console.error('Email Sync API error:', error);
    return NextResponse.json({ error: error.message || '서버 오류 발생' }, { status: 500 });
  }
}
