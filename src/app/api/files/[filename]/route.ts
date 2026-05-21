import { NextRequest, NextResponse } from 'next/server';
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

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found at resolved path: ${filePath}`);
    return new NextResponse('File Not Found', { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Set matching Content-Type header so the browser knows how to render/download it
    let contentType = 'application/octet-stream';
    const lowerName = decodedFilename.toLowerCase();

    // Check actual content signature (PDF/DOCX) to handle plain-text mock or database recovery
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
    console.error('Error reading physical file from uploads folder:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
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

  // Security check to prevent directory traversal
  if (!decodedFilename || decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
    return new NextResponse('Access Denied', { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', decodedFilename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted physical file: ${filePath}`);
    }
    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('Failed to delete physical file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
