import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyOtp } from '@/lib/auth';
import { queryRun } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) return NextResponse.json({ error: 'Email, code and new password required' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const check = await verifyOtp(email, code);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    // Update password and clear OTP
    const hash = bcrypt.hashSync(newPassword, 10);
    await queryRun('UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires = NULL WHERE email = ?', [hash, email]);

    return NextResponse.json({ ok: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset password' }, { status: 500 });
  }
}
