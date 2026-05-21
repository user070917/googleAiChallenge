import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const callbackUrl = `${origin}/api/auth/email/gmail/callback?code=mock_auth_code`;
  const cancelUrl = `${origin}/settings`;

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google 계정 연동 동의 (Simulation)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans KR', sans-serif;
    }
    .mesh-bg {
      background-color: #0b0f19;
      background-image: 
        radial-gradient(at 10% 20%, rgba(20, 184, 166, 0.15) 0px, transparent 50%),
        radial-gradient(at 90% 10%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 80%, rgba(13, 148, 136, 0.1) 0px, transparent 50%);
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
  </style>
</head>
<body class="mesh-bg min-h-screen text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
  
  <div class="w-full max-w-lg glass-panel rounded-[32px] p-6 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300">
    <!-- Top Glowing Accent -->
    <div class="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
    
    <!-- Header/Logo area -->
    <div class="flex flex-col items-center text-center mt-2 mb-8">
      <div class="flex items-center justify-center gap-4 mb-4">
        <!-- README Logo Simulator -->
        <div class="w-12 h-12 flex items-center justify-center">
          <img src="/logo.png" alt="README Logo" class="w-10 h-10 object-contain" style="filter: invert(1) brightness(2);" />
        </div>
        <div class="h-6 w-px bg-slate-700"></div>
        <!-- Google Logo Simulator -->
        <div class="w-12 h-12 flex items-center justify-center">
          <svg class="w-8 h-8" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"/>
          </svg>
        </div>
      </div>
      
      <h1 class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-400 to-indigo-300 bg-clip-text text-transparent">Google 계정 연동 요청</h1>
      <p class="text-xs sm:text-sm text-slate-400 mt-2">
        <span class="font-semibold text-slate-200">README</span>가 사용자의 이메일함에 접근할 수 있도록 동의해 주세요.
      </p>
    </div>

    <!-- Info Banner (Simulation info) -->
    <div class="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <div>
        <span class="font-bold">시뮬레이션 샌드박스 모드 활성화됨</span><br/>
        현재 Google 클라이언트 설정이 지정되지 않아 안전한 가상 시뮬레이션 환경으로 동작합니다. 실제 구글 계정 비밀번호를 요구하지 않으며 개인정보 유출 위험이 없습니다.
      </div>
    </div>

    <!-- Scopes section -->
    <div class="space-y-4 mb-8">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">요청하는 권한 목록</p>
      
      <!-- Scope 1 -->
      <div class="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
        <div class="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 text-teal-400 mt-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-200">연동 이메일 주소 확인</h3>
          <p class="text-xs text-slate-400 mt-0.5">연동을 완료하고 대시보드 식별용 메일 주소(예: simulation-user@gmail.com) 정보를 수집합니다.</p>
        </div>
      </div>

      <!-- Scope 2 -->
      <div class="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
        <div class="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 text-teal-400 mt-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-200">Gmail 메일함 읽기 권한</h3>
          <p class="text-xs text-slate-400 mt-0.5">인수/인계 메일을 필터링하여 업무 제목 및 본문 데이터를 수동/자동 동기화할 수 있도록 읽기 권한을 허가합니다.</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row gap-3">
      <a href="${cancelUrl}" class="flex-1 order-2 sm:order-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-sm text-center transition-all cursor-pointer">
        취소
      </a>
      <a href="${callbackUrl}" class="flex-1 order-1 sm:order-2 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-sm text-center shadow-lg shadow-teal-500/15 hover:shadow-teal-500/20 hover:-translate-y-0.5 transition-all cursor-pointer">
        동의 및 계속
      </a>
    </div>

    <!-- Footer Security Notice -->
    <div class="mt-6 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-white/5 pt-4">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
      </svg>
      <span>안전한 256비트 암호화 및 샌드박스 보안 프로토콜을 준수합니다.</span>
    </div>

  </div>

</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
