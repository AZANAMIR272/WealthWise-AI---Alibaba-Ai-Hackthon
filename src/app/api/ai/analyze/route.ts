import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getReliableModel } from '@/lib/gemini-client';
import { getFinancialSnapshot, analyzeGoals, getRiskRadar, calculateSafeToSpend } from '@/lib/financial-engine';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function parseJSON(text: string): any {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Try to find JSON object in the text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse AI response as JSON');
  }
}

function formatPKR(n: number): string {
  if (Math.abs(n) >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)} Crore`;
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

async function getFinancialContext(userId: string): Promise<string> {
  const snapshot = await getFinancialSnapshot(userId);
  const goals = await analyzeGoals(userId);
  const risks = await getRiskRadar(userId);
  const safeSpend = await calculateSafeToSpend(userId);
  return `
INCOME & EXPENSES:
- Monthly Income: ${formatPKR(snapshot.monthlyIncome)}
- Monthly Expenses: ${formatPKR(snapshot.monthlyExpenses)}
- Monthly Savings: ${formatPKR(snapshot.monthlySavings)}
- Monthly Debt Payments: ${formatPKR(snapshot.monthlyDebtPayments)}
- Savings Rate: ${snapshot.savingsRate}%
- Monthly Surplus: ${formatPKR(snapshot.monthlyIncome - snapshot.monthlyExpenses)}

BALANCES:
- Total Balance: ${formatPKR(snapshot.totalBalance)}
- Liquid Balance: ${formatPKR(snapshot.liquidBalance)}
- Emergency Reserve: ${formatPKR(snapshot.emergencyReserve)} (${snapshot.emergencyMonths} months)
- Total Debt: ${formatPKR(snapshot.totalDebt)}
- Net Worth: ${formatPKR(snapshot.netWorth)}

HEALTH SCORE: ${snapshot.healthScore}/100
${snapshot.healthFactors.map(f => `- ${f.name}: ${f.score}/${f.maxScore} (${f.status}) - ${f.explanation}`).join('\n')}

SPENDING (Monthly):
${snapshot.categoryBreakdown.map(c => `- ${c.category}: ${formatPKR(c.amount)} (${c.percentage}%)`).join('\n')}

SAFE-TO-SPEND: Today: ${formatPKR(safeSpend.today)} | Week: ${formatPKR(safeSpend.thisWeek)} | Month: ${formatPKR(safeSpend.thisMonth)}

GOALS:
${goals.map(g => `- ${g.name}: ${formatPKR(g.current)}/${formatPKR(g.target)} (${g.progress}%) - ${g.status} - ${g.explanation}`).join('\n')}

RISKS:
${risks.length > 0 ? risks.map(r => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.description}`).join('\n') : '- No significant risks'}

CURRENCY: PKR | COUNTRY: Pakistan`;
}

