import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth';

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const getSupabaseKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '이메일, 이름, 비밀번호를 모두 입력해주세요.' }, { status: 400 });
    }

    const activeUrl = getSupabaseUrl();
    const activeKey = getSupabaseKey();

    if (!activeUrl || !activeKey) {
      return NextResponse.json({ error: 'Supabase DB 설정이 필요합니다. .env.local 파일을 확인하세요.' }, { status: 500 });
    }

    const supabase = createClient(activeUrl, activeKey);

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    // 2. Hash password with Salt & Pepper
    const { salt, hash } = hashPassword(password);

    // 3. Save to database
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          password_hash: hash,
          salt: salt,
        }
      ])
      .select('id, email, name')
      .single();

    if (error) {
      console.error('Registration DB Error:', error);
      return NextResponse.json({ error: '회원가입 중 데이터베이스 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: (error as Error).message || '서버 오류 발생' }, { status: 500 });
  }
}
