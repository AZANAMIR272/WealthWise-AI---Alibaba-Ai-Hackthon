'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { useLang } from '@/lib/i18n';
import {
  Clock, Send, Loader2, ArrowRight, TrendingUp, TrendingDown,
  RotateCcw, AlertTriangle, Zap, History
} from 'lucide-react';

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const EXAMPLES = [
  { text: "Agar Rs. 5,000 extra save karta har mahine", months: 6 },
  { text: "Agar gym membership skip karta", months: 3 },
  { text: "Agar freelance course leta 6 mahine pehle", months: 6 },
  { text: "Agar emergency fund pehle banata", months: 12 },
];

export default function TimeMachinePage() {
  const currentUser = useCurrentUser();
  const { lang } = useLang();
  const [query, setQuery] = useState('');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analyze = async (text?: string, m?: number) => {
    const q = text || query;
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'time-machine', query: q, monthsBack: m || months }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Analysis failed'); }
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Financial Time Machine</h1>
                <p className="text-sm text-muted">Past decision change karke alternate reality dekho</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder="Agar main Rs. 5,000 extra save karta har mahine..."
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-rose-500" />
              <select value={months} onChange={(e) => setMonths(Number(e.target.value))}
                className="px-4 py-3 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-rose-500">
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
              <button onClick={() => analyze()} disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-rose-500/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Travel
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLES.map((ex) => (
                <button key={ex.text} onClick={() => { setQuery(ex.text); setMonths(ex.months); analyze(ex.text, ex.months); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-background border border-surface-border text-muted hover:text-foreground hover:border-rose-500/50 transition-all">
                  {ex.text}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-500 text-sm">{error}</div>}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
                <RotateCcw className="w-8 h-8 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-lg font-bold text-foreground">Time travel ho raha hai...</p>
              <p className="text-sm text-muted mt-1">Alternate reality calculate ho rahi hai</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Comparison Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-foreground">Original Reality</span>
                  </div>
                  <p className="text-xs text-muted mb-3">{result.originalDecision}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Balance Now</span>
                      <span className="font-bold text-red-500">{formatPKR(result.alternateReality?.balanceNow || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Health Score</span>
                      <span className="font-bold text-red-500">{result.alternateReality?.healthNow || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Goals Completed</span>
                      <span className="font-bold text-red-500">{result.alternateReality?.goalsCompletedNow || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-foreground">Alternate Reality</span>
                  </div>
                  <p className="text-xs text-muted mb-3">{result.alternateDecision}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Balance Would Be</span>
                      <span className="font-bold text-green-500">{formatPKR(result.alternateReality?.balanceWouldBe || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Health Would Be</span>
                      <span className="font-bold text-green-500">{result.alternateReality?.healthWouldBe || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Goals Would Complete</span>
                      <span className="font-bold text-green-500">{result.alternateReality?.goalsCompletedWouldBe || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Difference Card */}
              {result.alternateReality?.savingsDifference && (
                <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted mb-1">Savings Difference</p>
                      <p className="text-2xl font-bold text-foreground">
                        {result.alternateReality.savingsDifference > 0 ? '+' : ''}{formatPKR(result.alternateReality.savingsDifference)}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      result.alternateReality.savingsDifference > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {result.alternateReality.savingsDifference > 0 ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-500" /> Month-by-Month Comparison
                  </h3>
                  <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-surface-tertiary">
                        <tr>
                          <th className="px-4 py-2 text-left text-muted">Month</th>
                          <th className="px-4 py-2 text-left text-muted">Reality</th>
                          <th className="px-4 py-2 text-left text-muted">Alternate</th>
                          <th className="px-4 py-2 text-right text-muted">Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.timeline.map((row: any, i: number) => (
                          <tr key={i} className="border-t border-surface-border">
                            <td className="px-4 py-2 font-bold text-foreground">Month {row.month}</td>
                            <td className="px-4 py-2 text-muted">{row.reality}</td>
                            <td className="px-4 py-2 text-muted">{row.alternate}</td>
                            <td className={`px-4 py-2 text-right font-bold ${row.balanceDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {row.balanceDiff > 0 ? '+' : ''}{formatPKR(row.balanceDiff)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lesson & Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.lesson && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Lesson Learned
                    </h3>
                    <p className="text-xs text-muted">{result.lesson}</p>
                  </div>
                )}
                {result.actionNow && (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-500" /> Action Now
                    </h3>
                    <p className="text-xs text-muted">{result.actionNow}</p>
                    {result.futureRecovery && (
                      <p className="text-xs text-green-500 font-bold mt-2">Recovery: {result.futureRecovery}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-rose-500/50" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Past Mein Travel Karo</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                Agar aap ne koi decision differently liya hota, toh aaj kya farq hota? Alternate reality dekho.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
