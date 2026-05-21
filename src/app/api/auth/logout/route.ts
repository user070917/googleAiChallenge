import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '로그아웃 실패' }, { status: 500 });
  }
}
