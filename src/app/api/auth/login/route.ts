import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const getSupabaseKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 모두 입력해주세요.' }, { status: 400 });
    }

    const activeUrl = getSupabaseUrl();
    const activeKey = getSupabaseKey();

    if (!activeUrl || !activeKey) {
      return NextResponse.json({ error: 'Supabase DB 설정이 필요합니다. .env.local 파일을 확인하세요.' }, { status: 500 });
    }

    const supabase = createClient(activeUrl, activeKey);

    // 1. Fetch user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, salt')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // 2. Verify password with Salt & Pepper
    const isValid = verifyPassword(password, user.password_hash, user.salt);

    if (!isValid) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // 3. Create secure HTTP-only session cookie
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    const cookieStore = await cookies();
    cookieStore.set('auth_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });

  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: (error as Error).message || '서버 오류 발생' }, { status: 500 });
  }
}
