import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, queryRun } from './db';

const DEMO_USER_ID = 'demo-user-ahmed-khan';
const DEMO_EMAIL = 'demo@wealthwise.pk';

export async function isDemoSeeded(): Promise<boolean> {
  const user = await queryOne('SELECT id FROM users WHERE id = ?', [DEMO_USER_ID]);
  if (!user) return false;
  const accts = await queryOne('SELECT COUNT(*) as count FROM accounts WHERE user_id = ?', [DEMO_USER_ID]);
  return !!accts && accts.count > 0;
}

export async function seedDemoData(): Promise<void> {
  if (await isDemoSeeded()) return;
  const uid = DEMO_USER_ID;
  const hash = bcrypt.hashSync('demo123', 10);

  // Create demo user
  await queryRun(`INSERT OR IGNORE INTO users (id, name, email, password_hash, currency, is_demo, monthly_income) VALUES (?, ?, ?, ?, 'PKR', 1, 250000)`, [uid, 'Ahmed Khan', DEMO_EMAIL, hash]);

  // Accounts
  const accounts = [
    { id: uuid(), name: 'HBL Salary Account', type: 'bank', balance: 187500, primary: 1 },
    { id: uuid(), name: 'Meezan Savings', type: 'savings', balance: 420000, primary: 0 },
    { id: uuid(), name: 'JazzCash', type: 'mobile_wallet', balance: 12800, primary: 0 },
    { id: uuid(), name: 'Cash Wallet', type: 'cash', balance: 8500, primary: 0 },
    { id: uuid(), name: 'PSX Investment', type: 'investment', balance: 350000, primary: 0 },
    { id: uuid(), name: 'Car Loan - Bank Alfalah', type: 'debt', balance: -680000, primary: 0 },
  ];
  const acctMap: Record<string, string> = {};
  for (const a of accounts) {
    await queryRun(`INSERT OR IGNORE INTO accounts (id, user_id, name, type, balance, is_primary) VALUES (?,?,?,?,?,?)`, [a.id, uid, a.name, a.type, a.balance, a.primary]);
    acctMap[a.name] = a.id;
  }

  // Financial profile
  await queryRun(`INSERT OR IGNORE INTO financial_profiles (id, user_id, monthly_income, monthly_fixed_expenses, monthly_variable_expenses, emergency_fund_target, total_debt, total_savings, risk_tolerance, employment_type, dependents) VALUES (?, ?, 250000, 95000, 52000, 450000, 680000, 770000, 'moderate', 'salaried', 3)`, [uuid(), uid]);

  // Generate 3 months of realistic transactions
  const now = new Date();
  const txns: any[][] = [];

  const monthlyRecurring = [
    { type: 'income' as const, amount: 250000, cat: 'income', desc: 'Monthly Salary - Tech Corp', acct: 'HBL Salary Account', day: 1 },
    { type: 'income' as const, amount: 35000, cat: 'income', desc: 'Freelance Project Payment', acct: 'HBL Salary Account', day: 15 },
    { type: 'expense' as const, amount: 35000, cat: 'housing', desc: 'House Rent - DHA Phase 5', acct: 'HBL Salary Account', day: 5 },
    { type: 'expense' as const, amount: 8500, cat: 'bills', desc: 'LESCO Electricity Bill', acct: 'HBL Salary Account', day: 10 },
    { type: 'expense' as const, amount: 3200, cat: 'bills', desc: 'PTCL Internet Bill', acct: 'HBL Salary Account', day: 10 },
    { type: 'expense' as const, amount: 1800, cat: 'bills', desc: 'Sui Gas Bill', acct: 'HBL Salary Account', day: 12 },
    { type: 'expense' as const, amount: 1200, cat: 'bills', desc: 'Mobile - Zong Postpaid', acct: 'JazzCash', day: 8 },
    { type: 'expense' as const, amount: 22000, cat: 'debt', desc: 'Car Loan EMI - Bank Alfalah', acct: 'HBL Salary Account', day: 5 },
    { type: 'expense' as const, amount: 12000, cat: 'education', desc: "Children's School Fee - Beaconhouse", acct: 'HBL Salary Account', day: 3 },
    { type: 'expense' as const, amount: 18500, cat: 'food', desc: 'Monthly Groceries - Metro/Al-Fatah', acct: 'HBL Salary Account', day: 7 },
    { type: 'expense' as const, amount: 6500, cat: 'food', desc: 'Dining Out - Family Restaurants', acct: 'Cash Wallet', day: 20 },
    { type: 'expense' as const, amount: 8000, cat: 'transport', desc: 'Fuel - PSO Petrol', acct: 'HBL Salary Account', day: 14 },
    { type: 'expense' as const, amount: 3500, cat: 'transport', desc: 'Uber/Careem Rides', acct: 'JazzCash', day: 25 },
    { type: 'expense' as const, amount: 4500, cat: 'healthcare', desc: 'Medical / Pharmacy', acct: 'Cash Wallet', day: 18 },
    { type: 'expense' as const, amount: 5000, cat: 'entertainment', desc: 'Entertainment & Subscriptions', acct: 'JazzCash', day: 22 },
    { type: 'savings' as const, amount: 25000, cat: 'savings', desc: 'Monthly Savings Transfer', acct: 'Meezan Savings', day: 2 },
    { type: 'savings' as const, amount: 10000, cat: 'savings', desc: 'PSX Mutual Fund SIP', acct: 'PSX Investment', day: 5 },
  ];

  const extraTxns = [
    { type: 'expense' as const, amount: 3200, cat: 'shopping', desc: 'Daraz Online Shopping', acct: 'JazzCash', daysAgo: 5 },
    { type: 'expense' as const, amount: 7500, cat: 'shopping', desc: 'Clothing - Gul Ahmed', acct: 'HBL Salary Account', daysAgo: 12 },
    { type: 'expense' as const, amount: 2800, cat: 'food', desc: 'Foodpanda Orders', acct: 'JazzCash', daysAgo: 3 },
    { type: 'expense' as const, amount: 1500, cat: 'entertainment', desc: 'Cinema - Nueplex', acct: 'Cash Wallet', daysAgo: 8 },
    { type: 'income' as const, amount: 15000, cat: 'income', desc: 'Freelance Bonus', acct: 'HBL Salary Account', daysAgo: 10 },
    { type: 'expense' as const, amount: 4200, cat: 'healthcare', desc: 'Doctor Visit - Aga Khan', acct: 'HBL Salary Account', daysAgo: 15 },
    { type: 'expense' as const, amount: 2500, cat: 'transport', desc: 'Car Maintenance - Indus Motors', acct: 'HBL Salary Account', daysAgo: 20 },
    { type: 'expense' as const, amount: 8500, cat: 'shopping', desc: 'Electronics - Samsung Earbuds', acct: 'HBL Salary Account', daysAgo: 25 },
  ];

  for (let m = 0; m < 3; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    for (const r of monthlyRecurring) {
      const d = new Date(year, month, Math.min(r.day, 28));
      if (d > now) continue;
      const variance = r.type === 'expense' ? (Math.random() * 0.1 - 0.05) : 0;
      const amt = Math.round(r.amount * (1 + variance));
      txns.push([uuid(), uid, acctMap[r.acct], r.type, amt, r.cat, r.desc, d.toISOString().split('T')[0], 1, 'confirmed']);
    }
  }

  for (const e of extraTxns) {
    const d = new Date(now.getTime() - e.daysAgo * 86400000);
    txns.push([uuid(), uid, acctMap[e.acct], e.type, e.amount, e.cat, e.desc, d.toISOString().split('T')[0], 0, 'confirmed']);
  }

  for (const t of txns) {
    await queryRun(`INSERT OR IGNORE INTO transactions (id, user_id, account_id, type, amount, category, description, date, is_recurring, status) VALUES (?,?,?,?,?,?,?,?,?,?)`, t);
  }

  // Goals
  const goals = [
    { name: 'Emergency Fund', target: 500000, current: 320000, deadline: '2026-12-31', priority: 'high' },
    { name: "Umrah Trip - Family", target: 450000, current: 120000, deadline: '2027-03-01', priority: 'high' },
    { name: "Daughter's University Fund", target: 2000000, current: 450000, deadline: '2032-06-01', priority: 'critical' },
    { name: 'New Car Down Payment', target: 800000, current: 150000, deadline: '2027-06-01', priority: 'medium' },
    { name: 'Home Renovation', target: 300000, current: 45000, deadline: '2026-11-01', priority: 'low' },
  ];
  for (const g of goals) {
    await queryRun(`INSERT OR IGNORE INTO goals (id, user_id, name, target_amount, current_amount, deadline, priority) VALUES (?,?,?,?,?,?,?)`, [uuid(), uid, g.name, g.target, g.current, g.deadline, g.priority]);
  }

  // Upcoming bills
  const bills = [
    { name: 'House Rent', amount: 35000, due: getUpcomingDay(5), cat: 'housing' },
    { name: 'LESCO Electricity', amount: 9200, due: getUpcomingDay(10), cat: 'bills' },
    { name: 'Internet Bill', amount: 3200, due: getUpcomingDay(10), cat: 'bills' },
    { name: 'Car Loan EMI', amount: 22000, due: getUpcomingDay(5), cat: 'debt' },
    { name: 'School Fee', amount: 12000, due: getUpcomingDay(3), cat: 'education' },
    { name: 'Gas Bill', amount: 2100, due: getUpcomingDay(12), cat: 'bills' },
    { name: 'Mobile Postpaid', amount: 1200, due: getUpcomingDay(8), cat: 'bills' },
  ];
  for (const b of bills) {
    await queryRun(`INSERT OR IGNORE INTO upcoming_bills (id, user_id, name, amount, due_date, is_recurring, category) VALUES (?,?,?,?,?,?,?)`, [uuid(), uid, b.name, b.amount, b.due, 1, b.cat]);
  }
}

