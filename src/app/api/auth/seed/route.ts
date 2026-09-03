import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { seedUserData } from '@/lib/demo-data';
import { queryOne } from '@/lib/db';

// POST — manually load sample data for current user
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user name for personalized data
    const user = await queryOne('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = user?.name || 'User';

    await seedUserData(userId, userName);

    return NextResponse.json({ success: true, message: 'Sample data loaded!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
