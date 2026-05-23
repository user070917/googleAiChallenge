import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getStorageKey(filename: string): string {
  const underscoreIndex = filename.indexOf('_');
  if (underscoreIndex !== -1) {
    const docId = filename.substring(0, underscoreIndex);
    const dotIndex = filename.lastIndexOf('.');
    const ext = dotIndex !== -1 ? filename.substring(dotIndex + 1).toLowerCase() : '';
    if (ext) {
      return `${docId}.${ext}`;
    }
    return docId;
  }
  return filename;
}

function renderDocxPreviewPage(filename: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename} - 미리보기</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    /* ─── Light mode defaults ─── */
    :root {
      --bg-color: #f1f5f9;
      --chrome-bg: rgba(255,255,255,0.85);
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --border-color: #e2e8f0;
      --primary-color: #14b8a6;
      --primary-hover: #0d9488;
      --shadow-doc: 0 4px 24px rgba(0,0,0,0.08);
    }

    /* ─── Dark mode: only the outer shell changes ─── */
    html.dark {
      --bg-color: #0f172a;
      --chrome-bg: rgba(15,23,42,0.88);
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --border-color: #1e293b;
      --primary-color: #2dd4bf;
      --primary-hover: #14b8a6;
      --shadow-doc: 0 4px 24px rgba(0,0,0,0.4);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Noto Sans KR', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-primary);
      padding: 80px 20px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      transition: background-color 0.25s, color 0.25s;
    }

    /* ── Top chrome bar ── */
    .top-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 60px;
      background-color: var(--chrome-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 200;
      transition: background-color 0.25s, border-color 0.25s;
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
      margin-right: 16px;
    }

    .doc-icon {
      flex-shrink: 0;
      background-color: #2563eb;
      color: #fff;
      padding: 5px 9px;
      border-radius: 7px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .doc-title {
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
      transition: color 0.25s;
    }

    .bar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    /* Theme toggle button */
    .theme-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 16px;
    }
    .theme-btn:hover {
      background: var(--border-color);
      color: var(--text-primary);
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background-color: var(--primary-color);
      color: #0f172a;
      font-weight: 700;
      font-size: 12px;
      padding: 9px 15px;
      border-radius: 9px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 3px 10px rgba(20,184,166,0.25);
      white-space: nowrap;
    }
    .download-btn:hover {
      background-color: var(--primary-hover);
      transform: translateY(-1px);
    }
    .download-btn svg { width: 14px; height: 14px; }

    /* ── Document render area ── */
    #document-container {
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
    }

    /* Loading state */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 60px 40px;
      box-shadow: var(--shadow-doc);
      width: 100%;
      text-align: center;
      margin-top: 20px;
      transition: border-color 0.25s;
    }
    html.dark .loading-container { background-color: #1e293b; }

    .spinner {
      width: 44px; height: 44px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      margin-bottom: 18px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: 15px; font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
    }
    .loading-subtext {
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* ── docx-preview outer wrapper overrides ──
       IMPORTANT: We do NOT force any colors inside .docx pages.
       The document pages remain white so Word formatting (incl. tables)
       is always readable exactly as intended. */
    .docx-wrapper {
      background-color: transparent !important;
      padding: 20px 0 !important;
      gap: 20px !important;
    }

    /* Each page gets a subtle shadow; content colors are untouched */
    .docx {
      box-shadow: var(--shadow-doc) !important;
      border-radius: 4px !important;
      margin: 0 auto !important;
    }

    /* In dark mode, add a very slight dimming ring so white pages feel comfortable,
       but DO NOT change any text or background colors inside the page */
    html.dark .docx {
      box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5) !important;
      filter: brightness(0.96);
    }
  </style>
</head>
<body>

  <div class="top-bar">
    <div class="doc-info">
      <span class="doc-icon">DOCX</span>
      <span class="doc-title">${filename}</span>
    </div>
    <div class="bar-actions">
      <button class="theme-btn" id="theme-toggle" title="라이트/다크 모드 전환" aria-label="테마 전환">
        <span id="theme-icon">☀️</span>
      </button>
      <a href="?download=true" class="download-btn">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5
               M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        <span>원본 다운로드</span>
      </a>
    </div>
  </div>

  <div id="document-container">
    <div class="loading-container" id="loading-view">
      <div class="spinner"></div>
      <p class="loading-text">문서 원본 불러오는 중…</p>
      <p class="loading-subtext">DOCX 파일을 브라우저에서 렌더링하고 있습니다.</p>
    </div>
  </div>

  <script src="https://unpkg.com/jszip/dist/jszip.min.js"></script>
  <script src="https://unpkg.com/docx-preview/dist/docx-preview.js"></script>

  <script>
    // ── Theme detection & toggle ──────────────────────────────────────────
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    const themeBtn  = document.getElementById('theme-toggle');

    // Detect OS/app preference at load time
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = prefersDark;
    applyTheme(isDark);

    // Keep in sync if the user changes OS setting while the tab is open
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        isDark = e.matches;
        applyTheme(isDark);
      });

    themeBtn.addEventListener('click', () => {
      isDark = !isDark;
      applyTheme(isDark);
    });

    function applyTheme(dark) {
      if (dark) {
        html.classList.add('dark');
        themeIcon.textContent = '🌙';
      } else {
        html.classList.remove('dark');
        themeIcon.textContent = '☀️';
      }
    }

    // ── DOCX rendering ───────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
      const container   = document.getElementById('document-container');
      const loadingView = document.getElementById('loading-view');

      fetch('?download=true')
        .then(res => {
          if (!res.ok) throw new Error('파일 다운로드에 실패했습니다. (HTTP ' + res.status + ')');
          return res.blob();
        })
        .then(blob => {
          loadingView.style.display = 'none';
          return docx.renderAsync(blob, container, null, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            debug: false
          });
        })
        .catch(err => {
          console.error(err);
          loadingView.style.display = 'none';
          container.innerHTML = \`
            <div style="padding: 40px; text-align: center; color: var(--text-primary);">
              <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">파일을 불러오는데 실패했습니다.</p>
              <p style="font-size: 13px; color: var(--text-secondary);">\${err.message || err}</p>
            </div>
          \`;
        });
    });
  </script>

</body>
</html>
`;
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ filename: string }> }
) {
  const { filename } = await props.params;
  const { searchParams } = new URL(req.url);
  const isDownload = searchParams.get('download') === 'true';

  let decodedFilename = filename;
  try {
    decodedFilename = decodeURIComponent(filename);
  } catch (err) {
    console.error('Failed to decode filename:', err);
  }

  // Security check to prevent directory traversal
  if (!decodedFilename || decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
    return new NextResponse('Access Denied', { status: 400 });
  }

  const isVercel = process.env.VERCEL === '1';

  // 1. Fallback / Try local filesystem first (local dev only)
  if (!isVercel) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', decodedFilename);

    // Self-healing: if file does not exist, look up in DB and restore
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found at resolved path: ${filePath}. Attempting to restore from DB...`);
      const underscoreIndex = decodedFilename.indexOf('_');
      if (underscoreIndex !== -1) {
        const docId = decodedFilename.substring(0, underscoreIndex);
        const activeSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const activeSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (activeSupabaseUrl && activeSupabaseKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(activeSupabaseUrl, activeSupabaseKey);
            const { data, error } = await supabase
              .from('documents')
              .select('raw_content')
              .eq('id', docId)
              .single();

            if (!error && data && data.raw_content) {
              const uploadDir = path.dirname(filePath);
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              fs.writeFileSync(filePath, data.raw_content, 'utf-8');
              console.log(`Successfully restored ${decodedFilename} from database to disk.`);
            } else {
              console.warn(`Document ${docId} not found in DB or error occurred:`, error);
            }
          } catch (dbErr) {
            console.error('Failed to query Supabase or write restored file:', dbErr);
          }
        }
      }
    }

    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const lowerName = decodedFilename.toLowerCase();
        const isRealDocx = fileBuffer.length >= 2 && fileBuffer.slice(0, 2).toString('utf-8') === 'PK';

        // Render DOCX using client-side docx-preview HTML page if not a direct download request
        if (lowerName.endsWith('.docx') && isRealDocx && !isDownload) {
          const htmlContent = renderDocxPreviewPage(decodedFilename);
          return new NextResponse(htmlContent, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`
            }
          });
        }

        let contentType = 'application/octet-stream';
        const isRealPDF = fileBuffer.length >= 4 && fileBuffer.slice(0, 4).toString('utf-8') === '%PDF';

        if (lowerName.endsWith('.pdf')) {
          contentType = isRealPDF ? 'application/pdf' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.docx')) {
          contentType = isRealDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.json')) {
          contentType = 'application/json';
        } else if (lowerName.endsWith('.mbox') || lowerName.endsWith('.txt')) {
          contentType = 'text/plain; charset=utf-8';
        }

        const disposition = isDownload ? 'attachment' : 'inline';
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `${disposition}; filename="${encodeURIComponent(decodedFilename)}"`
          }
        });
      } catch (err) {
        console.error('Error reading local file:', err);
      }
    }
  }

  // 2. Try Supabase Storage (production Vercel, or local fallback when local file is missing and db-restore failed)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });

      // Translate to safe storage key
      const storageKey = getStorageKey(decodedFilename);

      // Download from Supabase Storage to avoid redirect & InvalidKey error with non-ASCII filenames
      const { data: fileBlob, error: downloadError } = await adminSupabase.storage
        .from('uploads')
        .download(storageKey);

      if (downloadError) {
        console.error('Failed to download from Supabase Storage:', downloadError.message);
      } else if (fileBlob) {
        const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
        const lowerName = decodedFilename.toLowerCase();
        const isRealDocx = fileBuffer.length >= 2 && fileBuffer.slice(0, 2).toString('utf-8') === 'PK';

        // Render DOCX using client-side docx-preview HTML page if not a direct download request
        if (lowerName.endsWith('.docx') && isRealDocx && !isDownload) {
          const htmlContent = renderDocxPreviewPage(decodedFilename);
          return new NextResponse(htmlContent, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`
            }
          });
        }

        let contentType = 'application/octet-stream';
        const isRealPDF = fileBuffer.length >= 4 && fileBuffer.slice(0, 4).toString('utf-8') === '%PDF';

        if (lowerName.endsWith('.pdf')) {
          contentType = isRealPDF ? 'application/pdf' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.docx')) {
          contentType = isRealDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.json')) {
          contentType = 'application/json';
        } else if (lowerName.endsWith('.mbox') || lowerName.endsWith('.txt')) {
          contentType = 'text/plain; charset=utf-8';
        }

        const disposition = isDownload ? 'attachment' : 'inline';
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `${disposition}; filename="${encodeURIComponent(decodedFilename)}"`
          }
        });
      }
    } catch (err) {
      console.error('Supabase Storage download failed:', err);
    }
  }

  return new NextResponse('File Not Found', { status: 404 });
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ filename: string }> }
) {
  const { filename } = await props.params;

  let decodedFilename = filename;
  try {
    decodedFilename = decodeURIComponent(filename);
  } catch (err) {
    console.error('Failed to decode filename:', err);
  }

  if (!decodedFilename || decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
    return new NextResponse('Access Denied', { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Delete from Supabase Storage
  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });
      const storageKey = getStorageKey(decodedFilename);
      await adminSupabase.storage.from('uploads').remove([storageKey]);
    } catch (err) {
      console.error('Failed to delete from Supabase Storage:', err);
    }
  }

  // Also try local filesystem (local dev)
  const isVercel = process.env.VERCEL === '1';
  if (!isVercel) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', decodedFilename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Failed to delete local file:', err);
    }
  }

  return new NextResponse('OK', { status: 200 });
}