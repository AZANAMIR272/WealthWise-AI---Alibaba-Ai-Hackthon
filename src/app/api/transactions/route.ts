import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { queryAll, queryOne, queryRun } from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const category = searchParams.get('category');
    let query = `SELECT t.*, a.name as account_name FROM transactions t LEFT JOIN accounts a ON t.account_id = a.id WHERE t.user_id = ? AND t.status = 'confirmed'`;
    const params: any[] = [userId];

    if (month) {
      query += ` AND t.date LIKE ?`;
      params.push(`${month}%`);
    }
    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }
    query += ` ORDER BY t.date DESC, t.created_at DESC`;

    const txns = await queryAll(query, params);
    return NextResponse.json(txns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.type === 'import') {
      const transactions = body.transactions;
      if (!Array.isArray(transactions)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

      const ids: string[] = [];
      for (const t of transactions) {
        const id = uuid();
        await queryRun(`INSERT INTO transactions (id, user_id, account_id, type, amount, category, description, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, t.account_id || null, t.type || 'expense', t.amount, t.category || 'other', t.description || '', t.date, 'pending']);
        ids.push(id);
      }
      return NextResponse.json({ imported: ids.length, ids });
    }

    // Single transaction
    const { type, amount, category, description, date, account_id } = body;
    if (!amount || !category) return NextResponse.json({ error: 'Amount and category required' }, { status: 400 });

    const id = uuid();
    await queryRun(`INSERT INTO transactions (id, user_id, account_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, account_id || null, type || 'expense', amount, category, description || '', date || new Date().toISOString().split('T')[0]]);

    if (account_id) {
      const delta = type === 'income' || type === 'savings' ? amount : -amount;
      await queryRun(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`, [delta, account_id, userId]);
    }

    return NextResponse.json({ id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Look up transaction first to reverse balance
    const txn = await queryOne(`SELECT account_id, type, amount FROM transactions WHERE id = ? AND user_id = ?`, [id, userId]);
    if (txn?.account_id) {
      const delta = txn.type === 'income' || txn.type === 'savings' ? -txn.amount : txn.amount;
      await queryRun(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`, [delta, txn.account_id, userId]);
    }

    await queryRun(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [id, userId]);
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
