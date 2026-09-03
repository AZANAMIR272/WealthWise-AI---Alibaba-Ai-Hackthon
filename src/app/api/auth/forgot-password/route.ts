import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { generateAndStoreOtp } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await queryOne('SELECT id, email, status FROM users WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    if (user.status === 'blocked') return NextResponse.json({ error: 'Your account has been blocked by admin' }, { status: 403 });

    const { code, sent } = await generateAndStoreOtp(email, 'reset');

    return NextResponse.json({ ok: true, sent, devCode: sent ? undefined : code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send OTP' }, { status: 500 });
  }
}
