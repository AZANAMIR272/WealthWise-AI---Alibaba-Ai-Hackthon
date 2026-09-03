import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { queryOne, queryRun } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getReliableModel } from '@/lib/gemini-client';
import { v4 as uuid } from 'uuid';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const VALID_CATEGORIES = ['food','transport','shopping','bills','housing','education','healthcare','entertainment','travel','income','savings','debt','transfers','other'];
const VALID_TYPES = ['income','expense','transfer','savings','debt_payment'];

function parseJsonLoose(text: string): any {
  // Strip markdown fences and find JSON
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = Math.min(...['[', '{'].map(c => cleaned.indexOf(c)).filter(i => i >= 0));
  const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (!isFinite(start) || end < 0) return null;
  try {
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!genAI) return NextResponse.json({ error: 'AI is not configured (GEMINI_API_KEY missing)' }, { status: 503 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 });

    const fileName = file.name || 'statement';
    const mimeType = file.type || 'application/octet-stream';

    // Build content parts: prompt + file (PDF/image inline, CSV as text)
    const model = getReliableModel(genAI);
    const extractionPrompt = `You are a bank statement analyzer for Pakistani banks (HBL, UBL, Meezan, Allied, EasyPaisa, JazzCash etc).

Extract ALL transactions from this bank statement: "${fileName}"

Return ONLY a JSON array (no markdown, no explanation):
[{"date":"YYYY-MM-DD","description":"merchant/payee name","amount":1234.50,"type":"expense","category":"food"}]

STRICT RULES:
1. amount = always POSITIVE number (PKR)
2. type = "income" for deposits/salary/credits, "expense" for withdrawals/debits/purchases
3. category = one of: ${VALID_CATEGORIES.join(', ')}
4. Categorize intelligently by Pakistani context:
   - KFC, McDonald's, restaurant, foodpanda, chinatown → "food"
   - Careem, Uber, petrol, PSO, Shell → "transport"
   - K-Electric, SSGC, Sui Gas, PTCL, mobile topup → "bills"
   - Daraz, Alibaba, Imtiaz, Metro, grocery → "shopping"
   - Rent, maintenance → "housing"
   - School, university, fees → "education"
   - Hospital, pharmacy, doctor → "healthcare"
   - Netflix, cinema, games → "entertainment"
   - PIA, Airblue, hotel → "travel"
   - Salary, profit, dividend, refund → "income"
   - Transfer to savings → "savings"
   - Loan, credit card payment → "debt"
5. Convert all dates to YYYY-MM-DD format
6. If a row is not a transaction (balance check, header), skip it
7. Keep description short (max 60 chars)
8. If amounts are in thousands (e.g. "1,500.00 DR"), parse correctly

If the document has NO transactions, return []`;

    const parts: any[] = [{ text: extractionPrompt }];

    if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      parts.push({ inlineData: { mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType, data: buffer.toString('base64') } });
    } else {
      // CSV or text file — read as text
      const text = await file.text();
      parts.push({ text: `\n\nSTATEMENT CONTENT (CSV/text):\n${text.slice(0, 100000)}` });
    }

    const extractResult = await model.generateContent(parts);
    const extractText = extractResult.response.text();
    let transactions = parseJsonLoose(extractText);

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Could not read transactions from this file. Try a clearer PDF/CSV.' }, { status: 422 });
    }

    // Sanitize transactions
    transactions = transactions
      .filter((t: any) => t && typeof t.amount === 'number' && t.amount > 0 && t.date)
      .slice(0, 200)
      .map((t: any) => ({
        date: String(t.date).slice(0, 10),
        description: String(t.description || t.category || 'Transaction').slice(0, 60),
        amount: Math.round(Math.abs(Number(t.amount)) * 100) / 100,
        type: VALID_TYPES.includes(t.type) ? t.type : (t.type === 'income' ? 'income' : 'expense'),
        category: VALID_CATEGORIES.includes(t.category) ? t.category : 'other',
      }));

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No valid transactions found in this statement.' }, { status: 422 });
    }

    // Find or create "Imported Statement" account
    let account = await queryOne(`SELECT id FROM accounts WHERE user_id = ? AND name = 'Imported Statement'`, [userId]);
    if (!account) {
      const accountId = uuid();
      await queryRun(`INSERT INTO accounts (id, user_id, name, type, balance, currency) VALUES (?, ?, ?, ?, 0, 'PKR')`,
        [accountId, userId, 'Imported Statement', 'bank']);
      account = { id: accountId };
    }

    // Insert transactions + compute balance delta
    let balanceDelta = 0;
    for (const t of transactions) {
      const id = uuid();
      await queryRun(`INSERT INTO transactions (id, user_id, account_id, type, amount, category, description, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
        [id, userId, account.id, t.type, t.amount, t.category, t.description, t.date]);
      balanceDelta += t.type === 'income' ? t.amount : -t.amount;
    }
    await queryRun(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`, [balanceDelta, account.id, userId]);

    // Category breakdown
    const byCategory: Record<string, { total: number; count: number }> = {};
    let totalIncome = 0, totalExpense = 0;
    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
      if (!byCategory[t.category]) byCategory[t.category] = { total: 0, count: 0 };
      byCategory[t.category].total += t.amount;
      byCategory[t.category].count += 1;
    }

    // AI savings suggestions
    const suggestionPrompt = `You are "WealthWise AI Coach" — a Pakistani financial advisor. Analyze these extracted bank statement transactions.

TRANSACTIONS SUMMARY (${transactions.length} transactions from ${fileName}):
- Total Income: Rs. ${Math.round(totalIncome).toLocaleString()}
- Total Expenses: Rs. ${Math.round(totalExpense).toLocaleString()}
- Net: Rs. ${Math.round(totalIncome - totalExpense).toLocaleString()}

CATEGORY BREAKDOWN:
${Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, v]) => `- ${cat}: Rs. ${Math.round(v.total).toLocaleString()} (${v.count} transactions)`).join('\n')}

Return ONLY JSON (no markdown):
{
  "summary": "2-3 sentence spending pattern analysis",
  "monthly_save_target": number (realistic PKR amount to save monthly),
  "top_category": "highest expense category",
  "suggestions": [
    {"category": "food", "issue": "what's wrong", "save_amount": 2000, "tip": "practical Pakistani-context tip"},
    ... (3-5 suggestions for highest-spend categories)
  ],
  "general_advice": "1-2 sentence overall advice"
}

TIPS RULES:
- save_amount = realistic monthly savings from that category (PKR)
- Tips must be practical for Pakistan (e.g. "foodpanda ki jagah ghar ka khana", "Careem bike mode", "bulk buying from Imtiaz")
- Be warm, use light Roman Urdu where natural`;

    let analysis: any = null;
    try {
      const sugResult = await model.generateContent([{ text: suggestionPrompt }]);
      analysis = parseJsonLoose(sugResult.response.text());
    } catch { /* suggestions optional */ }

    return NextResponse.json({
      imported: transactions.length,
      accountName: 'Imported Statement',
      balanceDelta: Math.round(balanceDelta),
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      transactions: transactions.slice(0, 50),
      byCategory: Object.entries(byCategory)
        .map(([category, v]) => ({ category, total: Math.round(v.total), count: v.count }))
        .sort((a, b) => b.total - a.total),
      analysis,
    });
  } catch (err: any) {
    console.error('Statement AI error:', err.message);
    return NextResponse.json({ error: 'Statement analysis failed: ' + err.message }, { status: 500 });
  }
}
