import { GoogleGenerativeAI } from '@google/generative-ai';
import { getReliableModel, streamReliable } from './gemini-client';
import { getFinancialSnapshot, simulateScenario, getRiskRadar, analyzeGoals, calculateSafeToSpend } from './financial-engine';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function formatPKR(n: number): string {
  if (Math.abs(n) >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)} Crore`;
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

async function buildFinancialContext(userId: string): Promise<string> {
  const snapshot = await getFinancialSnapshot(userId);
  const goals = await analyzeGoals(userId);
  const risks = await getRiskRadar(userId);
  const safeSpend = await calculateSafeToSpend(userId);

  return `
=== USER'S COMPLETE FINANCIAL DATA (Use ONLY these real numbers, never invent numbers) ===

INCOME & EXPENSES:
- Monthly Income: ${formatPKR(snapshot.monthlyIncome)}
- Monthly Expenses: ${formatPKR(snapshot.monthlyExpenses)}
- Monthly Savings: ${formatPKR(snapshot.monthlySavings)}
- Monthly Debt Payments: ${formatPKR(snapshot.monthlyDebtPayments)}
- Savings Rate: ${snapshot.savingsRate}%
- Monthly Surplus: ${formatPKR(snapshot.monthlyIncome - snapshot.monthlyExpenses)}

BALANCES:
- Total Balance: ${formatPKR(snapshot.totalBalance)}
- Liquid Balance (bank+cash+wallet): ${formatPKR(snapshot.liquidBalance)}
- Emergency Reserve (savings+investments): ${formatPKR(snapshot.emergencyReserve)}
- Total Debt: ${formatPKR(snapshot.totalDebt)}
- Total Assets: ${formatPKR(snapshot.totalAssets)}
- Net Worth: ${formatPKR(snapshot.netWorth)}

FINANCIAL HEALTH (Score: ${snapshot.healthScore}/100):
${snapshot.healthFactors.map(f => `- ${f.name}: ${f.score}/${f.maxScore} (${f.status}) - ${f.explanation}`).join('\n')}

SPENDING BREAKDOWN (Monthly):
${snapshot.categoryBreakdown.map(c => `- ${c.category}: ${formatPKR(c.amount)} (${c.percentage}%)`).join('\n')}

SAFE-TO-SPEND:
- Today: ${formatPKR(safeSpend.today)}
- This Week: ${formatPKR(safeSpend.thisWeek)}
- This Month: ${formatPKR(safeSpend.thisMonth)}
- Explanation: ${safeSpend.explanation}

GOALS:
${goals.map(g => `- ${g.name}: ${formatPKR(g.current)}/${formatPKR(g.target)} (${g.progress}%) - Status: ${g.status} - ${g.explanation}${g.alternativePlan ? ` Alternative: ${g.alternativePlan}` : ''}`).join('\n')}

RISKS DETECTED:
${risks.length > 0 ? risks.map(r => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.description} | Why: ${r.why} | Action: ${r.action}`).join('\n') : '- No significant risks detected'}

CURRENCY: Pakistani Rupees (PKR/Rs.)
COUNTRY: Pakistan
`;
}

