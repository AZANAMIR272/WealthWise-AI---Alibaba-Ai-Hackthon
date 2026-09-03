import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { queryAll, queryRun } from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const goals = await queryAll(`SELECT * FROM goals WHERE user_id = ? ORDER BY priority DESC, deadline ASC`, [userId]);
    return NextResponse.json(goals);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, target_amount, current_amount, deadline, priority } = await request.json();
    if (!name || !target_amount) return NextResponse.json({ error: 'Name and target required' }, { status: 400 });

    const id = uuid();
    await queryRun(`INSERT INTO goals (id, user_id, name, target_amount, current_amount, deadline, priority) VALUES (?,?,?,?,?,?,?)`,
      [id, userId, name, target_amount, current_amount || 0, deadline || null, priority || 'medium']);
    return NextResponse.json({ id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
