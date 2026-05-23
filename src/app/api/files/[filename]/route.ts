import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Try Supabase Storage first (works on Vercel)
  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });

      // Get public URL from Supabase Storage
      const { data: publicUrlData } = adminSupabase.storage
        .from('uploads')
        .getPublicUrl(decodedFilename);

      if (publicUrlData?.publicUrl) {
        // Redirect to Supabase Storage public URL
        return NextResponse.redirect(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error('Supabase Storage redirect failed:', err);
    }
  }

  // Fallback: try local filesystem (local dev only)
  const isVercel = process.env.VERCEL === '1';
  if (!isVercel) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', decodedFilename);
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
      await adminSupabase.storage.from('uploads').remove([decodedFilename]);
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
