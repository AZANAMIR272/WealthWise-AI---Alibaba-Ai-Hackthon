import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { queryAll, queryOne, queryRun } from '@/lib/db';
import { v4 as uuid } from 'uuid';

const VALID_TYPES = ['bank', 'cash', 'mobile_wallet', 'savings', 'investment', 'debt', 'credit'];

// GET — list all accounts for current user
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await queryAll(
      `SELECT * FROM accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at ASC`,
      [userId]
    );
    return NextResponse.json(accounts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create new account
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, type, balance } = await request.json();
    if (!name) return NextResponse.json({ error: 'Account name required' }, { status: 400 });
    if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });

    const id = uuid();
    await queryRun(
      `INSERT INTO accounts (id, user_id, name, type, balance, is_primary) VALUES (?, ?, ?, ?, ?, 0)`,
      [id, userId, name, type, balance || 0]
    );

    return NextResponse.json({ id, name, type, balance: balance || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — update account
export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, type, balance } = await request.json();
    if (!id) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    // Verify ownership
    const existing = await queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      updates.push('type = ?');
      params.push(type);
    }
    if (balance !== undefined) { updates.push('balance = ?'); params.push(balance); }

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    params.push(id, userId);
    await queryRun(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);

    return NextResponse.json({ updated: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove account (and its transactions)
export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    // Verify ownership
    const existing = await queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    // Delete transactions linked to this account
    await queryRun('DELETE FROM transactions WHERE account_id = ? AND user_id = ?', [id, userId]);
    // Delete the account
    await queryRun('DELETE FROM accounts WHERE id = ? AND user_id = ?', [id, userId]);

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
