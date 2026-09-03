import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { seedDemoData, isDemoSeeded, getDemoEmail } from '@/lib/demo-data';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    await seedDemoData();
    const result = await loginUser(getDemoEmail(), 'demo123');
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';
    cookieStore.set('ww_token', result.token, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 });
    return NextResponse.json({ user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