export async function askAI(userId: string, question: string, chatHistory: Array<{ role: string; content: string }> = []): Promise<{ answer: string; factors: string[]; data: any }> {
  const context = await buildFinancialContext(userId);
  const snapshot = await getFinancialSnapshot(userId);
  const goalsData = await analyzeGoals(userId);
  const risksData = await getRiskRadar(userId);
  const safeSpendData = await calculateSafeToSpend(userId);

  // Check if it's a simulation question
  const simKeywords = ['afford', 'what if', 'what happens if', 'kya main', 'agar', 'simulat', 'buy', 'purchase', 'kharid'];
  const isSimQuestion = simKeywords.some(k => question.toLowerCase().includes(k));

  if (isSimQuestion) {
    try {
      const simResult = await simulateScenario(userId, question);
      const simContext = `\n\nSIMULATION RESULT (already calculated from real data):
Scenario: ${simResult.scenario}
Health: ${simResult.currentHealth} → ${simResult.projectedHealth}
Balance: ${formatPKR(simResult.currentBalance)} → ${formatPKR(simResult.projectedBalance)}
Emergency: ${simResult.currentEmergencyMonths} → ${simResult.projectedEmergencyMonths} months
Risk: ${simResult.currentRisk} → ${simResult.projectedRisk}
Savings Rate: ${simResult.currentSavingsRate}% → ${simResult.projectedSavingsRate}%
Recommendation: ${simResult.recommendation}
Warnings: ${simResult.warnings.join(', ') || 'None'}`;

      if (genAI) {
        const model = getReliableModel(genAI);
        const prompt = `You are "WealthWise AI Coach" — a warm, knowledgeable Pakistani financial advisor who speaks naturally in English, Urdu, and Roman Urdu/Hinglish.

${context}
${simContext}

IMPORTANT RULES:
1. Use ONLY the real numbers from the user's data above. NEVER invent or guess numbers.
2. Be warm, encouraging, and practical. Use Pakistani cultural references when relevant.
3. Support English, Urdu, and Roman Urdu/Hinglish seamlessly.
4. Always explain WHY behind every recommendation.
5. If the user asks in Urdu/Roman Urdu, respond in the same language.
6. Reference the simulation results naturally in your explanation.
7. Keep responses concise but comprehensive (3-5 paragraphs max).
8. Format using markdown: **bold** for emphasis, bullet points for lists.

User's question: "${question}"

Respond as their personal AI Financial Coach:`;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        return {
          answer,
          factors: simResult.impactSummary.map(i => `${i.metric}: ${i.before} → ${i.after} (${i.detail})`),
          data: simResult,
        };
      }
      // Fallback without Gemini
      return {
        answer: buildLocalSimResponse(simResult, question),
        factors: simResult.impactSummary.map(i => `${i.metric}: ${i.before} → ${i.after}`),
        data: simResult,
      };
    } catch (e) {
      // Fall through to general AI
    }
  }

  // General AI response
  if (genAI) {
    const model = getReliableModel(genAI);
    const historyMessages = chatHistory.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const prompt = `You are "WealthWise AI Coach" — a warm, knowledgeable Pakistani financial advisor.

${context}

IMPORTANT RULES:
1. Use ONLY the real numbers from the user's data above. NEVER invent or guess numbers.
2. Be warm, encouraging, practical. Use Pakistani cultural references when relevant (chai ki dukan, biryani budget, etc).
3. Support English, Urdu, and Roman Urdu/Hinglish seamlessly. If user writes in Roman Urdu, respond in Roman Urdu.
4. Always explain WHY behind every recommendation.
5. Keep responses concise (3-5 paragraphs max).
6. Format using markdown: **bold** for emphasis, bullet points for lists.
7. If user asks about affordability or "what if", explain that they should use the What-If Simulator for detailed analysis.
8. Reference specific numbers from their data to make advice personal and trustworthy.

User's question: "${question}"

Respond as their personal AI Financial Coach:`;

    try {
      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      // Extract factors from context for transparency
      const factors = snapshot.healthFactors
        .filter(f => f.status !== 'healthy')
        .map(f => `${f.name}: ${f.explanation}`)
        .slice(0, 3);

      return { answer, factors, data: { healthScore: snapshot.healthScore } };
    } catch (err: any) {
      console.error('Gemini error:', err.message);
      return buildLocalResponse(snapshot, goalsData, risksData, safeSpendData, question);
    }
  }

  // No Gemini API key - use enhanced local response
  return buildLocalResponse(snapshot, goalsData, risksData, safeSpendData, question);
}

/**
 * Streaming version of askAI — yields SSE-formatted chunks for instant text display.
 * Format: each chunk is either raw text or a JSON metadata line prefixed with `__META__`.
 */
export async function* streamChatAI(
  userId: string,
  question: string,
  chatHistory: Array<{ role: string; content: string }> = []
): AsyncGenerator<string> {
  const context = await buildFinancialContext(userId);
  const snapshot = await getFinancialSnapshot(userId);
  const goalsData = await analyzeGoals(userId);
  const risksData = await getRiskRadar(userId);
  const safeSpendData = await calculateSafeToSpend(userId);

  if (!genAI) {
    const local = buildLocalResponse(snapshot, goalsData, risksData, safeSpendData, question);
    yield local.answer;
    yield `\n__META__${JSON.stringify({ factors: [], data: {} })}`;
    return;
  }

  // Check simulation keywords
  const simKeywords = ['afford', 'what if', 'what happens if', 'kya main', 'agar', 'simulat', 'buy', 'purchase', 'kharid'];
  const isSimQuestion = simKeywords.some(k => question.toLowerCase().includes(k));

  if (isSimQuestion) {
    try {
      const simResult = await simulateScenario(userId, question);
      const simContext = `\n\nSIMULATION RESULT:\nScenario: ${simResult.scenario}\nHealth: ${simResult.currentHealth} → ${simResult.projectedHealth}\nBalance: ${formatPKR(simResult.currentBalance)} → ${formatPKR(simResult.projectedBalance)}\nRecommendation: ${simResult.recommendation}`;

      const prompt = `You are "WealthWise AI Coach" — a warm Pakistani financial advisor.\n\n${context}\n${simContext}\n\nRespond naturally in English/Urdu/Roman Urdu. Use ONLY real numbers. Be concise (3-5 paragraphs). Use **bold** and bullet points.\n\nUser: "${question}"`;

      const factors = simResult.impactSummary.map((i: any) => `${i.metric}: ${i.before} → ${i.after} (${i.detail})`);

      for await (const chunk of streamReliable(genAI, prompt)) {
        yield chunk;
      }
      yield `\n__META__${JSON.stringify({ factors, data: simResult })}`;
      return;
    } catch {}
  }

  // General chat
  const prompt = `You are "WealthWise AI Coach" — a warm, knowledgeable Pakistani financial advisor.\n\n${context}\n\nRULES: Use ONLY real numbers from data. Be warm and practical. Support English/Urdu/Roman Urdu. Explain WHY. Concise (3-5 paragraphs). Use **bold** and bullets. Reference specific numbers.\n\nUser: "${question}"`;

  const factors = snapshot.healthFactors
    .filter(f => f.status !== 'healthy')
    .map(f => `${f.name}: ${f.explanation}`)
    .slice(0, 3);

  try {
    for await (const chunk of streamReliable(genAI, prompt)) {
      yield chunk;
    }
    yield `\n__META__${JSON.stringify({ factors, data: { healthScore: snapshot.healthScore } })}`;
  } catch (err: any) {
    console.error('Stream error:', err.message);
    const local = buildLocalResponse(snapshot, goalsData, risksData, safeSpendData, question);
    yield local.answer;
    yield `\n__META__${JSON.stringify({ factors: [], data: {} })}`;
  }
}

