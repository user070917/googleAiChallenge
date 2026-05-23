import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function DELETE() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // service_role key를 사용해야 RLS를 우회하여 삭제 가능
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase 환경 변수가 설정되지 않았습니다.' }, { status: 500 });
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    // 1. documents 목록 먼저 조회 (파일명 확보)
    const { data: docs } = await adminSupabase.from('documents').select('id, file_name');

    // 2. Supabase DB에서 cards 전체 삭제
    const { error: cardErr } = await adminSupabase
      .from('cards')
      .delete()
      .not('id', 'is', null);

    if (cardErr) {
      console.error('cards 삭제 오류:', cardErr);
      return NextResponse.json({ error: 'cards 삭제 실패: ' + cardErr.message }, { status: 500 });
    }

    // 3. Supabase DB에서 documents 전체 삭제
    const { error: docErr } = await adminSupabase
      .from('documents')
      .delete()
      .not('id', 'is', null);

    if (docErr) {
      console.error('documents 삭제 오류:', docErr);
      return NextResponse.json({ error: 'documents 삭제 실패: ' + docErr.message }, { status: 500 });
    }

    // 4. Supabase Storage 파일도 삭제
    if (docs && docs.length > 0) {
      try {
        const storageFiles = docs.map(doc => `${doc.id}_${doc.file_name}`);
        const { error: storageError } = await adminSupabase.storage
          .from('uploads')
          .remove(storageFiles);
        if (storageError) {
          console.error('Storage 삭제 오류:', storageError.message);
        }
      } catch (storageErr) {
        console.error('Storage 삭제 실패:', storageErr);
      }

      // 5. 로컬 디스크 파일도 삭제 (로컬 개발 환경)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      for (const doc of docs) {
        const filePath = path.join(uploadsDir, `${doc.id}_${doc.file_name}`);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.error(`로컬 파일 삭제 실패: ${filePath}`, fileErr);
        }
      }
    }

    return NextResponse.json({ success: true, message: '모든 데이터가 삭제되었습니다.' });
  } catch (err) {
    console.error('clearAll 오류:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
