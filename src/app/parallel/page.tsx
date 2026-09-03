'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { useLang } from '@/lib/i18n';
import {
  Send, Loader2, GitBranch, Trophy, AlertTriangle, TrendingUp, TrendingDown,
  Star, Zap, ChevronRight, Clock
} from 'lucide-react';

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const EXAMPLES = [
  "Rs. 200,000 laptop loon?",
  "Naya phone loon Rs. 80,000 ka?",
  "Freelance course Rs. 50,000?",
  "Bike loon Rs. 300,000 ki?",
];

export default function ParallelFuturesPage() {
  const currentUser = useCurrentUser();
  const { lang } = useLang();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analyze = async (text?: string) => {
    const q = text || query;
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'parallel', query: q }),
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

  const futureColors = [
    { border: 'border-green-500/30', bg: 'from-green-500/10 to-emerald-500/5', badge: 'bg-green-500' },
    { border: 'border-amber-500/30', bg: 'from-amber-500/10 to-yellow-500/5', badge: 'bg-amber-500' },
    { border: 'border-red-500/30', bg: 'from-red-500/10 to-rose-500/5', badge: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Parallel Futures</h1>
                <p className="text-sm text-muted">Ek decision ke 3 possible futures compare karo</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-6">
            <div className="flex gap-3">
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder="Koi decision poocho — Buy vs Wait vs Don't Buy..."
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-violet-500" />
              <button onClick={() => analyze()} disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium text-sm hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-500/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                Simulate
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => { setQuery(ex); analyze(ex); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-background border border-surface-border text-muted hover:text-foreground hover:border-violet-500/50 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-500 text-sm">{error}</div>}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex gap-3 mb-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-4 h-12 rounded-full bg-gradient-to-t from-violet-500 to-purple-500 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className="text-lg font-bold text-foreground">3 Futures simulate ho rahe hain...</p>
              <p className="text-sm text-muted mt-1">Buy • Wait • Don&apos;t Buy</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Winner Banner */}
              {result.recommendation && (
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-bold text-foreground">Best Future</span>
                  </div>
                  <p className="text-sm text-muted">{result.recommendation}</p>
                </div>
              )}

              {/* 3 Future Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {result.futures?.map((future: any, i: number) => {
                  const colors = futureColors[i] || futureColors[0];
                  const isWinner = result.winner === i;
                  return (
                    <div key={i} className={`bg-gradient-to-br ${colors.bg} border ${isWinner ? 'border-violet-500 shadow-lg shadow-violet-500/10' : 'border-surface-border'} rounded-2xl p-5 relative`}>
                      {isWinner && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shadow-lg">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{future.emoji}</span>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{future.label}</h3>
                          <p className="text-[10px] text-muted">{future.tagline}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted mb-4 leading-relaxed">{future.description}</p>

                      {/* Balance Timeline */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">3 Months</span>
                          <span className="font-bold text-foreground">{formatPKR(future.month3Balance || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">6 Months</span>
                          <span className="font-bold text-foreground">{formatPKR(future.month6Balance || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">12 Months</span>
                          <span className="font-bold text-foreground">{formatPKR(future.month12Balance || 0)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{future.healthScore}</p>
                          <p className="text-[10px] text-muted">Health</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          future.riskLevel === 'LOW' ? 'bg-green-500/10 text-green-500' :
                          future.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>{future.riskLevel}</span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-[10px] font-bold text-green-500">PROS</p>
                        {future.pros?.map((p: string, j: number) => (
                          <p key={j} className="text-xs text-muted flex items-start gap-1">
                            <span className="text-green-500 mt-0.5">+</span> {p}
                          </p>
                        ))}
                      </div>
                      <div className="space-y-2 mb-3">
                        <p className="text-[10px] font-bold text-red-500">CONS</p>
                        {future.cons?.map((c: string, j: number) => (
                          <p key={j} className="text-xs text-muted flex items-start gap-1">
                            <span className="text-red-500 mt-0.5">-</span> {c}
                          </p>
                        ))}
                      </div>
                      {future.surprise && (
                        <div className="bg-white/5 rounded-lg p-2 mt-2">
                          <p className="text-[10px] font-bold text-violet-400 mb-1">SURPRISE</p>
                          <p className="text-xs text-muted">{future.surprise}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                <GitBranch className="w-8 h-8 text-violet-500/50" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Apni Decision Enter Karo</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                Buy vs Wait vs Don&apos;t Buy — 3 possible futures dekho aur best decision lo.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
