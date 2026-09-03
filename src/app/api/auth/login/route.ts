import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const { email, password, turnstileToken } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    // Verify CAPTCHA before proceeding
    const captcha = await verifyTurnstileToken(turnstileToken);
    if (!captcha.success) {
      return NextResponse.json({ error: captcha.error }, { status: 403 });
    }

    const result = await loginUser(email, password);

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';
    cookieStore.set('ww_token', result.token, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 });

    return NextResponse.json({ user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
