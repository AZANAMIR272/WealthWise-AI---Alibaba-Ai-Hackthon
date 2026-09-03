import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyOtp, loginUserByEmail } from '@/lib/auth';
import { queryRun } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 });

    const check = await verifyOtp(email, code);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    // Mark email as verified and clear OTP
    await queryRun('UPDATE users SET email_verified = 1, otp_code = NULL, otp_expires = NULL WHERE email = ?', [email]);

    // Log the user in
    const result = await loginUserByEmail(email);

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';
    cookieStore.set('ww_token', result.token, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 });

    return NextResponse.json({ user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
