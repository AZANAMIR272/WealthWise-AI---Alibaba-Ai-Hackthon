import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getAdminCredentials } from '@/lib/admin-config';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const creds = getAdminCredentials();
    if (email.trim().toLowerCase() !== creds.email.toLowerCase() || password !== creds.password) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Short-lived temp token — exchanged for full session after admin photo selection
    const tempToken = jwt.sign({ role: 'admin-temp' }, JWT_SECRET, { expiresIn: '10m' });
    return NextResponse.json({ ok: true, tempToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
