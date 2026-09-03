import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { queryOne, queryRun } from '@/lib/db';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await queryOne(
      'SELECT id, name, email, avatar, created_at, monthly_income, currency FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      createdAt: user.created_at,
      monthlyIncome: user.monthly_income || 0,
      currency: user.currency || 'PKR',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, avatar } = await request.json();

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
        return NextResponse.json({ error: 'Name must be 2-50 characters' }, { status: 400 });
      }
    }

    // Validate avatar format if provided: "emoji|gradientIndex"
    if (avatar !== undefined && avatar !== null) {
      if (typeof avatar !== 'string' || avatar.length > 20) {
        return NextResponse.json({ error: 'Invalid avatar' }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const args: any[] = [];
    if (name !== undefined) { updates.push('name = ?'); args.push(name.trim()); }
    if (avatar !== undefined) { updates.push('avatar = ?'); args.push(avatar); }
    if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    updates.push("updated_at = datetime('now')");
    args.push(userId);
    await queryRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args);

    const user = await queryOne('SELECT id, name, email, avatar FROM users WHERE id = ?', [userId]);
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
