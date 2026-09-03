'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { LogoIcon } from '@/components/logo';
import { useLang } from '@/lib/i18n';
import {
  Sparkles, Send, Loader2, TrendingUp, TrendingDown, ArrowRight,
  AlertTriangle, CheckCircle, Info, Zap, Brain, Shield, DollarSign,
  ChevronRight, Lightbulb, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SimulationResult {
  scenario: string;
  currentHealth: number; projectedHealth: number;
  currentBalance: number; projectedBalance: number;
  currentEmergencyMonths: number; projectedEmergencyMonths: number;
  currentRisk: string; projectedRisk: string;
  currentSavingsRate: number; projectedSavingsRate: number;
  impactSummary: Array<{ metric: string; before: string; after: string; change: string; detail: string }>;
  timeline: Array<{ month: string; balance: number; savings: number; projected: boolean }>;
  recommendation: string; explanation: string; warnings: string[];
}

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const EXAMPLE_QUERIES = [
  "Can I afford a Rs. 60,000 laptop?",
  "What if my salary is delayed by 15 days?",
  "What if I save Rs. 5,000 every month?",
  "What if my income decreases by 20%?",
  "Can I save Rs. 100,000 in six months?",
  "What if I have an unexpected medical expense of Rs. 50,000?",
  "What if I spend Rs. 15,000 more on entertainment?",
  "What if I get a 15% salary raise?",
];

function HealthMeter({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'text-green-500' : value >= 50 ? 'text-gold-500' : 'text-red-500';
  const bg = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-gold-500' : 'bg-red-500';
  return (
    <div className="text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
      <div className="w-full h-2 rounded-full bg-gray-700/20 mt-2 overflow-hidden">
        <div className={`h-full rounded-full ${bg} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const currentUser = useCurrentUser();
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const runSimulation = async (q?: string) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'simulate', query: question }),
      });
      const data = await res.json();
      setResult(data);
      setHistory(prev => [question, ...prev.filter(h => h !== question)].slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <LogoIcon size="md" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('simTitle')}</h1>
                <p className="text-muted text-sm font-medium">{t('simSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                placeholder='Ask "Can I afford a Rs. 60,000 laptop?" or "What if my salary is delayed?"'
                className="flex-1 px-4 py-3.5 rounded-xl bg-background border border-surface-border text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
              />
              <button
                onClick={() => runSimulation()}
                disabled={loading || !query.trim()}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('simulate')}
              </button>
            </div>

            {/* Example queries */}
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); runSimulation(q); }}
                  className="px-3 py-1.5 rounded-lg bg-primary-500/5 border border-primary-500/10 text-xs text-primary-400 hover:bg-primary-500/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.slice(4).map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); runSimulation(q); }}
                  className="px-3 py-1.5 rounded-lg bg-primary-500/5 border border-primary-500/10 text-xs text-primary-400 hover:bg-primary-500/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center mb-6">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
              <p className="text-foreground font-medium">{lang === 'en' ? 'Running financial simulation...' : 'مالی سمیلیشن چل رہی ہے...'}</p>
              <p className="text-muted text-sm mt-1">{lang === 'en' ? 'Analyzing your Financial Digital Twin' : 'آپ کے فنانشل ڈیجیٹل ٹوئن کا تجزیہ ہو رہا ہے'}</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-5">
              {/* Scenario Header */}
              <div className="bg-gradient-to-r from-primary-900/30 to-primary-800/20 border border-primary-700/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-primary-400 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Scenario: {result.scenario}</h3>
                    <p className="text-xs text-muted mt-1">Based on your actual financial data — no AI-generated numbers</p>
                  </div>
                </div>
              </div>

              {/* Current → What If → Future Journey */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Reality */}
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-500">1</div>
                    <h4 className="text-sm font-semibold text-foreground">{lang === 'en' ? 'Current Reality' : 'موجودہ حالت'}</h4>
                  </div>
                  <HealthMeter value={result.currentHealth} label={t('healthScore')} />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Liquid Balance</span>
                      <span className="font-medium text-foreground">{formatPKR(result.currentBalance)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Emergency Reserve</span>
                      <span className="font-medium text-foreground">{result.currentEmergencyMonths.toFixed(1)} months</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Risk Level</span>
                      <span className={`font-medium ${result.currentRisk === 'Low' ? 'text-green-500' : result.currentRisk === 'Medium' ? 'text-gold-500' : 'text-red-500'}`}>
                        {result.currentRisk}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{lang === 'en' ? 'Savings Rate' : 'بچت کی شرح'}</span>
                      <span className="font-medium text-foreground">{result.currentSavingsRate}%</span>
                    </div>
                  </div>
                </div>

                {/* What If (Arrow) */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-b from-gold-500/5 to-gold-500/10 border border-gold-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gold-500/10 flex items-center justify-center text-xs font-bold text-gold-500">2</div>
                    <h4 className="text-sm font-semibold text-foreground">What If</h4>
                  </div>
                  <div className="my-4">
                    <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto">
                      <Zap className="w-8 h-8 text-gold-500" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-foreground font-medium">{result.scenario}</p>
                  <div className="mt-4 flex items-center gap-1 text-gold-500 text-xs font-medium">
                    <ArrowRight className="w-4 h-4" />
                    <span>Simulating impact</span>
                  </div>
                </div>

                {/* Projected Future */}
                <div className={`bg-surface border rounded-2xl p-5 ${result.projectedHealth >= result.currentHealth ? 'border-green-500/30' : 'border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-500">3</div>
                    <h4 className="text-sm font-semibold text-foreground">{lang === 'en' ? 'Possible Future' : 'ممکنہ مستقبل'}</h4>
                  </div>
                  <HealthMeter value={result.projectedHealth} label={t('healthScore')} />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Liquid Balance</span>
                      <span className={`font-medium ${result.projectedBalance >= result.currentBalance ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPKR(result.projectedBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Emergency Reserve</span>
                      <span className="font-medium text-foreground">{result.projectedEmergencyMonths.toFixed(1)} months</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Risk Level</span>
                      <span className={`font-medium ${result.projectedRisk === 'Low' ? 'text-green-500' : result.projectedRisk === 'Medium' ? 'text-gold-500' : 'text-red-500'}`}>
                        {result.projectedRisk}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{lang === 'en' ? 'Savings Rate' : 'بچت کی شرح'}</span>
                      <span className="font-medium text-foreground">{result.projectedSavingsRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Summary Table */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary-500" />
                  Impact Summary ({lang === 'en' ? 'Before & After' : 'پہلے اور بعد'})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted">Metric</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted">Before</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted">After</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.impactSummary.map((item, i) => (
                        <tr key={i} className="border-b border-surface-border/50">
                          <td className="py-2.5 px-3 font-medium text-foreground text-xs">{item.metric}</td>
                          <td className="py-2.5 px-3 text-foreground text-xs">{item.before}</td>
                          <td className="py-2.5 px-3 text-foreground text-xs">{item.after}</td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              item.change === 'positive' ? 'text-green-500' : item.change === 'negative' ? 'text-red-500' : 'text-muted'
                            }`}>
                              {item.change === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {item.detail}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Warnings
                  </h3>
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-red-400/80 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span> {w}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Chart */}
              {result.timeline.length > 0 && (
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    12-{lang === 'en' ? 'Month' : 'ماہ'} Projection
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.timeline}>
                        <defs>
                          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: '#111a11', border: '1px solid #1e3a1e', borderRadius: 12, fontSize: 12 }}
                          formatter={(v: any) => [`Rs. ${Number(v).toLocaleString('en-PK')}`, '']} />
                        <Area type="monotone" dataKey="balance" stroke="#059669" fill="url(#balGrad)" strokeWidth={2} name="Balance" />
                        <Area type="monotone" dataKey="savings" stroke="#d4a017" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Monthly Savings" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Explanation + Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary-500" /> Why This Happens
                  </h3>
                  <div className="text-xs text-muted leading-relaxed whitespace-pre-line">{result.explanation}</div>
                </div>
                <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-primary-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Recommended Action
                  </h3>
                  <p className="text-xs text-foreground leading-relaxed">{result.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 1 && !loading && (
            <div className="mt-8 bg-surface border border-surface-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{lang === 'en' ? 'Recent Simulations' : 'حالیہ سمیلیشنز'}</h3>
              <div className="flex flex-wrap gap-2">
                {history.slice(1).map((q, i) => (
                  <button key={i} onClick={() => { setQuery(q); runSimulation(q); }}
                    className="px-3 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-muted hover:text-foreground hover:border-primary-500/30 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