// ─── Ripple Engine ───────────────────────────────────────────
async function rippleAnalysis(userId: string, decision: string): Promise<any> {
  const context = await getFinancialContext(userId);
  if (!genAI) return { error: 'AI not configured. Set GEMINI_API_KEY.', ripples: [] };

  const model = getReliableModel(genAI);
  const prompt = `You are a Financial Ripple Engine. The user is considering this financial decision:
"${decision}"

USER'S REAL FINANCIAL DATA:
${context}

Analyze ALL downstream effects of this decision in the short term (1 month), medium term (6 months), and long term (12+ months). Return ONLY valid JSON, no markdown:

{
  "decision": "brief decision summary",
  "verdict": "GO" | "CAUTION" | "NO-GO",
  "verdictReason": "one line explanation",
  "ripples": [
    {
      "id": 1,
      "category": "category name",
      "impact": "description of impact",
      "magnitude": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "direction": "positive" | "negative" | "neutral",
      "timeframe": "1 month" | "6 months" | "12 months",
      "amount": estimated_amount_impact_in_PKR,
      "icon": "emoji for category"
    }
  ],
  "chainReaction": "describe the chain reaction this decision triggers",
  "safeAlternatives": ["alternative 1", "alternative 2"],
  "monthlyImpact": estimated_monthly_impact_in_PKR,
  "riskScore": 0-100,
  "summary": "2-3 sentence summary in Roman Urdu/English mix"
}

Return 5-8 ripples covering different aspects (savings, goals, emergency fund, lifestyle, debt, investments). Use REAL numbers from user data.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

// ─── Parallel Futures ───────────────────────────────────────────
async function parallelFuturesAnalysis(userId: string, decision: string): Promise<any> {
  const context = await getFinancialContext(userId);
  if (!genAI) return { error: 'AI not configured.', futures: [] };

  const model = getReliableModel(genAI);
  const prompt = `You simulate multiple parallel futures for a financial decision. The user asks:
"${decision}"

USER'S REAL FINANCIAL DATA:
${context}

Create 3 parallel futures: BUY/DO IT, WAIT/HOLD, DON'T DO IT. Return ONLY valid JSON:

{
  "decision": "brief summary",
  "futures": [
    {
      "label": "Buy Now / Do It",
      "emoji": "🟢",
      "tagline": "short tagline",
      "description": "2-3 line description of this future",
      "month3Balance": number,
      "month6Balance": number,
      "month12Balance": number,
      "healthScore": number,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"],
      "surprise": "unexpected consequence"
    },
    {
      "label": "Wait / Hold",
      "emoji": "🟡",
      "tagline": "short tagline",
      "description": "2-3 line description",
      "month3Balance": number,
      "month6Balance": number,
      "month12Balance": number,
      "healthScore": number,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"],
      "surprise": "unexpected consequence"
    },
    {
      "label": "Don't Do It",
      "emoji": "🔴",
      "tagline": "short tagline",
      "description": "2-3 line description",
      "month3Balance": number,
      "month6Balance": number,
      "month12Balance": number,
      "healthScore": number,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"],
      "surprise": "unexpected consequence"
    }
  ],
  "recommendation": "which future is best and why (Roman Urdu/English)",
  "winner": 0 | 1 | 2
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

// ─── Financial GPS ───────────────────────────────────────────
async function gpsAnalysis(userId: string, goal: string): Promise<any> {
  const context = await getFinancialContext(userId);
  if (!genAI) return { error: 'AI not configured.', waypoints: [] };

  const model = getReliableModel(genAI);
  const prompt = `You are a Financial GPS — navigation system from current position to a financial goal.
Goal: "${goal}"

USER'S REAL FINANCIAL DATA:
${context}

Create a step-by-step route with waypoints. Return ONLY valid JSON:

{
  "goal": "goal description",
  "currentPosition": "description of where user is now financially",
  "eta": "estimated time to reach goal",
  "distance": "gap amount in PKR",
  "route": [
    {
      "step": 1,
      "title": "step title",
      "description": "what to do",
      "timeline": "when",
      "action": "specific action",
      "milestone": number_in_PKR,
      "completed": false
    }
  ],
  "detours": ["potential obstacle 1", "potential obstacle 2"],
  "shortcuts": ["optimization 1", "optimization 2"],
  "fuelRequired": "monthly saving amount needed",
  "summary": "encouraging summary in Roman Urdu/English"
}

Return 4-6 route steps. Use REAL numbers from user data.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

// ─── Financial Time Machine ───────────────────────────────────────────
async function timeMachineAnalysis(userId: string, pastDecision: string, monthsBack: number): Promise<any> {
  const context = await getFinancialContext(userId);
  if (!genAI) return { error: 'AI not configured.' };

  const model = getReliableModel(genAI);
  const prompt = `You are a Financial Time Machine. The user wants to see what would have happened if they made a different decision ${monthsBack} months ago.

What they wish they did differently: "${pastDecision}"

USER'S CURRENT FINANCIAL DATA:
${context}

Calculate the alternate reality if this decision had been made ${monthsBack} months ago. Return ONLY valid JSON:

{
  "originalDecision": "what actually happened (estimated)",
  "alternateDecision": "what they wish they did",
  "monthsBack": ${monthsBack},
  "alternateReality": {
    "balanceNow": number,
    "balanceWouldBe": number,
    "savingsDifference": number,
    "healthNow": number,
    "healthWouldBe": number,
    "goalsCompletedNow": number,
    "goalsCompletedWouldBe": number
  },
  "timeline": [
    { "month": 1, "reality": "what happened", "alternate": "what could have been", "balanceDiff": number },
    { "month": 2, "reality": "what happened", "alternate": "what could have been", "balanceDiff": number },
    { "month": 3, "reality": "what happened", "alternate": "what could have been", "balanceDiff": number }
  ],
  "lesson": "what this teaches us (Roman Urdu/English)",
  "actionNow": "what to do NOW to recover",
  "futureRecovery": "how long to recover if they act now"
}

Return timeline for each month up to ${monthsBack} months. Be realistic, use actual numbers.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

// ─── Goal Marketplace ───────────────────────────────────────────
async function marketplaceAnalysis(userId: string, goalType: string): Promise<any> {
  const context = await getFinancialContext(userId);
  if (!genAI) return { error: 'AI not configured.', strategies: [] };

  const model = getReliableModel(genAI);
  const prompt = `You are a Goal Marketplace — recommend strategies, resources, and products based on a financial goal.
Goal type: "${goalType}"

USER'S REAL FINANCIAL DATA:
${context}

Recommend practical strategies and resources available in Pakistan. Return ONLY valid JSON:

{
  "goalType": "goal type",
  "strategies": [
    {
      "name": "strategy name",
      "description": "2-3 line description",
      "difficulty": "Easy" | "Medium" | "Hard",
      "timeToResult": "estimated time",
      "potentialSavings": estimated_amount_in_PKR,
      "icon": "emoji",
      "steps": ["step 1", "step 2", "step 3"]
    }
  ],
  "resources": [
    {
      "name": "resource name",
      "type": "App" | "Book" | "Website" | "Account Type",
      "description": "what it does",
      "url": "URL if applicable",
      "icon": "emoji"
    }
  ],
  "quickWins": ["immediate action 1", "immediate action 2"],
  "summary": "encouraging summary in Roman Urdu/English"
}

Return 4-6 strategies and 3-4 resources. Focus on Pakistan-specific resources (Meezan Bank, HBL, EasyPaisa, JazzCash, NayaPay, Raast, etc).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

// ─── Main Handler ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, query, goalType, monthsBack } = await req.json();

    switch (type) {
      case 'ripple':
        return NextResponse.json(await rippleAnalysis(userId, query));
      case 'parallel':
        return NextResponse.json(await parallelFuturesAnalysis(userId, query));
      case 'gps':
        return NextResponse.json(await gpsAnalysis(userId, query));
      case 'time-machine':
        return NextResponse.json(await timeMachineAnalysis(userId, query, monthsBack || 6));
      case 'marketplace':
        return NextResponse.json(await marketplaceAnalysis(userId, goalType || query));
      default:
        return NextResponse.json({ error: 'Unknown analysis type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Analyze error:', error);
    const msg = error?.message || 'Analysis failed. Please try again.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
