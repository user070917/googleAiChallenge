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

export async function GET(
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
        let contentType = 'application/octet-stream';
        const lowerName = decodedFilename.toLowerCase();
        const isRealPDF = fileBuffer.length >= 4 && fileBuffer.slice(0, 4).toString('utf-8') === '%PDF';
        const isRealDocx = fileBuffer.length >= 2 && fileBuffer.slice(0, 2).toString('utf-8') === 'PK';

        if (lowerName.endsWith('.pdf')) {
          contentType = isRealPDF ? 'application/pdf' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.docx')) {
          contentType = isRealDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.json')) {
          contentType = 'application/json';
        } else if (lowerName.endsWith('.mbox') || lowerName.endsWith('.txt')) {
          contentType = 'text/plain; charset=utf-8';
        }

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`
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
        let contentType = 'application/octet-stream';
        const lowerName = decodedFilename.toLowerCase();
        const isRealPDF = fileBuffer.length >= 4 && fileBuffer.slice(0, 4).toString('utf-8') === '%PDF';
        const isRealDocx = fileBuffer.length >= 2 && fileBuffer.slice(0, 2).toString('utf-8') === 'PK';

        if (lowerName.endsWith('.pdf')) {
          contentType = isRealPDF ? 'application/pdf' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.docx')) {
          contentType = isRealDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain; charset=utf-8';
        } else if (lowerName.endsWith('.json')) {
          contentType = 'application/json';
        } else if (lowerName.endsWith('.mbox') || lowerName.endsWith('.txt')) {
          contentType = 'text/plain; charset=utf-8';
        }

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`
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