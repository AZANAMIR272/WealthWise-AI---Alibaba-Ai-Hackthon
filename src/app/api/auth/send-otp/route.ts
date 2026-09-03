import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { generateAndStoreOtp } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, purpose } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await queryOne('SELECT id, email FROM users WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });

    const { code, sent } = await generateAndStoreOtp(email, purpose === 'reset' ? 'reset' : 'register');

    // If email service is not configured, return the code so user can proceed (demo mode)
    return NextResponse.json({ ok: true, sent, devCode: sent ? undefined : code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send OTP' }, { status: 500 });
  }
}
