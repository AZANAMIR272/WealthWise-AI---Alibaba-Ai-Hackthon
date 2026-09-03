import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://wealthwise-ai-azanamir.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTU5NDUwMjgsImlhdCI6MTc4ODE2OTAyOCwiaWQiOiIwMWEwNTcyZC03MDAxLTdlOTgtYThjMS02MmE2OGZiNzMyYWEiLCJraWQiOiItUmZ4QkpXU0NsVWt3dEJEMXBvWnlQMUVBcVNPZkM3MFhzNlRKSl9mS2ZvIiwicmlkIjoiNTc3MjNhNTgtYjhmMS00Y2Y1LWEyNjgtNmZiMGNiODc1ZmQxIn0.mpE9nYLus6zHgOSlo4e6W3jEn4dl7aa6Wj1iXzXpkIwXLeCaDqlimG5VaFq4rXE91y9sFWAezN40ohsrBcTXAg',
});

const email = 'owais34@gmail';

// 1. All admin_logs mentioning this email
const logs = await db.execute({
  sql: `SELECT * FROM admin_logs WHERE target_email LIKE ? OR details LIKE ? ORDER BY created_at DESC`,
  args: [`%${email}%`, `%${email}%`],
});
console.log('=== ADMIN LOGS for', email, '===');
if (logs.rows.length === 0) console.log('(no admin actions found)');
for (const row of logs.rows) {
  console.log(`[${row.created_at}] ${row.admin_name} → ${row.action} → ${row.target_email} | ${row.details || ''}`);
}

// 2. The user record itself
const user = await db.execute({
  sql: `SELECT id, name, email, is_demo, status, email_verified, created_at, updated_at FROM users WHERE email LIKE ?`,
  args: [`%${email}%`],
});
console.log('\n=== USER RECORD ===');
if (user.rows.length === 0) console.log('(no such user found)');
for (const row of user.rows) {
  console.log(JSON.stringify(row, null, 2));
}

// 3. Full admin_logs (all actions, to see overall history)
const allLogs = await db.execute(`SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50`);
console.log('\n=== ALL ADMIN LOGS (last 50) ===');
if (allLogs.rows.length === 0) console.log('(admin_logs table is empty — no admin actions ever recorded)');
for (const row of allLogs.rows) {
  console.log(`[${row.created_at}] ${row.admin_name} → ${row.action} → ${row.target_email} | ${row.details || ''}`);
}

process.exit(0);
