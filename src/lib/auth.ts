import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { queryAll, queryOne, queryRun } from './db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'wealthwise-ai-secret-key-2026-pak';

// ─── OTP Helpers ───────────────────────────────────────────
export async function generateAndStoreOtp(email: string, purpose: 'register' | 'reset'): Promise<{ code: string; sent: boolean }> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  await queryRun('UPDATE users SET otp_code = ?, otp_expires = ? WHERE email = ?', [code, expires, email]);

  // Send email via Resend if configured, otherwise caller shows code on screen
  const sent = await sendOtpEmail(email, code, purpose);
  return { code, sent };
}

async function sendOtpEmail(email: string, code: string, purpose: 'register' | 'reset'): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const subject = purpose === 'register'
      ? 'WealthWise AI — Verify Your Email'
      : 'WealthWise AI — Reset Your Password';
    const text = purpose === 'register'
      ? `Your WealthWise AI verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
      : `Your WealthWise AI password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'WealthWise AI <onboarding@resend.dev>',
        to: [email],
        subject,
        text,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifyOtp(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const user = await queryOne('SELECT otp_code, otp_expires FROM users WHERE email = ?', [email]);
  if (!user) return { ok: false, error: 'Account not found' };
  if (!user.otp_code || !user.otp_expires) return { ok: false, error: 'No OTP was sent. Please request a new code.' };
  if (new Date(user.otp_expires) < new Date()) {
    await queryRun('UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE email = ?', [email]);
    return { ok: false, error: 'Code expired. Please request a new one.' };
  }
  if (user.otp_code !== String(code).trim()) return { ok: false, error: 'Incorrect code. Please try again.' };
  return { ok: true };
}

export async function clearOtp(email: string): Promise<void> {
  await queryRun('UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE email = ?', [email]);
}

// ─── Auth ───────────────────────────────────────────
export async function registerUser(name: string, email: string, password: string) {
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) throw new Error('Email already registered');

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  await queryRun('INSERT INTO users (id, name, email, password_hash, email_verified) VALUES (?, ?, ?, ?, 0)', [id, name, email, hash]);
  await queryRun('INSERT INTO financial_profiles (id, user_id) VALUES (?, ?)', [uuid(), id]);

  return { id, name, email };
}

export async function loginUser(email: string, password: string) {
  const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) throw new Error('Invalid email or password');

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) throw new Error('Invalid email or password');

  if (user.status === 'blocked') throw new Error('Your account has been blocked by admin. Please contact support.');

  const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return { token, user: { id: user.id, name: user.name, email: user.email, is_demo: user.is_demo, avatar: user.avatar || null } };
}

export async function googleLogin(googleUser: { email: string; name: string; sub: string; picture?: string }) {
  let user = await queryOne('SELECT * FROM users WHERE email = ?', [googleUser.email]);

  if (!user) {
    const id = uuid();
    const hash = bcrypt.hashSync(googleUser.sub + '-google-oauth', 10);
    await queryRun('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)', [id, googleUser.name, googleUser.email, hash]);
    await queryRun('INSERT INTO financial_profiles (id, user_id) VALUES (?, ?)', [uuid(), id]);
    user = { id, name: googleUser.name, email: googleUser.email, is_demo: 0 };
  }

  if (user.status === 'blocked') throw new Error('Your account has been blocked by admin. Please contact support.');

  const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, name: user.name, email: user.email, is_demo: user.is_demo, avatar: user.avatar || null } };
}

export async function verifyToken(token: string): Promise<{ userId: string; name: string; email: string } | null> {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// Login user directly by email (used after OTP verification — password already validated at registration)
export async function loginUserByEmail(email: string) {
  const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) throw new Error('Account not found');
  if (user.status === 'blocked') throw new Error('Your account has been blocked by admin. Please contact support.');

  const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, name: user.name, email: user.email, is_demo: user.is_demo, avatar: user.avatar || null } };
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ww_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId || null;
}
