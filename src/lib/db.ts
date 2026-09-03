import { createClient, Client } from '@libsql/client';

let db: Client;
let schemaReady: Promise<void> | null = null;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    db = createClient({ url, authToken });
    schemaReady = initSchema();
  }
  return db;
}

async function initSchema() {
  const d = getDb();
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      currency TEXT DEFAULT 'PKR',
      is_demo INTEGER DEFAULT 0,
      monthly_income REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bank','cash','mobile_wallet','savings','investment','debt','credit')),
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'PKR',
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('income','expense','transfer','savings','debt_payment')),
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      description TEXT,
      date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      recurring_interval TEXT,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','pending','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','paused','cancelled')),
      monthly_required REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS financial_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      monthly_income REAL DEFAULT 0,
      monthly_fixed_expenses REAL DEFAULT 0,
      monthly_variable_expenses REAL DEFAULT 0,
      emergency_fund_target REAL DEFAULT 0,
      total_debt REAL DEFAULT 0,
      total_savings REAL DEFAULT 0,
      risk_tolerance TEXT DEFAULT 'moderate' CHECK(risk_tolerance IN ('conservative','moderate','aggressive')),
      employment_type TEXT DEFAULT 'salaried',
      dependents INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS upcoming_bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 1,
      category TEXT DEFAULT 'bills',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category)`,
    `CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)`,
    `CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_email TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  ];
  for (const sql of statements) {
    await d.execute(sql);
  }
  // Add new columns to existing users table (ignore error if column already exists)
  const alterations = [
    `ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`,
    `ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN otp_code TEXT`,
    `ALTER TABLE users ADD COLUMN otp_expires TEXT`,
    `ALTER TABLE users ADD COLUMN avatar TEXT`,
  ];
  for (const sql of alterations) {
    try { await d.execute(sql); } catch {}
  }
}

// Ensure schema is created before any query runs
async function ensureReady() {
  getDb(); // triggers init if needed
  if (schemaReady) await schemaReady;
}

// Helper: execute query and return rows
export async function queryAll(sql: string, args: any[] = []): Promise<any[]> {
  await ensureReady();
  const result = await getDb().execute({ sql, args });
  return result.rows;
}

export async function queryOne(sql: string, args: any[] = []): Promise<any | undefined> {
  const rows = await queryAll(sql, args);
  return rows[0];
}

export async function queryRun(sql: string, args: any[] = []): Promise<void> {
  await ensureReady();
  await getDb().execute({ sql, args });
}

export default getDb;
