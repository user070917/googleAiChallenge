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
    :root {
      --bg-color: #f8fafc;
      --paper-bg: #ffffff;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --border-color: #e2e8f0;
      --primary-color: #14b8a6;
      --primary-hover: #0d9488;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0f172a;
        --paper-bg: #1e293b;
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
        --border-color: #334155;
        --primary-color: #2dd4bf;
        --primary-hover: #14b8a6;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', 'Noto Sans KR', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 80px 20px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      transition: background-color 0.3s;
    }

    /* Top Navigation bar */
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      background-color: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 100;
    }
    
    @media (prefers-color-scheme: dark) {
      .top-bar {
        background-color: rgba(15, 23, 42, 0.8);
      }
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .doc-icon {
      background-color: #2563eb;
      color: white;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-title {
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: var(--primary-color);
      color: #0f172a;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 18px;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25);
    }

    @media (prefers-color-scheme: dark) {
      .download-btn {
        color: #0f172a;
        box-shadow: 0 4px 12px rgba(45, 212, 191, 0.2);
      }
    }

    .download-btn:hover {
      background-color: var(--primary-hover);
      transform: translateY(-1px);
    }

    .download-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Content Container */
    #document-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      z-index: 10;
    }

    /* Loading Overlay */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--paper-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 60px 40px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 800px;
      text-align: center;
      margin-top: 40px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .loading-subtext {
      font-size: 13px;
      color: var(--text-secondary);
    }

    /* docx-preview styling overrides */
    .docx-wrapper {
      background-color: transparent !important;
      padding: 0 !important;
      width: 100% !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .docx {
      background-color: var(--paper-bg) !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04) !important;
      border-radius: 12px !important;
      color: var(--text-primary) !important;
      margin: 0 !important;
      transition: all 0.3s;
    }

    /* Dark mode overrides for docx elements */
    @media (prefers-color-scheme: dark) {
      .docx {
        background-color: #1e293b !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
      }
      .docx p, .docx span, .docx td, .docx th, .docx h1, .docx h2, .docx h3, .docx h4 {
        color: #f8fafc !important;
      }
    }
  </style>
</head>
<body>

  <div class="top-bar">
    <div class="doc-info">
      <span class="doc-icon">DOCX</span>
      <span class="doc-title">${filename}</span>
    </div>
    <a href="?download=true" class="download-btn">
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
      </svg>
      <span>원본 파일 다운로드</span>
    </a>
  </div>

  <div id="document-container">
    <div class="loading-container" id="loading-view">
      <div class="spinner"></div>
      <p class="loading-text">문서 원본 불러오는 중...</p>
      <p class="loading-subtext">DOCX 파일을 브라우저 뷰어에 렌더링하고 있습니다.</p>
    </div>
  </div>

  <!-- Scripts for client-side rendering -->
  <script src="https://unpkg.com/jszip/dist/jszip.min.js"></script>
  <script src="https://unpkg.com/docx-preview/dist/docx-preview.js"></script>
  
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const container = document.getElementById("document-container");
      const loadingView = document.getElementById("loading-view");

      fetch("?download=true")
        .then(response => {
          if (!response.ok) {
            throw new Error("파일 다운로드에 실패했습니다. (HTTP " + response.status + ")");
          }
          return response.blob();
        })
        .then(blob => {
          // Hide loading
          loadingView.style.display = "none";
          
          // Render DOCX asynchronously
          docx.renderAsync(blob, container, null, {
            className: "docx",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            trimXmlDeclaration: true,
            debug: false
          }).catch(renderErr => {
            console.error("docx render error:", renderErr);
            showError("문서 렌더링에 실패했습니다: " + renderErr.message);
          });
        })
        .catch(err => {
          console.error("fetch docx error:", err);
          showError(err.message);
        });

      function showError(msg) {
        loadingView.innerHTML = \`
          <h2 style="color: #e11d48; margin-bottom: 12px; font-size: 18px;">문서를 불러올 수 없습니다.</h2>
          <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;">\${msg}</p>
          <a href="?download=true" class="download-btn" style="box-shadow: none;">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
            </svg>
            <span>원본 파일 강제 다운로드</span>
          </a>
        \`;
      }
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