function buildLocalSimResponse(sim: any, question: string): string {
  let answer = `**Simulation: ${question}**\n\n`;
  answer += `Based on your actual financial data:\n\n`;
  answer += `• Health Score: **${sim.currentHealth}** → **${sim.projectedHealth}** (${sim.projectedHealth - sim.currentHealth >= 0 ? '+' : ''}${sim.projectedHealth - sim.currentHealth} points)\n`;
  answer += `• Balance: **${formatPKR(sim.currentBalance)}** → **${formatPKR(sim.projectedBalance)}**\n`;
  answer += `• Emergency Reserve: **${sim.currentEmergencyMonths}** → **${sim.projectedEmergencyMonths}** months\n`;
  answer += `• Risk: **${sim.currentRisk}** → **${sim.projectedRisk}**\n\n`;

  if (sim.warnings.length > 0) {
    answer += `**⚠ Warnings:**\n${sim.warnings.map((w: string) => `• ${w}`).join('\n')}\n\n`;
  }

  answer += `**Recommendation:** ${sim.recommendation}`;
  return answer;
}

function buildLocalResponse(snapshot: any, goals: any[], risks: any[], safeSpend: any, question: string): { answer: string; factors: string[]; data: any } {
  const q = question.toLowerCase();
  const factors: string[] = [];

  // Add Gemini setup notice
  const geminiNotice = `\n\n---\n*💡 **Pro Tip:** Set your \`GEMINI_API_KEY\` in \`.env.local\` for full AI-powered responses. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)*\n`;

  if (q.includes('health') || q.includes('score') || q.includes('improve') || q.includes('low') || q.includes('kaisa')) {
    factors.push(...snapshot.healthFactors.map((f: any) => `${f.name}: ${f.score}/${f.maxScore} - ${f.explanation}`));
    return {
      answer: `Your financial health score is **${snapshot.healthScore}/100**. Here's the breakdown:\n\n` +
        snapshot.healthFactors.map((f: any) => `• **${f.name}** (${f.score}/${f.maxScore}): ${f.explanation}`).join('\n') +
        `\n\n**To improve:** Focus on your weakest areas: ${snapshot.healthFactors.filter((f: any) => f.status !== 'healthy').map((f: any) => f.name).join(', ') || 'keep maintaining your good habits!'}.\n\n` +
        `Your monthly income is ${formatPKR(snapshot.monthlyIncome)}, expenses are ${formatPKR(snapshot.monthlyExpenses)}, and you save ${formatPKR(snapshot.monthlySavings)} (${snapshot.savingsRate}% savings rate).` +
        geminiNotice,
      factors,
      data: { healthScore: snapshot.healthScore },
    };
  }

  if (q.includes('spend') || q.includes('expense') || q.includes('where') || q.includes('too much') || q.includes('kharcha')) {
    return {
      answer: `Your top spending categories:\n\n` +
        snapshot.categoryBreakdown.slice(0, 5).map((c: any, i: number) =>
          `${i + 1}. **${c.category.charAt(0).toUpperCase() + c.category.slice(1)}**: ${formatPKR(c.amount)}/month (${c.percentage}% of expenses)`
        ).join('\n') +
        `\n\nTotal monthly expenses: **${formatPKR(snapshot.monthlyExpenses)}**\n\n` +
        `Your spending distribution ${snapshot.categoryBreakdown[0]?.percentage > 30 ? 'shows room for optimization in ' + snapshot.categoryBreakdown[0].category : 'looks reasonable'}. Focus on maintaining your ${snapshot.savingsRate}% savings rate.` +
        geminiNotice,
      factors: snapshot.categoryBreakdown.slice(0, 3).map((c: any) => `${c.category}: ${formatPKR(c.amount)} (${c.percentage}%)`),
      data: { categories: snapshot.categoryBreakdown },
    };
  }

  if (q.includes('save') || q.includes('saving') || q.includes('bacha') || q.includes('savings')) {
    const capacity = snapshot.monthlyIncome - snapshot.monthlyExpenses;
    return {
      answer: `**Your Savings Analysis:**\n\n` +
        `• Monthly income: **${formatPKR(snapshot.monthlyIncome)}**\n` +
        `• Monthly expenses: **${formatPKR(snapshot.monthlyExpenses)}**\n` +
        `• Current savings: **${formatPKR(snapshot.monthlySavings)}** (${snapshot.savingsRate}%)\n` +
        `• Maximum saving capacity: **${formatPKR(Math.round(capacity))}**/month\n\n` +
        (capacity > 0
          ? `You can save up to ${formatPKR(Math.round(capacity))} per month. Try automating a transfer of ${formatPKR(Math.round(capacity * 0.7))}/month on payday.`
          : `Your expenses exceed your income. Focus on cutting non-essential spending first.`) +
        geminiNotice,
      factors: [`Saving capacity: ${formatPKR(Math.round(capacity))}/month`, `Current rate: ${snapshot.savingsRate}%`],
      data: { monthlyCapacity: capacity },
    };
  }

  if (q.includes('emergency') || q.includes('fund') || q.includes('buffer')) {
    const target = snapshot.monthlyExpenses * 6;
    const gap = target - snapshot.emergencyReserve;
    return {
      answer: `**Emergency Fund Status:**\n\n` +
        `• Current: **${formatPKR(snapshot.emergencyReserve)}** (${snapshot.emergencyMonths} months)\n` +
        `• Target (6 months): **${formatPKR(Math.round(target))}**\n` +
        `• Gap: **${formatPKR(Math.round(Math.max(0, gap)))}**\n\n` +
        (gap > 0
          ? `Save ${formatPKR(Math.round(gap / 12))}/month to fully fund your emergency reserve in 12 months.`
          : `Your emergency fund is fully funded! Consider investing excess reserves.`) +
        geminiNotice,
      factors: [`Current: ${snapshot.emergencyMonths} months`, `Target: 6 months`],
      data: { gap },
    };
  }

  if (q.includes('risk') || q.includes('safe') || q.includes('khatra')) {
    return {
      answer: `**Risk Assessment:**\n\n` +
        (risks.length > 0
          ? risks.map((r: any) => `• **[${r.severity.toUpperCase()}]** ${r.title}: ${r.description}\n  → ${r.action}`).join('\n')
          : `No significant risks detected! Your finances look stable.`) +
        `\n\nYour safe-to-spend this month: **${formatPKR(safeSpend.thisMonth)}**` +
        geminiNotice,
      factors: risks.map((r: any) => r.title),
      data: { risks },
    };
  }

  if (q.includes('goal') || q.includes('target') || q.includes('maqsad')) {
    return {
      answer: `**Your Financial Goals:**\n\n` +
        goals.map((g: any) => `• **${g.name}**: ${formatPKR(g.current)}/${formatPKR(g.target)} (${g.progress}%) — *${g.status}*\n  ${g.explanation}`).join('\n') +
        geminiNotice,
      factors: goals.map((g: any) => `${g.name}: ${g.status}`),
      data: { goals },
    };
  }

  return {
    answer: `**WealthWise AI Coach** — Main aapka personal financial advisor hoon!\n\n` +
      `I can help you with:\n\n` +
      `• **"Why is my health score low?"** — Detailed health analysis\n` +
      `• **"Where am I spending too much?"** — Spending breakdown\n` +
      `• **"How can I save more?"** — Savings strategy\n` +
      `• **"Can I afford Rs. X?"** — Use the What-If Simulator!\n` +
      `• **"Emergency fund status?"** — Emergency analysis\n` +
      `• **"Show my risks"** — Risk radar\n` +
      `• **Urdu/Roman Urdu bhi chalega!** — "Meri savings kaise barhaun?"\n\n` +
      `Your quick snapshot: Income ${formatPKR(snapshot.monthlyIncome)}, Expenses ${formatPKR(snapshot.monthlyExpenses)}, Health ${snapshot.healthScore}/100` +
      geminiNotice,
    factors: [],
    data: { snapshot },
  };
}
