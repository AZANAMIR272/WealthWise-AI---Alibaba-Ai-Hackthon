import { NextResponse } from 'next/server';
import { registerUser, generateAndStoreOtp } from '@/lib/auth';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const { name, email, password, turnstileToken } = await request.json();
    if (!name || !email || !password) return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    // Verify CAPTCHA before proceeding
    const captcha = await verifyTurnstileToken(turnstileToken);
    if (!captcha.success) {
      return NextResponse.json({ error: captcha.error }, { status: 403 });
    }

    // Create account (unverified — OTP required before login)
    const user = await registerUser(name, email, password);

    // Generate and send OTP
    const { code, sent } = await generateAndStoreOtp(email, 'register');

    return NextResponse.json({
      needVerification: true,
      email,
      sent,
      devCode: sent ? undefined : code,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
