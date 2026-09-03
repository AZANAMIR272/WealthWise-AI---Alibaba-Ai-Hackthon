import { queryAll, queryOne } from './db';

// ==================== TYPES ====================
export interface FinancialSnapshot {
  totalBalance: number;
  liquidBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  monthlyDebtPayments: number;
  savingsRate: number;
  emergencyReserve: number;
  emergencyMonths: number;
  totalDebt: number;
  totalAssets: number;
  netWorth: number;
  debtToIncome: number;
  healthScore: number;
  healthFactors: HealthFactor[];
  categoryBreakdown: CategorySpend[];
  cashFlowHistory: CashFlowPoint[];
}

export interface HealthFactor {
  name: string;
  score: number;
  maxScore: number;
  status: 'healthy' | 'warning' | 'critical';
  explanation: string;
}

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  balance: number;
}

export interface SimulationResult {
  scenario: string;
  currentHealth: number;
  projectedHealth: number;
  currentBalance: number;
  projectedBalance: number;
  currentEmergencyMonths: number;
  projectedEmergencyMonths: number;
  currentRisk: string;
  projectedRisk: string;
  currentSavingsRate: number;
  projectedSavingsRate: number;
  impactSummary: ImpactItem[];
  timeline: SimTimeline[];
  recommendation: string;
  explanation: string;
  warnings: string[];
}

export interface ImpactItem {
  metric: string;
  before: string;
  after: string;
  change: 'positive' | 'negative' | 'neutral';
  detail: string;
}

export interface SimTimeline {
  month: string;
  balance: number;
  savings: number;
  projected: boolean;
}

export interface StressTestResult {
  scenario: string;
  stabilityScore: number;
  shortfall: number;
  emergencyFundImpact: string;
  survivalMonths: number;
  recoveryTime: string;
  recommendedBuffer: number;
  details: string[];
  actions: string[];
}

export interface RiskItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  why: string;
  action: string;
  metric?: string;
}

export interface GoalAnalysis {
  id: string;
  name: string;
  target: number;
  current: number;
  progress: number;
  deadline: string;
  monthlyRequired: number;
  monthlyAvailable: number;
  status: 'achievable' | 'at_risk' | 'unrealistic' | 'completed';
  monthsRemaining: number;
  explanation: string;
  alternativePlan?: string;
}

export interface SafeToSpend {
  today: number;
  thisWeek: number;
  thisMonth: number;
  breakdown: {
    label: string;
    amount: number;
    type: 'positive' | 'negative';
  }[];
  explanation: string;
}

export interface CashFlowProjection {
  months: ProjectionMonth[];
  summary: string;
}

export interface ProjectionMonth {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  endingBalance: number;
  projected: boolean;
  events: string[];
}

// ==================== UTILITY ====================
const CATEGORIES = ['food','transport','shopping','bills','housing','education','healthcare','entertainment','travel','income','savings','debt','transfers','other'];

async function getMonthTransactions(userId: string, monthsBack: number = 1): Promise<any[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  return queryAll(`SELECT * FROM transactions WHERE user_id = ? AND date >= ? AND status = 'confirmed' ORDER BY date DESC`, [userId, cutoff.toISOString().split('T')[0]]);
}

async function getAllTransactions(userId: string): Promise<any[]> {
  return queryAll(`SELECT * FROM transactions WHERE user_id = ? AND status = 'confirmed' ORDER BY date DESC`, [userId]);
}

async function getAccounts(userId: string): Promise<any[]> {
  return queryAll(`SELECT * FROM accounts WHERE user_id = ?`, [userId]);
}

async function getGoals(userId: string): Promise<any[]> {
  return queryAll(`SELECT * FROM goals WHERE user_id = ? AND status = 'active'`, [userId]);
}

async function getUpcomingBills(userId: string): Promise<any[]> {
  return queryAll(`SELECT * FROM upcoming_bills WHERE user_id = ? ORDER BY due_date ASC`, [userId]);
}

async function getProfile(userId: string): Promise<any> {
  return queryOne(`SELECT * FROM financial_profiles WHERE user_id = ?`, [userId]);
}

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

function daysInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function remainingDaysInMonth(): number {
  const now = new Date();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return total - now.getDate() + 1;
}

function monthsBetween(d1: string, d2: string): number {
  const a = new Date(d1), b = new Date(d2);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (30.44 * 86400000)));
}

