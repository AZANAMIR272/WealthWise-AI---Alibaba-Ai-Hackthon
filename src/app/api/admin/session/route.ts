import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isValidAdminName } from '@/lib/admin-config';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: Request) {
  try {
    const { tempToken, adminName } = await request.json();
    if (!tempToken || !adminName) return NextResponse.json({ error: 'Missing token or admin name' }, { status: 400 });

    // Validate temp token
    let payload: any;
    try {
      payload = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }
    if (payload.role !== 'admin-temp') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Validate the selected admin is one of the team members
    if (!isValidAdminName(adminName)) {
      return NextResponse.json({ error: 'Invalid admin selection' }, { status: 400 });
    }

    // Issue full admin session token (8 hours)
    const adminToken = jwt.sign({ role: 'admin', adminName }, JWT_SECRET, { expiresIn: '8h' });
    return NextResponse.json({ ok: true, adminToken, adminName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Session failed' }, { status: 500 });
  }
}
