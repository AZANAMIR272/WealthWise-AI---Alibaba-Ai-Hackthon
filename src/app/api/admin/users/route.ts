import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { queryAll, queryOne, queryRun } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || '';

function verifyAdminToken(token: string): { adminName: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.role !== 'admin' || !payload.adminName) return null;
    return { adminName: payload.adminName };
  } catch {
    return null;
  }
}

async function logAction(adminName: string, action: string, targetEmail: string | null, details: string) {
  await queryRun(
    'INSERT INTO admin_logs (id, admin_name, action, target_email, details) VALUES (?, ?, ?, ?, ?)',
    [uuid(), adminName, action, targetEmail, details]
  );
}

// GET — list all users with stats + recent admin logs
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const admin = verifyAdminToken(token);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await queryAll(`
      SELECT u.id, u.name, u.email, u.status, u.is_demo, u.email_verified, u.created_at,
        (SELECT COUNT(*) FROM accounts a WHERE a.user_id = u.id) as accounts_count,
        (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) as transactions_count,
        (SELECT COALESCE(SUM(CASE WHEN a.type NOT IN ('debt','credit') THEN a.balance ELSE 0 END), 0)
          FROM accounts a WHERE a.user_id = u.id) as total_balance
      FROM users u
      ORDER BY u.created_at DESC
    `);

    const logs = await queryAll(`
      SELECT admin_name, action, target_email, details, created_at
      FROM admin_logs ORDER BY created_at DESC LIMIT 20
    `);

    return NextResponse.json({
      adminName: admin.adminName,
      users,
      logs,
      stats: {
        total: users.length,
        active: users.filter((u: any) => u.status !== 'blocked').length,
        blocked: users.filter((u: any) => u.status === 'blocked').length,
        totalBalance: users.reduce((sum: number, u: any) => sum + (u.total_balance || 0), 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load users' }, { status: 500 });
  }
}

// POST — block / unblock / delete user
export async function POST(request: Request) {
  try {
    const { adminToken, action, userId } = await request.json();
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!action || !userId) return NextResponse.json({ error: 'Action and userId required' }, { status: 400 });

    const user = await queryOne('SELECT id, name, email, status FROM users WHERE id = ?', [userId]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'block') {
      if (user.status === 'blocked') return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
      await queryRun('UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['blocked', userId]);
      await logAction(admin.adminName, 'block', user.email, `Blocked ${user.name} (${user.email})`);
      return NextResponse.json({ ok: true, message: `${user.name} blocked successfully` });
    }

    if (action === 'unblock') {
      if (user.status !== 'blocked') return NextResponse.json({ error: 'User is not blocked' }, { status: 400 });
      await queryRun('UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['active', userId]);
      await logAction(admin.adminName, 'unblock', user.email, `Unblocked ${user.name} (${user.email})`);
      return NextResponse.json({ ok: true, message: `${user.name} unblocked successfully` });
    }

    if (action === 'delete') {
      // Delete related data first (FK cascade may not be enforced)
      await queryRun('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await queryRun('DELETE FROM accounts WHERE user_id = ?', [userId]);
      await queryRun('DELETE FROM goals WHERE user_id = ?', [userId]);
      await queryRun('DELETE FROM financial_profiles WHERE user_id = ?', [userId]);
      await queryRun('DELETE FROM upcoming_bills WHERE user_id = ?', [userId]);
      await queryRun('DELETE FROM users WHERE id = ?', [userId]);
      await logAction(admin.adminName, 'delete', user.email, `Deleted ${user.name} (${user.email}) and all their data`);
      return NextResponse.json({ ok: true, message: `${user.name} deleted successfully` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