// ==================== FINANCIAL SNAPSHOT ====================
export async function getFinancialSnapshot(userId: string): Promise<FinancialSnapshot> {
  const accounts = await getAccounts(userId);
  const txns3m = await getMonthTransactions(userId, 3);
  const profile = await getProfile(userId);

  const totalBalance = accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const liquidBalance = accounts
    .filter((a: any) => ['bank', 'cash', 'mobile_wallet'].includes(a.type))
    .reduce((s: number, a: any) => s + Math.max(0, a.balance || 0), 0);
  const savingsBalance = accounts
    .filter((a: any) => ['savings', 'investment'].includes(a.type))
    .reduce((s: number, a: any) => s + Math.max(0, a.balance || 0), 0);
  const debtBalance = Math.abs(accounts
    .filter((a: any) => ['debt', 'credit'].includes(a.type))
    .reduce((s: number, a: any) => s + (a.balance || 0), 0));

  // Calculate averages from last 3 months
  const incomeTxns = txns3m.filter((t: any) => t.type === 'income');
  const expenseTxns = txns3m.filter((t: any) => t.type === 'expense');
  const savingsTxns = txns3m.filter((t: any) => t.type === 'savings');
  const debtTxns = txns3m.filter((t: any) => t.type === 'debt_payment' || t.category === 'debt');

  const monthsWithData = Math.max(1, Math.min(3, Math.ceil(txns3m.length > 0 ? 3 : 1)));
  const monthlyIncome = profile?.monthly_income || (incomeTxns.reduce((s: number, t: any) => s + t.amount, 0) / monthsWithData);
  const monthlyExpenses = expenseTxns.reduce((s: number, t: any) => s + t.amount, 0) / monthsWithData;
  const monthlySavings = savingsTxns.reduce((s: number, t: any) => s + t.amount, 0) / monthsWithData;
  const monthlyDebt = debtTxns.reduce((s: number, t: any) => s + t.amount, 0) / monthsWithData;

  const savingsRate = monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100) : 0;
  const emergencyReserve = savingsBalance;
  const emergencyMonths = monthlyExpenses > 0 ? (emergencyReserve / monthlyExpenses) : 0;
  const debtToIncome = monthlyIncome > 0 ? ((debtBalance / (monthlyIncome * 12)) * 100) : 0;
  const totalAssets = accounts.filter((a: any) => a.balance > 0).reduce((s: number, a: any) => s + a.balance, 0);
  const netWorth = totalAssets - debtBalance;

  // Category breakdown
  const catMap = new Map<string, number>();
  expenseTxns.forEach((t: any) => catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount));
  const totalCatSpend = Array.from(catMap.values()).reduce((a, b) => a + b, 0);
  const categoryBreakdown: CategorySpend[] = Array.from(catMap.entries())
    .map(([cat, amt]) => ({
      category: cat,
      amount: Math.round(amt / monthsWithData),
      percentage: totalCatSpend > 0 ? Math.round((amt / totalCatSpend) * 100) : 0,
      trend: 'stable' as const,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Health Score Calculation
  const healthFactors = calculateHealthFactors({
    savingsRate, emergencyMonths, debtToIncome, monthlyIncome,
    monthlyExpenses, monthlySavings, netWorth, totalAssets, debtBalance, liquidBalance
  });

  const healthScore = healthFactors.reduce((s, f) => s + f.score, 0);

  // Cash flow history
  const cashFlowHistory = await buildCashFlowHistory(userId, 6);

  return {
    totalBalance: Math.round(totalBalance),
    liquidBalance: Math.round(liquidBalance),
    monthlyIncome: Math.round(monthlyIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    monthlySavings: Math.round(monthlySavings),
    monthlyDebtPayments: Math.round(monthlyDebt),
    savingsRate: Math.round(savingsRate * 10) / 10,
    emergencyReserve: Math.round(emergencyReserve),
    emergencyMonths: Math.round(emergencyMonths * 10) / 10,
    totalDebt: Math.round(debtBalance),
    totalAssets: Math.round(totalAssets),
    netWorth: Math.round(netWorth),
    debtToIncome: Math.round(debtToIncome * 10) / 10,
    healthScore: Math.min(100, Math.max(0, healthScore)),
    healthFactors,
    categoryBreakdown,
    cashFlowHistory,
  };
}

function calculateHealthFactors(d: Record<string, number>): HealthFactor[] {
  const factors: HealthFactor[] = [];

  // Savings Rate (0-25 points)
  const savScore = d.savingsRate >= 30 ? 25 : d.savingsRate >= 20 ? 20 : d.savingsRate >= 10 ? 15 : d.savingsRate >= 5 ? 10 : 5;
  factors.push({
    name: 'Savings Rate',
    score: savScore,
    maxScore: 25,
    status: d.savingsRate >= 20 ? 'healthy' : d.savingsRate >= 10 ? 'warning' : 'critical',
    explanation: `You save ${d.savingsRate.toFixed(1)}% of your income. ${d.savingsRate >= 20 ? 'Excellent savings habit!' : d.savingsRate >= 10 ? 'Decent, but aim for 20%+.' : 'Very low - try to cut non-essential expenses.'}`
  });

  // Emergency Fund (0-25 points)
  const emScore = d.emergencyMonths >= 6 ? 25 : d.emergencyMonths >= 3 ? 18 : d.emergencyMonths >= 1 ? 10 : 3;
  factors.push({
    name: 'Emergency Fund',
    score: emScore,
    maxScore: 25,
    status: d.emergencyMonths >= 6 ? 'healthy' : d.emergencyMonths >= 3 ? 'warning' : 'critical',
    explanation: `Your emergency reserve covers ${d.emergencyMonths.toFixed(1)} months of expenses. ${d.emergencyMonths >= 6 ? 'Well protected!' : d.emergencyMonths >= 3 ? 'Decent buffer, aim for 6 months.' : 'Vulnerable to financial shocks.'}`
  });

  // Debt Management (0-20 points)
  const debtScore = d.debtToIncome <= 20 ? 20 : d.debtToIncome <= 40 ? 15 : d.debtToIncome <= 60 ? 8 : 3;
  factors.push({
    name: 'Debt Management',
    score: debtScore,
    maxScore: 20,
    status: d.debtToIncome <= 30 ? 'healthy' : d.debtToIncome <= 50 ? 'warning' : 'critical',
    explanation: `Your debt-to-income ratio is ${d.debtToIncome.toFixed(1)}%. ${d.debtToIncome <= 30 ? 'Manageable debt level.' : d.debtToIncome <= 50 ? 'Consider accelerating debt repayment.' : 'High debt burden - prioritize reduction.'}`
  });

  // Cash Flow (0-15 points)
  const surplus = d.monthlyIncome - d.monthlyExpenses;
  const cfScore = surplus > d.monthlyIncome * 0.3 ? 15 : surplus > d.monthlyIncome * 0.15 ? 12 : surplus > 0 ? 8 : 2;
  factors.push({
    name: 'Cash Flow',
    score: cfScore,
    maxScore: 15,
    status: surplus > d.monthlyIncome * 0.2 ? 'healthy' : surplus > 0 ? 'warning' : 'critical',
    explanation: `Monthly surplus: ${formatPKR(Math.round(surplus))}. ${surplus > d.monthlyIncome * 0.2 ? 'Strong positive cash flow.' : surplus > 0 ? 'Positive but tight - watch for unexpected expenses.' : 'Spending exceeds income!'}`
  });

  // Financial Diversity (0-15 points)
  const diversityScore = d.totalAssets > 0 && d.netWorth > 0 ? (d.netWorth > d.monthlyIncome * 12 ? 15 : d.netWorth > d.monthlyIncome * 6 ? 12 : 8) : 3;
  factors.push({
    name: 'Financial Stability',
    score: diversityScore,
    maxScore: 15,
    status: d.netWorth > d.monthlyIncome * 6 ? 'healthy' : d.netWorth > 0 ? 'warning' : 'critical',
    explanation: `Net worth: ${formatPKR(Math.round(d.netWorth))}. ${d.netWorth > d.monthlyIncome * 12 ? 'Strong financial foundation.' : d.netWorth > 0 ? 'Growing wealth - keep building.' : 'Negative net worth - focus on debt reduction and savings.'}`
  });

  return factors;
}

async function buildCashFlowHistory(userId: string, months: number): Promise<CashFlowPoint[]> {
  const allTxns = await getAllTransactions(userId);
  const result: CashFlowPoint[] = [];
  const now = new Date();
  const accounts = await getAccounts(userId);
  const currentBalance = accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-PK', { month: 'short', year: '2-digit' });

    const monthTxns = allTxns.filter((t: any) => t.date.startsWith(monthStr));
    const income = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expenses = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    const savings = monthTxns.filter((t: any) => t.type === 'savings').reduce((s: number, t: any) => s + t.amount, 0);

    result.push({ month: label, income: Math.round(income), expenses: Math.round(expenses), savings: Math.round(savings), balance: Math.round(currentBalance) });
  }
  return result;
}

// ==================== WHAT-IF SIMULATOR ====================
function calculateImmediateHealth(snapshot: FinancialSnapshot, newBalance: number, newEmergency: number, newEmergencyMonths: number, scenario: Scenario): number {
  const newNetWorth = snapshot.netWorth + (newBalance - snapshot.liquidBalance);
  // For income/expense changes, use projected savings rate from the engine
  // For purchases, keep savings rate the same (it doesn't change from a one-time purchase)
  const newMonthlyIncome = snapshot.monthlyIncome + (scenario.type === 'income_change' ? scenario.amount : 0);
  const newMonthlyExpenses = snapshot.monthlyExpenses + (scenario.type === 'expense_change' ? scenario.amount : 0);
  // Use actual surplus including savings commitments
  const actualSurplus = newMonthlyIncome - newMonthlyExpenses - snapshot.monthlySavings;
  const newSavingsRate = scenario.type === 'savings_change'
    ? ((snapshot.monthlySavings + scenario.amount) / snapshot.monthlyIncome) * 100
    : (scenario.type === 'income_change' || scenario.type === 'expense_change')
      ? Math.max(0, (actualSurplus / newMonthlyIncome)) * 100
      : snapshot.savingsRate;

  const factors = calculateHealthFactors({
    savingsRate: Math.max(0, newSavingsRate),
    emergencyMonths: newEmergencyMonths,
    debtToIncome: snapshot.debtToIncome,
    monthlyIncome: newMonthlyIncome,
    monthlyExpenses: newMonthlyExpenses,
    monthlySavings: Math.max(0, actualSurplus),
    netWorth: newNetWorth,
    totalAssets: snapshot.totalAssets + Math.max(0, newBalance - snapshot.liquidBalance),
    debtBalance: snapshot.totalDebt,
    liquidBalance: newBalance,
  });
  return Math.min(100, Math.max(0, factors.reduce((s, f) => s + f.score, 0)));
}
export async function simulateScenario(userId: string, query: string): Promise<SimulationResult> {
  const snapshot = await getFinancialSnapshot(userId);
  const scenario = parseScenario(query, snapshot);

  // Run simulation
  const projected = runProjection(userId, snapshot, scenario, 12);

  // Calculate immediate impact (for purchase/emergency)
  const effectiveMonthlyExpenses = snapshot.monthlyExpenses > 0 ? snapshot.monthlyExpenses : 1;
  let immediateBalance = snapshot.liquidBalance;
  let immediateEmergency = snapshot.emergencyReserve;
  if (scenario.type === 'purchase' || scenario.type === 'emergency') {
    immediateBalance = Math.max(0, snapshot.liquidBalance - scenario.amount);
    if (snapshot.liquidBalance - scenario.amount < 0) {
      immediateEmergency = Math.max(0, snapshot.emergencyReserve + (snapshot.liquidBalance - scenario.amount));
    }
  } else if (scenario.type === 'income_change') {
    immediateBalance = snapshot.liquidBalance;
    immediateEmergency = snapshot.emergencyReserve;
  }
  const immediateEmergencyMonths = immediateEmergency / effectiveMonthlyExpenses;
  const immediateHealth = calculateImmediateHealth(snapshot, immediateBalance, immediateEmergency, immediateEmergencyMonths, scenario);
  const projectedEmergencyMonths = immediateEmergencyMonths;

  // Also calculate long-term projection health for the timeline
  const longTermHealth = calculateProjectedHealth(projected, snapshot);
  const projectedBalance = (scenario.type === 'purchase' || scenario.type === 'emergency') ? immediateBalance : projected.finalBalance;
  const projectedEmergency = (scenario.type === 'purchase' || scenario.type === 'emergency') ? immediateEmergency : projected.finalEmergency;
  const projectedEmergencyMonthsFinal = projectedEmergency / effectiveMonthlyExpenses;
  const projectedHealth = (scenario.type === 'purchase' || scenario.type === 'emergency') ? immediateHealth : longTermHealth;
  const projectedSavingsRate = (scenario.type === 'income_change' || scenario.type === 'expense_change' || scenario.type === 'savings_change')
    ? projected.avgSavingsRate : snapshot.savingsRate;

  const impactSummary: ImpactItem[] = [];
  impactSummary.push({
    metric: 'Health Score', before: `${snapshot.healthScore}`, after: `${projectedHealth}`,
    change: projectedHealth >= snapshot.healthScore ? 'positive' : 'negative',
    detail: `${projectedHealth - snapshot.healthScore > 0 ? '+' : ''}${projectedHealth - snapshot.healthScore} points`
  });
  impactSummary.push({
    metric: 'Liquid Balance', before: formatPKR(snapshot.liquidBalance), after: formatPKR(Math.round(projectedBalance)),
    change: projectedBalance >= snapshot.liquidBalance ? 'positive' : 'negative',
    detail: `${formatPKR(Math.round(projectedBalance - snapshot.liquidBalance))} change`
  });
  impactSummary.push({
    metric: 'Emergency Reserve',
    before: snapshot.emergencyMonths >= 3 ? 'Healthy' : 'Low',
    after: projectedEmergencyMonths >= 3 ? 'Healthy' : projectedEmergencyMonths >= 1 ? 'Low' : 'Critical',
    change: projectedEmergencyMonths >= snapshot.emergencyMonths ? 'positive' : 'negative',
    detail: `${snapshot.emergencyMonths.toFixed(1)} → ${projectedEmergencyMonths.toFixed(1)} months`
  });
  impactSummary.push({
    metric: 'Risk Level',
    before: snapshot.healthScore >= 70 ? 'Low' : snapshot.healthScore >= 50 ? 'Medium' : 'High',
    after: projectedHealth >= 70 ? 'Low' : projectedHealth >= 50 ? 'Medium' : 'High',
    change: projectedHealth >= snapshot.healthScore ? 'positive' : 'negative',
    detail: `Health score ${snapshot.healthScore} → ${projectedHealth}`
  });
  impactSummary.push({
    metric: 'Savings Rate',
    before: `${snapshot.savingsRate}%`,
    after: `${projectedSavingsRate.toFixed(1)}%`,
    change: projectedSavingsRate >= snapshot.savingsRate ? 'positive' : 'negative',
    detail: `${(projectedSavingsRate - snapshot.savingsRate).toFixed(1)}% change`
  });

  // Goal impact
  const goals = await getGoals(userId);
  if (goals.length > 0) {
    const goalImpact = projected.avgMonthlySavings < snapshot.monthlySavings
      ? `Goals may be delayed by ${Math.round((snapshot.monthlySavings - projected.avgMonthlySavings) / snapshot.monthlySavings * 12)} months`
      : 'Goals on track';
    impactSummary.push({
      metric: 'Goal Progress', before: 'On Track', after: goalImpact,
      change: projected.avgMonthlySavings >= snapshot.monthlySavings ? 'positive' : 'negative',
      detail: goalImpact
    });
  }

  const warnings: string[] = [];
  if (projectedEmergency < 1) warnings.push('Emergency fund drops below 1 month - high risk!');
  if (projectedBalance < 0) warnings.push('Balance goes negative during simulation period.');
  if (projectedHealth < 40) warnings.push('Financial health score drops to critical level.');
  if (projectedSavingsRate < 5) warnings.push('Savings rate falls below 5% - barely saving.');

  const recommendation = generateRecommendation(query, snapshot, projected, scenario);
  const explanation = generateExplanation(query, snapshot, projected, scenario);

  return {
    scenario: query,
    currentHealth: snapshot.healthScore,
    projectedHealth,
    currentBalance: snapshot.liquidBalance,
    projectedBalance: Math.round(projectedBalance),
    currentEmergencyMonths: snapshot.emergencyMonths,
    projectedEmergencyMonths: Math.round(projectedEmergencyMonthsFinal * 10) / 10,
    currentRisk: snapshot.healthScore >= 70 ? 'Low' : snapshot.healthScore >= 50 ? 'Medium' : 'High',
    projectedRisk: projectedHealth >= 70 ? 'Low' : projectedHealth >= 50 ? 'Medium' : 'High',
    currentSavingsRate: snapshot.savingsRate,
    projectedSavingsRate: Math.round(projectedSavingsRate * 10) / 10,
    impactSummary,
    timeline: projected.timeline,
    recommendation,
    explanation,
    warnings,
  };
}

interface Scenario {
  type: 'purchase' | 'income_change' | 'expense_change' | 'savings_change' | 'salary_delay' | 'emergency' | 'goal';
  amount: number;
  duration?: number; // months
  percentage?: number;
  description: string;
}

function parseScenario(query: string, snapshot: FinancialSnapshot): Scenario {
  const q = query.toLowerCase();
  const numMatch = query.match(/(\d[\d,]*\.?\d*)/g);
  const amount = numMatch ? parseInt(numMatch[0].replace(/,/g, '')) : 0;

  // Purchase scenarios
  if (q.includes('buy') || q.includes('purchase') || q.includes('afford') || q.includes('laptop') || q.includes('car') || q.includes('phone')) {
    return { type: 'purchase', amount: amount || 60000, description: `One-time purchase of ${formatPKR(amount || 60000)}` };
  }
  // Salary delay
  if (q.includes('delay') || q.includes('late') || q.includes('salary') && q.includes('delay')) {
    const daysMatch = query.match(/(\d+)\s*day/i);
    return { type: 'salary_delay', amount: 0, duration: daysMatch ? parseInt(daysMatch[1]) : 15, description: `Salary delayed by ${daysMatch ? daysMatch[1] : '15'} days` };
  }
  // Income decrease
  if (q.includes('decrease') || q.includes('reduce') || q.includes('lose') || q.includes('cut') || q.includes('down')) {
    if (q.includes('income') || q.includes('salary') || q.includes('pay')) {
      const pctMatch = query.match(/(\d+)\s*%/);
      const pct = pctMatch ? parseInt(pctMatch[1]) : 20;
      return { type: 'income_change', amount: -Math.round(snapshot.monthlyIncome * pct / 100), percentage: -pct, description: `Income decreases by ${pct}% (${formatPKR(Math.round(snapshot.monthlyIncome * pct / 100))}/month)` };
    }
  }
  // Income increase
  if (q.includes('raise') || q.includes('increase') || q.includes('more income') || q.includes('bonus')) {
    const pctMatch = query.match(/(\d+)\s*%/);
    const pct = pctMatch ? parseInt(pctMatch[1]) : 10;
    return { type: 'income_change', amount: Math.round(snapshot.monthlyIncome * pct / 100), percentage: pct, description: `Income increases by ${pct}%` };
  }
  // Savings goal
  if (q.includes('save') && (q.includes('every month') || q.includes('per month') || q.includes('monthly'))) {
    return { type: 'savings_change', amount: amount || 5000, description: `Save additional ${formatPKR(amount || 5000)} per month` };
  }
  // Savings target
  if (q.includes('save') && q.match(/\d/) && (q.includes('month') || q.includes('year'))) {
    const monthMatch = q.match(/(\d+)\s*month/i);
    const months = monthMatch ? parseInt(monthMatch[1]) : 6;
    return { type: 'goal', amount: amount || 100000, duration: months, description: `Save ${formatPKR(amount || 100000)} in ${months} months` };
  }
  // Emergency
  if (q.includes('emergency') || q.includes('unexpected') || q.includes('medical')) {
    return { type: 'emergency', amount: amount || 50000, description: `Unexpected expense of ${formatPKR(amount || 50000)}` };
  }
  // Expense change
  if (q.includes('spend') && (q.includes('more') || q.includes('less') || q.includes('extra'))) {
    const isLess = q.includes('less') || q.includes('reduce') || q.includes('cut');
    return {
      type: 'expense_change',
      amount: isLess ? -(amount || 5000) : (amount || 5000),
      description: `Monthly expenses ${isLess ? 'decrease' : 'increase'} by ${formatPKR(amount || 5000)}`
    };
  }
  // Default: treat as purchase
  if (amount > 0) {
    return { type: 'purchase', amount, description: `One-time expense of ${formatPKR(amount)}` };
  }
  return { type: 'purchase', amount: 50000, description: 'One-time expense of Rs. 50,000' };
}

function runProjection(userId: string, snapshot: FinancialSnapshot, scenario: Scenario, months: number) {
  let balance = snapshot.liquidBalance;
  let emergency = snapshot.emergencyReserve;
  const monthlyIncome = snapshot.monthlyIncome + (scenario.type === 'income_change' ? scenario.amount : 0);
  const monthlyExpenses = snapshot.monthlyExpenses + (scenario.type === 'expense_change' ? scenario.amount : 0);
  const extraSavings = scenario.type === 'savings_change' ? scenario.amount : 0;
  let totalSavings = 0;
  let monthsSaved = 0;

  const timeline: SimTimeline[] = [];
  const now = new Date();

  // Immediate impact for purchase/emergency
  if (scenario.type === 'purchase' || scenario.type === 'emergency') {
    balance -= scenario.amount;
    if (balance < 0) {
      emergency += balance;
      balance = 0;
    }
  }

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
    const label = d.toLocaleString('en-PK', { month: 'short', year: '2-digit' });

    // Salary delay handling
    if (scenario.type === 'salary_delay' && i === 0) {
      // First month: no salary, use existing balance
      const reducedIncome = Math.round(monthlyIncome * (1 - (scenario.duration || 15) / 30));
      const monthSavings = Math.max(0, reducedIncome - monthlyExpenses) + extraSavings;
      balance += reducedIncome - monthlyExpenses;
      if (balance < 0) { emergency += balance; balance = 0; }
      totalSavings += Math.max(0, monthSavings);
      monthsSaved++;
      timeline.push({ month: label, balance: Math.round(balance), savings: Math.round(Math.max(0, monthSavings)), projected: true });
      continue;
    }

    // Goal scenario: redirect savings
    if (scenario.type === 'goal') {
      const needed = Math.ceil(scenario.amount / (scenario.duration || 6));
      const available = monthlyIncome - monthlyExpenses;
      const actualSaving = Math.min(needed, available);
      balance += monthlyIncome - monthlyExpenses - actualSaving;
      if (balance < 0) { emergency += balance; balance = 0; }
      totalSavings += actualSaving;
      monthsSaved++;
      timeline.push({ month: label, balance: Math.round(balance), savings: actualSaving, projected: true });
      continue;
    }

    const monthSavings = Math.max(0, monthlyIncome - monthlyExpenses + extraSavings);
    balance += monthlyIncome - monthlyExpenses;
    if (balance < 0) { emergency += balance; balance = 0; }
    emergency = Math.max(0, emergency);
    totalSavings += monthSavings;
    monthsSaved++;

    timeline.push({
      month: label,
      balance: Math.round(balance),
      savings: Math.round(monthSavings),
      projected: true,
    });
  }

  const avgMonthlySavings = monthsSaved > 0 ? totalSavings / monthsSaved : 0;
  const avgSavingsRate = monthlyIncome > 0 ? (avgMonthlySavings / monthlyIncome) * 100 : 0;
  const finalEmergency = emergency > 0 ? emergency : snapshot.emergencyReserve;
  const projectedEmergencyMonths = monthlyExpenses > 0 ? finalEmergency / monthlyExpenses : snapshot.emergencyMonths;

  return {
    finalBalance: balance,
    finalEmergency: finalEmergency,
    avgMonthlySavings,
    avgSavingsRate,
    timeline,
    monthlyIncome,
    monthlyExpenses,
  };
}

function calculateProjectedHealth(projected: any, current: FinancialSnapshot): number {
  const factors = calculateHealthFactors({
    savingsRate: projected.avgSavingsRate,
    emergencyMonths: projected.finalEmergency / Math.max(1, projected.monthlyExpenses),
    debtToIncome: current.debtToIncome,
    monthlyIncome: projected.monthlyIncome,
    monthlyExpenses: projected.monthlyExpenses,
    monthlySavings: projected.avgMonthlySavings,
    netWorth: current.netWorth + (projected.finalBalance - current.liquidBalance),
    totalAssets: current.totalAssets + Math.max(0, projected.finalBalance - current.liquidBalance),
    debtBalance: current.totalDebt,
    liquidBalance: projected.finalBalance,
  });
  return Math.min(100, Math.max(0, factors.reduce((s, f) => s + f.score, 0)));
}

function generateRecommendation(query: string, snapshot: FinancialSnapshot, projected: any, scenario: Scenario): string {
  const healthDelta = calculateProjectedHealth(projected, snapshot) - snapshot.healthScore;
  const q = query.toLowerCase();

  if (scenario.type === 'purchase') {
    if (healthDelta < -15) {
      return `This purchase would significantly impact your financial health. Consider: (1) Save ${formatPKR(Math.round(scenario.amount / 3))} over 3 months before buying, (2) Look for a more affordable alternative under ${formatPKR(Math.round(scenario.amount * 0.5))}, or (3) Delay non-essential spending until your emergency fund is stronger.`;
    } else if (healthDelta < -5) {
      return `You can afford this but it will reduce your financial cushion. Recommendation: Set aside ${formatPKR(Math.round(scenario.amount / 2))} first, then buy in ${Math.ceil(scenario.amount / (snapshot.monthlySavings || 1))} months when you have a safety buffer.`;
    }
    return `Your finances can absorb this purchase. Still, maintain your savings rate and ensure your emergency fund stays above 3 months of expenses.`;
  }
  if (scenario.type === 'salary_delay') {
    return `A ${scenario.duration}-day salary delay is manageable if your emergency fund covers it. Keep at least ${formatPKR(Math.round(snapshot.monthlyExpenses * (scenario.duration || 15) / 30))} as a salary-delay buffer. Consider moving your bill payment dates to after payday.`;
  }
  if (scenario.type === 'income_change' && scenario.amount < 0) {
    return `A ${Math.abs(scenario.percentage || 0)}% income drop requires immediate expense adjustments. Cut non-essential spending by ${formatPKR(Math.round(Math.abs(scenario.amount)))}/month. Prioritize fixed obligations (rent, EMI, school fees). Build a 6-month emergency fund to survive extended income disruptions.`;
  }
  if (scenario.type === 'savings_change') {
    return `Saving an extra ${formatPKR(scenario.amount)}/month will strengthen your financial position significantly. Over 12 months, that's ${formatPKR(scenario.amount * 12)} additional savings. Automate this transfer on payday to stay consistent.`;
  }
  if (scenario.type === 'goal') {
    const needed = Math.ceil(scenario.amount / (scenario.duration || 6));
    const available = snapshot.monthlyIncome - snapshot.monthlyExpenses;
    if (needed > available) {
      return `This goal requires ${formatPKR(needed)}/month but you can currently save ${formatPKR(Math.round(available))}/month. Options: (1) Extend the timeline to ${Math.ceil(scenario.amount / Math.max(1, available))} months, (2) Reduce other expenses by ${formatPKR(needed - Math.round(available))}/month, or (3) Find additional income sources.`;
    }
    return `This goal is achievable! You need to save ${formatPKR(needed)}/month for ${scenario.duration} months. Your current saving capacity of ${formatPKR(Math.round(available))}/month comfortably covers this.`;
  }
  return `Review the simulation results carefully. If the projected health score drops below 50, consider alternative approaches that have less impact on your financial stability.`;
}

function generateExplanation(query: string, snapshot: FinancialSnapshot, projected: any, scenario: Scenario): string {
  const healthAfter = calculateProjectedHealth(projected, snapshot);
  let explanation = `Based on your current financial data:\n\n`;
  explanation += `• Monthly Income: ${formatPKR(snapshot.monthlyIncome)}\n`;
  explanation += `• Monthly Expenses: ${formatPKR(snapshot.monthlyExpenses)}\n`;
  explanation += `• Current Balance: ${formatPKR(snapshot.liquidBalance)}\n`;
  explanation += `• Emergency Fund: ${formatPKR(snapshot.emergencyReserve)} (${snapshot.emergencyMonths.toFixed(1)} months)\n\n`;

  explanation += `**What happens:** ${scenario.description}\n\n`;
  explanation += `Your financial health changes from ${snapshot.healthScore}/100 to ${healthAfter}/100. `;

  if (scenario.type === 'purchase') {
    explanation += `After spending ${formatPKR(scenario.amount)}, your liquid balance drops to ${formatPKR(Math.round(projected.finalBalance))}. `;
    if (projected.finalEmergency < snapshot.emergencyReserve * 0.7) {
      explanation += `Your emergency reserve is also affected, reducing your safety net. `;
    }
  } else if (scenario.type === 'income_change') {
    explanation += `Your monthly income changes to ${formatPKR(Math.round(projected.monthlyIncome))}, affecting your savings capacity and long-term wealth building. `;
  }

  explanation += `\n\n**Why this matters:** Every financial decision compounds over time. A ${Math.abs(healthAfter - snapshot.healthScore)}-point change in your health score reflects how this decision affects your ability to handle emergencies, reach goals, and build wealth.`;

  return explanation;
}

// ==================== STRESS TEST ====================
export async function runStressTest(userId: string, scenarioType: string, params: Record<string, number> = {}): Promise<StressTestResult> {
  const snapshot = await getFinancialSnapshot(userId);
  const monthlySurplus = snapshot.monthlyIncome - snapshot.monthlyExpenses;

  switch (scenarioType) {
    case 'salary_delay': {
      const days = params.days || 15;
      const impact = Math.round(snapshot.monthlyExpenses * days / 30);
      const canSurvive = snapshot.liquidBalance >= impact;
      const survivalMonths = snapshot.liquidBalance / Math.max(1, snapshot.monthlyExpenses);
      return {
        scenario: `Salary delayed by ${days} days`,
        stabilityScore: canSurvive ? Math.min(90, Math.round(survivalMonths * 15)) : 20,
        shortfall: canSurvive ? 0 : impact - snapshot.liquidBalance,
        emergencyFundImpact: canSurvive ? 'Minimal - liquid balance covers the gap' : 'Significant - would need to use emergency reserves',
        survivalMonths: Math.round(survivalMonths * 10) / 10,
        recoveryTime: canSurvive ? '1 pay cycle' : '2-3 pay cycles',
        recommendedBuffer: Math.round(snapshot.monthlyExpenses * days / 30 * 1.5),
        details: [
          `You need ${formatPKR(impact)} to cover ${days} days of expenses`,
          `Your liquid balance: ${formatPKR(snapshot.liquidBalance)}`,
          canSurvive ? 'You can survive this delay without borrowing' : `Shortfall: ${formatPKR(impact - snapshot.liquidBalance)}`,
          `Your emergency fund has ${snapshot.emergencyMonths.toFixed(1)} months of coverage`,
        ],
        actions: [
          'Keep a salary-delay buffer of ' + formatPKR(Math.round(snapshot.monthlyExpenses * 0.5)) + ' in a separate account',
          'Move bill payment dates to after payday',
          'Maintain at least 1 month expenses in a liquid savings account',
        ],
      };
    }
    case 'income_loss': {
      const pct = params.percentage || 50;
      const newIncome = Math.round(snapshot.monthlyIncome * (1 - pct / 100));
      const newSurplus = newIncome - snapshot.monthlyExpenses;
      const survivalMonths = newSurplus >= 0 ? Infinity : snapshot.emergencyReserve / Math.abs(newSurplus);
      return {
        scenario: `${pct}% income reduction`,
        stabilityScore: newSurplus >= 0 ? 70 : Math.min(60, Math.round(survivalMonths * 10)),
        shortfall: newSurplus >= 0 ? 0 : Math.abs(newSurplus),
        emergencyFundImpact: newSurplus >= 0 ? 'No impact on emergency fund' : `Emergency fund depleted in ${survivalMonths.toFixed(1)} months`,
        survivalMonths: newSurplus >= 0 ? 999 : Math.round(survivalMonths * 10) / 10,
        recoveryTime: newSurplus >= 0 ? 'Immediate adjustment' : `${Math.ceil(survivalMonths)} months of emergency fund usage`,
        recommendedBuffer: Math.round(snapshot.monthlyExpenses * 6),
        details: [
          `New monthly income: ${formatPKR(newIncome)}`,
          `Monthly deficit: ${formatPKR(Math.abs(newSurplus))}`,
          `Emergency fund lasts: ${newSurplus >= 0 ? 'Not needed' : survivalMonths.toFixed(1) + ' months'}`,
          `Current expenses: ${formatPKR(snapshot.monthlyExpenses)}`,
        ],
        actions: [
          `Cut non-essential expenses by ${formatPKR(Math.max(0, Math.abs(newSurplus)))}/month`,
          'Prioritize fixed obligations: rent, EMI, school fees',
          'Build 6-month emergency fund to survive income disruptions',
          'Explore alternative income sources immediately',
        ],
      };
    }
    case 'unexpected_expense': {
      const expense = params.amount || 100000;
      const afterBalance = snapshot.liquidBalance - expense;
      const hitsEmergency = afterBalance < 0;
      const emergencyAfter = hitsEmergency ? snapshot.emergencyReserve + afterBalance : snapshot.emergencyReserve;
      return {
        scenario: `Unexpected expense of ${formatPKR(expense)}`,
        stabilityScore: afterBalance >= 0 ? 75 : emergencyAfter > 0 ? 45 : 15,
        shortfall: afterBalance >= 0 ? 0 : Math.abs(afterBalance) - snapshot.emergencyReserve,
        emergencyFundImpact: hitsEmergency ? `Emergency fund reduced to ${formatPKR(Math.max(0, emergencyAfter))}` : 'Emergency fund untouched',
        survivalMonths: emergencyAfter > 0 ? Math.round(emergencyAfter / snapshot.monthlyExpenses * 10) / 10 : 0,
        recoveryTime: afterBalance >= 0 ? `${Math.ceil(expense / Math.max(1, monthlySurplus))} months to rebuild` : `${Math.ceil((expense + Math.abs(afterBalance)) / Math.max(1, monthlySurplus))} months`,
        recommendedBuffer: Math.round(expense * 1.2),
        details: [
          `Liquid balance after: ${formatPKR(Math.max(0, afterBalance))}`,
          hitsEmergency ? `Emergency fund after: ${formatPKR(Math.max(0, emergencyAfter))}` : 'Emergency fund intact',
          `Recovery time: ${Math.ceil(expense / Math.max(1, monthlySurplus))} months at current savings rate`,
        ],
        actions: [
          'Maintain a separate emergency fund of 3-6 months expenses',
          'Consider insurance coverage for medical/home/vehicle risks',
          `Start an emergency sinking fund of ${formatPKR(Math.round(expense / 12))}/month`,
        ],
      };
    }
    case 'job_loss': {
      const survivalMonths = (snapshot.liquidBalance + snapshot.emergencyReserve) / Math.max(1, snapshot.monthlyExpenses);
      return {
        scenario: 'Complete job loss (zero income)',
        stabilityScore: Math.min(80, Math.round(survivalMonths * 10)),
        shortfall: snapshot.monthlyExpenses,
        emergencyFundImpact: `All reserves depleted in ${survivalMonths.toFixed(1)} months`,
        survivalMonths: Math.round(survivalMonths * 10) / 10,
        recoveryTime: 'Depends on job market - build 6+ months buffer',
        recommendedBuffer: Math.round(snapshot.monthlyExpenses * 6),
        details: [
          `Total available funds: ${formatPKR(snapshot.liquidBalance + snapshot.emergencyReserve)}`,
          `Monthly burn rate: ${formatPKR(snapshot.monthlyExpenses)}`,
          `Survival time: ${survivalMonths.toFixed(1)} months`,
          `Fixed commitments that cannot be reduced: ${formatPKR(snapshot.monthlyDebtPayments + 35000 + 12000)}`,
        ],
        actions: [
          'Immediately cut all non-essential expenses',
          'Negotiate EMI moratorium with bank if needed',
          'Tap investments if liquid funds run low',
          `Target emergency fund: ${formatPKR(Math.round(snapshot.monthlyExpenses * 6))}`,
        ],
      };
    }
    default:
      return await runStressTest(userId, 'salary_delay', params);
  }
}

// ==================== RISK RADAR ====================
export async function getRiskRadar(userId: string): Promise<RiskItem[]> {
  const snapshot = await getFinancialSnapshot(userId);
  const txns = await getMonthTransactions(userId, 2);
  const risks: RiskItem[] = [];

  // Low emergency reserve
  if (snapshot.emergencyMonths < 3) {
    risks.push({
      id: 'low-emergency',
      severity: snapshot.emergencyMonths < 1 ? 'critical' : 'high',
      category: 'Emergency Fund',
      title: 'Insufficient Emergency Reserve',
      description: `Your emergency fund covers only ${snapshot.emergencyMonths.toFixed(1)} months of expenses. Recommended: 6 months.`,
      why: 'Without adequate emergency savings, any unexpected expense (medical, car repair, job loss) can push you into debt.',
      action: `Increase your emergency fund by ${formatPKR(Math.round(snapshot.monthlyExpenses * 6 - snapshot.emergencyReserve))} to reach 6 months coverage.`,
      metric: `${snapshot.emergencyMonths.toFixed(1)} / 6 months`
    });
  }

  // Spending spike detection
  const thisMonth = txns.filter((t: any) => t.type === 'expense');
  const thisMonthTotal = thisMonth.reduce((s: number, t: any) => s + t.amount, 0);
  const avgMonthly = snapshot.monthlyExpenses;
  if (thisMonthTotal > avgMonthly * 1.3 && thisMonthTotal > 0) {
    risks.push({
      id: 'spending-spike',
      severity: thisMonthTotal > avgMonthly * 1.5 ? 'high' : 'medium',
      category: 'Spending Pattern',
      title: 'Unusually High Spending This Month',
      description: `This month's spending (${formatPKR(Math.round(thisMonthTotal))}) is ${Math.round((thisMonthTotal / avgMonthly - 1) * 100)}% above your average.`,
      why: 'Sustained spending spikes erode savings and can derail financial goals.',
      action: 'Review recent purchases and identify non-essential spending that can be reduced.',
      metric: `${formatPKR(Math.round(thisMonthTotal))} vs avg ${formatPKR(Math.round(avgMonthly))}`
    });
  }

  // High debt burden
  if (snapshot.debtToIncome > 40) {
    risks.push({
      id: 'high-debt',
      severity: snapshot.debtToIncome > 60 ? 'critical' : 'high',
      category: 'Debt',
      title: 'High Debt-to-Income Ratio',
      description: `Your debt is ${snapshot.debtToIncome.toFixed(0)}% of your annual income. This limits financial flexibility.`,
      why: 'High debt means a large portion of your income goes to interest and EMIs, reducing your ability to save and invest.',
      action: 'Consider accelerating debt repayment. Even Rs. 5,000 extra/month toward debt can save significant interest.',
      metric: `${snapshot.debtToIncome.toFixed(0)}% DTI`
    });
  }

  // Category-specific risks
  const catSpend = snapshot.categoryBreakdown;
  const foodSpend = catSpend.find(c => c.category === 'food');
  if (foodSpend && foodSpend.percentage > 30) {
    risks.push({
      id: 'food-overspend',
      severity: 'medium',
      category: 'Food & Dining',
      title: 'High Food Spending',
      description: `Food spending is ${foodSpend.percentage}% of total expenses (${formatPKR(foodSpend.amount)}/month).`,
      why: 'Food spending above 25% of total expenses suggests room for optimization in dining out and food delivery.',
      action: 'Try meal planning and cooking at home more. Limit food delivery to 2-3 times per week.',
      metric: `${foodSpend.percentage}% of expenses`
    });
  }

  // Low savings rate
  if (snapshot.savingsRate < 10) {
    risks.push({
      id: 'low-savings',
      severity: snapshot.savingsRate < 5 ? 'critical' : 'high',
      category: 'Savings',
      title: 'Very Low Savings Rate',
      description: `You are saving only ${snapshot.savingsRate.toFixed(1)}% of your income. Aim for at least 20%.`,
      why: 'Low savings rate means you are not building wealth, not preparing for retirement, and vulnerable to emergencies.',
      action: `Start by saving ${formatPKR(Math.round(snapshot.monthlyIncome * 0.1))}/month (10%) and gradually increase to 20%.`,
      metric: `${snapshot.savingsRate.toFixed(1)}% savings rate`
    });
  }

  // Goals at risk
  const goals = await getGoals(userId);
  for (const g of goals) {
    const monthsLeft = monthsBetween(new Date().toISOString(), g.deadline);
    const remaining = g.target_amount - g.current_amount;
    const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
    if (monthlyNeeded > snapshot.monthlyIncome - snapshot.monthlyExpenses) {
      risks.push({
        id: `goal-risk-${g.id}`,
        severity: 'medium',
        category: 'Goals',
        title: `Goal At Risk: ${g.name}`,
        description: `You need ${formatPKR(Math.round(monthlyNeeded))}/month but can only save ${formatPKR(Math.round(snapshot.monthlyIncome - snapshot.monthlyExpenses))}/month.`,
        why: 'Without adjusting your plan, this goal will not be achieved by the deadline.',
        action: `Extend deadline by ${Math.ceil(remaining / Math.max(1, snapshot.monthlyIncome - snapshot.monthlyExpenses) - monthsLeft)} months or increase monthly savings.`,
        metric: `${Math.round((g.current_amount / g.target_amount) * 100)}% complete`
      });
    }
  }

  // Unstable cash flow (check variance)
  const history = snapshot.cashFlowHistory;
  if (history.length >= 3) {
    const expenses = history.map(h => h.expenses);
    const avg = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const variance = Math.sqrt(expenses.reduce((s, e) => s + Math.pow(e - avg, 2), 0) / expenses.length);
    if (variance > avg * 0.3) {
      risks.push({
        id: 'unstable-cashflow',
        severity: 'medium',
        category: 'Cash Flow',
        title: 'Unstable Monthly Spending',
        description: `Your monthly expenses vary significantly (±${formatPKR(Math.round(variance))} from average).`,
        why: 'Unpredictable spending makes it hard to plan and save consistently.',
        action: 'Identify the source of variance and try to stabilize recurring expenses.',
      });
    }
  }

  return risks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ==================== GOAL ANALYSIS ====================
export async function analyzeGoals(userId: string): Promise<GoalAnalysis[]> {
  const goals = await getGoals(userId);
  const snapshot = await getFinancialSnapshot(userId);
  const monthlyAvailable = snapshot.monthlyIncome - snapshot.monthlyExpenses;

  return goals.map((g: any) => {
    const monthsRemaining = monthsBetween(new Date().toISOString(), g.deadline);
    const remaining = g.target_amount - g.current_amount;
    const monthlyRequired = monthsRemaining > 0 ? Math.ceil(remaining / monthsRemaining) : remaining;
    const progress = (g.current_amount / g.target_amount) * 100;

    let status: GoalAnalysis['status'];
    if (progress >= 100) status = 'completed';
    else if (monthlyRequired <= monthlyAvailable * 0.7) status = 'achievable';
    else if (monthlyRequired <= monthlyAvailable) status = 'at_risk';
    else status = 'unrealistic';

    const explanation = status === 'achievable'
      ? `You need ${formatPKR(monthlyRequired)}/month and can save ${formatPKR(Math.round(monthlyAvailable))}/month. This goal is within reach.`
      : status === 'at_risk'
        ? `You need ${formatPKR(monthlyRequired)}/month which is close to your maximum capacity. Any unexpected expense could derail this goal.`
        : status === 'unrealistic'
          ? `You need ${formatPKR(monthlyRequired)}/month but can only save ${formatPKR(Math.round(monthlyAvailable))}/month. The deadline needs adjustment.`
          : 'Goal completed!';

    let alternativePlan: string | undefined;
    if (status === 'unrealistic') {
      const realisticMonths = Math.ceil(remaining / Math.max(1, monthlyAvailable * 0.7));
      const newDeadline = new Date();
      newDeadline.setMonth(newDeadline.getMonth() + realisticMonths);
      alternativePlan = `Extend deadline to ${newDeadline.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })} and save ${formatPKR(Math.round(remaining / realisticMonths))}/month.`;
    }

    return {
      id: g.id,
      name: g.name,
      target: g.target_amount,
      current: g.current_amount,
      progress: Math.round(progress),
      deadline: g.deadline,
      monthlyRequired: Math.round(monthlyRequired),
      monthlyAvailable: Math.round(monthlyAvailable),
      status,
      monthsRemaining,
      explanation,
      alternativePlan,
    };
  });
}

// ==================== SAFE TO SPEND ====================
export async function calculateSafeToSpend(userId: string): Promise<SafeToSpend> {
  const snapshot = await getFinancialSnapshot(userId);
  const bills = await getUpcomingBills(userId);
  const goals = await getGoals(userId);

  const upcomingBillsTotal = bills.reduce((s: number, b: any) => s + b.amount, 0);
  const goalMonthlyTotal = goals.reduce((s: number, g: any) => {
    const monthsLeft = monthsBetween(new Date().toISOString(), g.deadline);
    return s + (monthsLeft > 0 ? (g.target_amount - g.current_amount) / monthsLeft : 0);
  }, 0);

  const emergencyBuffer = Math.round(snapshot.monthlyExpenses * 1); // Keep 1 month minimum
  const remainingDays = remainingDaysInMonth();
  const daysTotal = daysInMonth();

  const safeMonthly = snapshot.liquidBalance - emergencyBuffer - upcomingBillsTotal - Math.round(goalMonthlyTotal);
  const safeToday = Math.max(0, Math.round(safeMonthly * (1 / remainingDays)));
  const safeWeek = Math.max(0, Math.round(safeMonthly * (7 / remainingDays)));
  const safeMonth = Math.max(0, Math.round(safeMonthly));

  const breakdown = [
    { label: 'Current Liquid Balance', amount: snapshot.liquidBalance, type: 'positive' as const },
    { label: 'Upcoming Bills', amount: -upcomingBillsTotal, type: 'negative' as const },
    { label: 'Emergency Buffer (1 month)', amount: -emergencyBuffer, type: 'negative' as const },
    { label: 'Goal Savings Required', amount: -Math.round(goalMonthlyTotal), type: 'negative' as const },
  ];

  const explanation = `After keeping ${formatPKR(emergencyBuffer)} as emergency buffer, ${formatPKR(upcomingBillsTotal)} for upcoming bills, and ${formatPKR(Math.round(goalMonthlyTotal))} for goal savings, you can safely spend ${formatPKR(safeMonth)} this month (${formatPKR(safeToday)}/day for the next ${remainingDays} days).`;

  return { today: safeToday, thisWeek: safeWeek, thisMonth: safeMonth, breakdown, explanation };
}

// ==================== CASH FLOW PROJECTION ====================
export async function getProjection(userId: string, months: number = 6): Promise<CashFlowProjection> {
  const snapshot = await getFinancialSnapshot(userId);
  const bills = await getUpcomingBills(userId);
  const result: ProjectionMonth[] = [];
  const now = new Date();
  let balance = snapshot.liquidBalance;

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
    const label = d.toLocaleString('en-PK', { month: 'long', year: 'numeric' });
    const events: string[] = [];

    let income = snapshot.monthlyIncome;
    let expenses = snapshot.monthlyExpenses;

    // Check for annual/quarterly bills
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthBills = bills.filter((b: any) => b.due_date.startsWith(monthStr));
    if (monthBills.length > 0) {
      events.push(`${monthBills.length} bills due`);
    }

    const savings = Math.max(0, income - expenses);
    balance += income - expenses;

    result.push({
      month: label,
      income: Math.round(income),
      expenses: Math.round(expenses),
      savings: Math.round(savings),
      endingBalance: Math.round(balance),
      projected: true,
      events,
    });
  }

  const totalSavings = result.reduce((s, m) => s + m.savings, 0);
  const summary = `Over the next ${months} months, your projected balance grows to ${formatPKR(Math.round(balance))} with total savings of ${formatPKR(totalSavings)}. ${balance > snapshot.liquidBalance ? 'Positive trajectory!' : 'Consider reducing expenses.'}`;

  return { months: result, summary };
}

// ==================== AI COACH RESPONSE ====================
export async function getCoachResponse(userId: string, question: string): Promise<{ answer: string; factors: string[]; data: Record<string, any> }> {
  const snapshot = await getFinancialSnapshot(userId);
  const q = question.toLowerCase();
  const factors: string[] = [];
  const data: Record<string, any> = {};

  // Health score question
  if (q.includes('health') || q.includes('score') || q.includes('low') || q.includes('improve')) {
    data.healthScore = snapshot.healthScore;
    data.factors = snapshot.healthFactors;
    factors.push(...snapshot.healthFactors.map(f => `${f.name}: ${f.score}/${f.maxScore} - ${f.explanation}`));

    return {
      answer: `Your financial health score is **${snapshot.healthScore}/100**. Here's the breakdown:\n\n` +
        snapshot.healthFactors.map(f => `• **${f.name}** (${f.score}/${f.maxScore}): ${f.explanation}`).join('\n') +
        `\n\n**To improve:** Focus on the weakest factors first. ${snapshot.healthFactors.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore)).slice(0, 2).map(f => f.name).join(' and ')} have the most room for improvement.`,
      factors,
      data,
    };
  }

  // Spending analysis
  if (q.includes('spend') || q.includes('expense') || q.includes('where') || q.includes('too much')) {
    const topCategories = snapshot.categoryBreakdown.slice(0, 5);
    data.categories = topCategories;
    factors.push(`Top spending: ${topCategories.map(c => `${c.category} (${formatPKR(c.amount)}, ${c.percentage}%)`).join(', ')}`);

    const recommendations: string[] = [];
    const foodCat = topCategories.find(c => c.category === 'food');
    if (foodCat && foodCat.percentage > 25) recommendations.push(`Food spending (${foodCat.percentage}%) is above recommended 20-25%. Try cooking more at home.`);
    const entCat = topCategories.find(c => c.category === 'entertainment');
    if (entCat && entCat.percentage > 10) recommendations.push(`Entertainment (${entCat.percentage}%) could be reduced. Consider free alternatives.`);

    return {
      answer: `Your top spending categories:\n\n` +
        topCategories.map((c, i) => `${i + 1}. **${c.category.charAt(0).toUpperCase() + c.category.slice(1)}**: ${formatPKR(c.amount)}/month (${c.percentage}% of expenses)`).join('\n') +
        `\n\n${recommendations.length > 0 ? '**Recommendations:**\n' + recommendations.join('\n') : 'Your spending distribution looks reasonable. Focus on maintaining your savings rate.'}`,
      factors,
      data,
    };
  }

  // Savings question
  if (q.includes('save') || q.includes('saving')) {
    const amountMatch = question.match(/(\d[\d,]*)/);
    const targetAmount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : 20000;
    const monthlyCapacity = snapshot.monthlyIncome - snapshot.monthlyExpenses;
    const monthsNeeded = Math.ceil(targetAmount / Math.max(1, monthlyCapacity));

    data.monthlyCapacity = monthlyCapacity;
    data.monthsNeeded = monthsNeeded;
    factors.push(`Monthly saving capacity: ${formatPKR(Math.round(monthlyCapacity))}`);
    factors.push(`Current savings rate: ${snapshot.savingsRate}%`);

    return {
      answer: `To save ${formatPKR(targetAmount)}:\n\n` +
        `• Your current monthly saving capacity: **${formatPKR(Math.round(monthlyCapacity))}**\n` +
        `• Time needed: **${monthsNeeded} months**\n` +
        `• Current savings rate: **${snapshot.savingsRate}%** of income\n\n` +
        (monthlyCapacity <= 0
          ? `**Challenge:** Your expenses exceed income. Focus on reducing non-essential spending first.`
          : `**Plan:** Set up an automatic transfer of ${formatPKR(Math.round(monthlyCapacity * 0.8))}/month to a separate savings account on payday. You'll reach your goal in approximately ${monthsNeeded} months.`),
      factors,
      data,
    };
  }

  // Emergency fund question
  if (q.includes('emergency') || q.includes('fund') || q.includes('buffer')) {
    const targetMonths = 6;
    const targetAmount = snapshot.monthlyExpenses * targetMonths;
    const gap = targetAmount - snapshot.emergencyReserve;
    const monthlyToBuild = gap > 0 ? Math.round(gap / 12) : 0;

    data.currentEmergency = snapshot.emergencyReserve;
    data.targetAmount = targetAmount;
    data.gap = gap;
    factors.push(`Current emergency fund: ${formatPKR(snapshot.emergencyReserve)} (${snapshot.emergencyMonths.toFixed(1)} months)`);
    factors.push(`Target: ${formatPKR(Math.round(targetAmount))} (${targetMonths} months)`);

    return {
      answer: `Your Emergency Fund Status:\n\n` +
        `• Current: **${formatPKR(snapshot.emergencyReserve)}** (${snapshot.emergencyMonths.toFixed(1)} months of expenses)\n` +
        `• Target: **${formatPKR(Math.round(targetAmount))}** (6 months)\n` +
        `• Gap: **${formatPKR(Math.round(Math.max(0, gap)))}**\n\n` +
        (gap > 0
          ? `**Plan:** Save ${formatPKR(monthlyToBuild)}/month specifically for your emergency fund. At this rate, you'll be fully protected in 12 months. Keep this in a separate, easily accessible account (like Meezan Savings).`
          : `**Great news!** Your emergency fund is fully funded. Consider investing excess emergency funds in a low-risk mutual fund for better returns.`),
      factors,
      data,
    };
  }

  // Affordability
  if (q.includes('afford') || q.includes('can i') || q.includes('buy')) {
    const amountMatch = question.match(/(\d[\d,]*)/);
    const amount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : 0;
    if (amount > 0) {
      const result = await simulateScenario(userId, `Can I afford a Rs. ${amount} purchase?`);
      return {
        answer: `**Can you afford ${formatPKR(amount)}?**\n\n` +
          `Health Score Impact: ${result.currentHealth} → ${result.projectedHealth}\n` +
          `Balance Impact: ${formatPKR(result.currentBalance)} → ${formatPKR(result.projectedBalance)}\n` +
          `Emergency Reserve: ${result.currentEmergencyMonths.toFixed(1)} → ${result.projectedEmergencyMonths.toFixed(1)} months\n\n` +
          `**Recommendation:** ${result.recommendation}`,
        factors: [`Health impact: ${result.projectedHealth - result.currentHealth} points`, `Balance change: ${formatPKR(result.projectedBalance - result.currentBalance)}`],
        data: result,
      };
    }
  }

  // Default response
  return {
    answer: `I can help you with:\n\n` +
      `• **Financial health analysis** - "Why is my health score low?"\n` +
      `• **Spending insights** - "Where am I spending too much?"\n` +
      `• **Savings planning** - "How can I save Rs. 20,000?"\n` +
      `• **Affordability check** - "Can I afford a Rs. 60,000 laptop?"\n` +
      `• **Emergency fund** - "How long to build an emergency fund?"\n\n` +
      `Your current financial snapshot: Income ${formatPKR(snapshot.monthlyIncome)}, Expenses ${formatPKR(snapshot.monthlyExpenses)}, Health Score ${snapshot.healthScore}/100.`,
    factors: [],
    data: { snapshot },
  };
}