function getUpcomingDay(dayOfMonth: number): string {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (target <= now) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
  }
  return target.toISOString().split('T')[0];
}

export function getDemoUserId(): string {
  return DEMO_USER_ID;
}

export function getDemoEmail(): string {
  return DEMO_EMAIL;
}

function vary(base: number, pct = 0.2): number {
  return Math.round(base * (1 + (Math.random() * 2 - 1) * pct));
}

function firstName(fullName: string): string {
  return (fullName || 'User').split(' ')[0];
}

export async function seedUserData(userId: string, userName: string): Promise<void> {
  const uid = userId;
  const fn = firstName(userName);

  // --- Accounts ---
  const existingAccounts = await queryOne('SELECT COUNT(*) as count FROM accounts WHERE user_id = ?', [uid]);
  if (!existingAccounts || existingAccounts.count === 0) {
    const salaryInc = vary(250000);
    await queryRun('INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)', [uid, userName, '', '']);
    await queryRun('UPDATE users SET currency = ?, monthly_income = ? WHERE id = ?', ['PKR', salaryInc, uid]);

    const accounts = [
      { id: uuid(), name: `${fn}'s Salary Account`, type: 'bank', balance: vary(187500), primary: 1 },
      { id: uuid(), name: `${fn}'s Savings`, type: 'savings', balance: vary(420000), primary: 0 },
      { id: uuid(), name: 'JazzCash', type: 'mobile_wallet', balance: vary(12800), primary: 0 },
      { id: uuid(), name: 'Cash Wallet', type: 'cash', balance: vary(8500), primary: 0 },
      { id: uuid(), name: 'PSX Investment', type: 'investment', balance: vary(350000), primary: 0 },
      { id: uuid(), name: 'Car Loan', type: 'debt', balance: vary(-680000, 0.1), primary: 0 },
    ];
    const acctMap: Record<string, string> = {};
    for (const a of accounts) {
      await queryRun('INSERT OR IGNORE INTO accounts (id, user_id, name, type, balance, is_primary) VALUES (?,?,?,?,?,?)', [a.id, uid, a.name, a.type, a.balance, a.primary]);
      acctMap[a.name] = a.id;
    }

    // --- Financial Profile ---
    const mIncome = salaryInc;
    const mFixed = vary(95000);
    const mVar = vary(52000);
    const eTarget = vary(450000);
    const tDebt = vary(680000, 0.1);
    const tSavings = vary(770000);
    await queryRun(`INSERT INTO financial_profiles (id, user_id, monthly_income, monthly_fixed_expenses, monthly_variable_expenses, emergency_fund_target, total_debt, total_savings, risk_tolerance, employment_type, dependents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'moderate', 'salaried', 3)
      ON CONFLICT(user_id) DO UPDATE SET monthly_income=excluded.monthly_income, monthly_fixed_expenses=excluded.monthly_fixed_expenses, monthly_variable_expenses=excluded.monthly_variable_expenses, emergency_fund_target=excluded.emergency_fund_target, total_debt=excluded.total_debt, total_savings=excluded.total_savings, risk_tolerance='moderate', employment_type='salaried', dependents=3`,
      [uuid(), uid, mIncome, mFixed, mVar, eTarget, tDebt, tSavings]);

    // --- Transactions (3 months) ---
    const now = new Date();
    const monthlyRecurring = [
      { type: 'income' as const, amount: salaryInc, cat: 'income', desc: 'Monthly Salary', acct: `${fn}'s Salary Account`, day: 1 },
      { type: 'income' as const, amount: vary(35000), cat: 'income', desc: 'Freelance Payment', acct: `${fn}'s Salary Account`, day: 15 },
      { type: 'expense' as const, amount: vary(35000), cat: 'housing', desc: 'House Rent', acct: `${fn}'s Salary Account`, day: 5 },
      { type: 'expense' as const, amount: vary(8500), cat: 'bills', desc: 'Electricity Bill', acct: `${fn}'s Salary Account`, day: 10 },
      { type: 'expense' as const, amount: vary(3200), cat: 'bills', desc: 'Internet Bill', acct: `${fn}'s Salary Account`, day: 10 },
      { type: 'expense' as const, amount: vary(1800), cat: 'bills', desc: 'Gas Bill', acct: `${fn}'s Salary Account`, day: 12 },
      { type: 'expense' as const, amount: vary(1200), cat: 'bills', desc: 'Mobile Postpaid', acct: 'JazzCash', day: 8 },
      { type: 'expense' as const, amount: vary(22000), cat: 'debt', desc: 'Car Loan EMI', acct: `${fn}'s Salary Account`, day: 5 },
      { type: 'expense' as const, amount: vary(12000), cat: 'education', desc: 'School Fee', acct: `${fn}'s Salary Account`, day: 3 },
      { type: 'expense' as const, amount: vary(18500), cat: 'food', desc: 'Monthly Groceries', acct: `${fn}'s Salary Account`, day: 7 },
      { type: 'expense' as const, amount: vary(6500), cat: 'food', desc: 'Dining Out', acct: 'Cash Wallet', day: 20 },
      { type: 'expense' as const, amount: vary(8000), cat: 'transport', desc: 'Fuel', acct: `${fn}'s Salary Account`, day: 14 },
      { type: 'expense' as const, amount: vary(3500), cat: 'transport', desc: 'Ride Sharing', acct: 'JazzCash', day: 25 },
      { type: 'expense' as const, amount: vary(4500), cat: 'healthcare', desc: 'Medical / Pharmacy', acct: 'Cash Wallet', day: 18 },
      { type: 'expense' as const, amount: vary(5000), cat: 'entertainment', desc: 'Entertainment & Subscriptions', acct: 'JazzCash', day: 22 },
      { type: 'savings' as const, amount: vary(25000), cat: 'savings', desc: 'Monthly Savings Transfer', acct: `${fn}'s Savings`, day: 2 },
      { type: 'savings' as const, amount: vary(10000), cat: 'savings', desc: 'Mutual Fund SIP', acct: 'PSX Investment', day: 5 },
    ];
    const extraTxns = [
      { type: 'expense' as const, amount: vary(3200), cat: 'shopping', desc: 'Online Shopping', acct: 'JazzCash', daysAgo: 5 },
      { type: 'expense' as const, amount: vary(7500), cat: 'shopping', desc: 'Clothing', acct: `${fn}'s Salary Account`, daysAgo: 12 },
      { type: 'expense' as const, amount: vary(2800), cat: 'food', desc: 'Food Delivery', acct: 'JazzCash', daysAgo: 3 },
      { type: 'expense' as const, amount: vary(1500), cat: 'entertainment', desc: 'Cinema', acct: 'Cash Wallet', daysAgo: 8 },
      { type: 'income' as const, amount: vary(15000), cat: 'income', desc: 'Freelance Bonus', acct: `${fn}'s Salary Account`, daysAgo: 10 },
      { type: 'expense' as const, amount: vary(4200), cat: 'healthcare', desc: 'Doctor Visit', acct: `${fn}'s Salary Account`, daysAgo: 15 },
      { type: 'expense' as const, amount: vary(2500), cat: 'transport', desc: 'Car Maintenance', acct: `${fn}'s Salary Account`, daysAgo: 20 },
      { type: 'expense' as const, amount: vary(8500), cat: 'shopping', desc: 'Electronics', acct: `${fn}'s Salary Account`, daysAgo: 25 },
    ];

    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      for (const r of monthlyRecurring) {
        const d = new Date(year, month, Math.min(r.day, 28));
        if (d > now) continue;
        const amt = vary(r.amount, 0.05);
        await queryRun('INSERT OR IGNORE INTO transactions (id, user_id, account_id, type, amount, category, description, date, is_recurring, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [uuid(), uid, acctMap[r.acct] || null, r.type, amt, r.cat, r.desc, d.toISOString().split('T')[0], 1, 'confirmed']);
      }
    }
    for (const e of extraTxns) {
      const d = new Date(now.getTime() - e.daysAgo * 86400000);
      await queryRun('INSERT OR IGNORE INTO transactions (id, user_id, account_id, type, amount, category, description, date, is_recurring, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [uuid(), uid, acctMap[e.acct] || null, e.type, e.amount, e.cat, e.desc, d.toISOString().split('T')[0], 0, 'confirmed']);
    }

    // --- Goals ---
    const goals = [
      { name: 'Emergency Fund', target: vary(500000), current: vary(320000), deadline: '2026-12-31', priority: 'high' },
      { name: 'Family Trip', target: vary(450000), current: vary(120000), deadline: '2027-03-01', priority: 'high' },
      { name: 'Education Fund', target: vary(2000000), current: vary(450000), deadline: '2032-06-01', priority: 'critical' },
      { name: 'New Car', target: vary(800000), current: vary(150000), deadline: '2027-06-01', priority: 'medium' },
      { name: 'Home Renovation', target: vary(300000), current: vary(45000), deadline: '2026-11-01', priority: 'low' },
    ];
    for (const g of goals) {
      await queryRun('INSERT OR IGNORE INTO goals (id, user_id, name, target_amount, current_amount, deadline, priority) VALUES (?,?,?,?,?,?,?)',
        [uuid(), uid, g.name, g.target, g.current, g.deadline, g.priority]);
    }

    // --- Upcoming Bills ---
    const bills = [
      { name: 'House Rent', amount: vary(35000), due: getUpcomingDay(5), cat: 'housing' },
      { name: 'Electricity', amount: vary(9200), due: getUpcomingDay(10), cat: 'bills' },
      { name: 'Internet', amount: vary(3200), due: getUpcomingDay(10), cat: 'bills' },
      { name: 'Loan EMI', amount: vary(22000), due: getUpcomingDay(5), cat: 'debt' },
      { name: 'School Fee', amount: vary(12000), due: getUpcomingDay(3), cat: 'education' },
      { name: 'Gas Bill', amount: vary(2100), due: getUpcomingDay(12), cat: 'bills' },
      { name: 'Mobile', amount: vary(1200), due: getUpcomingDay(8), cat: 'bills' },
    ];
    for (const b of bills) {
      await queryRun('INSERT OR IGNORE INTO upcoming_bills (id, user_id, name, amount, due_date, is_recurring, category) VALUES (?,?,?,?,?,?,?)',
        [uuid(), uid, b.name, b.amount, b.due, 1, b.cat]);
    }
  }
}
