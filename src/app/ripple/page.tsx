'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { useLang } from '@/lib/i18n';
import {
  Zap, Send, Loader2, TrendingUp, TrendingDown, AlertTriangle,
  ArrowRight, Waves, Target, DollarSign, Shield, Clock, ChevronRight
} from 'lucide-react';

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const EXAMPLES = [
  "Rs. 150,000 laptop loon?",
  "Rs. 30,000 gym membership join karoon?",
  "Rs. 50,000 mobile upgrade?",
  "Rs. 200,000 bike loon?",
  "Rs. 10,000 monthly Netflix subscription loon?",
  "Rs. 500,000 car down payment karoon?",
];

export default function RipplePage() {
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
        body: JSON.stringify({ type: 'ripple', query: q }),
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

  const verdictColors: Record<string, string> = {
    'GO': 'from-green-500 to-emerald-500',
    'CAUTION': 'from-amber-500 to-yellow-500',
    'NO-GO': 'from-red-500 to-rose-500',
  };
  const verdictBg: Record<string, string> = {
    'GO': 'bg-green-500/10 border-green-500/20',
    'CAUTION': 'bg-amber-500/10 border-amber-500/20',
    'NO-GO': 'bg-red-500/10 border-red-500/20',
  };
  const magnitudeColors: Record<string, string> = {
    'LOW': 'bg-blue-500/10 text-blue-500',
    'MEDIUM': 'bg-amber-500/10 text-amber-500',
    'HIGH': 'bg-orange-500/10 text-orange-500',
    'CRITICAL': 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Financial Ripple Engine</h1>
                <p className="text-sm text-muted">Ek decision ke saare downstream effects dekho</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-6">
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder="Kya main Rs. 150,000 laptop loon? — Koi bhi financial decision poochho..."
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={() => analyze()}
                disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Analyze
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => { setQuery(ex); analyze(ex); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-background border border-surface-border text-muted hover:text-foreground hover:border-primary-500/50 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-500 text-sm">{error}</div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-amber-500/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-4 rounded-full bg-amber-500/40 animate-ping" style={{ animationDelay: '0.6s' }} />
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Waves className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-lg font-bold text-foreground">Ripples calculate ho rahe hain...</p>
              <p className="text-sm text-muted mt-1">Analyzing downstream effects of your decision</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-6">
              {/* Verdict Card */}
              <div className={`rounded-2xl border p-6 ${verdictBg[result.verdict] || 'bg-surface'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${verdictColors[result.verdict] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-white text-2xl font-black">{result.verdict === 'GO' ? '✓' : result.verdict === 'CAUTION' ? '!' : '✗'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-sm font-black px-3 py-1 rounded-full text-white bg-gradient-to-r ${verdictColors[result.verdict] || 'from-gray-500 to-gray-600'}`}>
                        {result.verdict}
                      </span>
                      <span className="text-sm font-bold text-foreground">{result.decision}</span>
                    </div>
                    <p className="text-sm text-muted">{result.verdictReason}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{result.riskScore}/100</p>
                      <p className="text-[10px] text-muted">Risk Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{formatPKR(result.monthlyImpact || 0)}</p>
                      <p className="text-[10px] text-muted">Monthly Impact</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chain Reaction */}
              {result.chainReaction && (
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-foreground">Chain Reaction</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{result.chainReaction}</p>
                </div>
              )}

              {/* Ripple Cards */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-amber-500" /> Ripple Effects ({result.ripples?.length || 0})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.ripples?.map((ripple: any, i: number) => (
                    <div key={ripple.id || i} className="bg-surface border border-surface-border rounded-xl p-4 hover:border-primary-500/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{ripple.icon || '💰'}</span>
                          <span className="text-xs font-bold text-foreground">{ripple.category}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${magnitudeColors[ripple.magnitude] || 'bg-gray-500/10 text-gray-500'}`}>
                          {ripple.magnitude}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-2">{ripple.impact}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {ripple.direction === 'negative' ? <TrendingDown className="w-3 h-3 text-red-500" /> : <TrendingUp className="w-3 h-3 text-green-500" />}
                          <span className={`text-xs font-bold ${ripple.direction === 'negative' ? 'text-red-500' : 'text-green-500'}`}>
                            {ripple.direction === 'negative' ? '-' : '+'}{formatPKR(ripple.amount || 0)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {ripple.timeframe}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternatives */}
              {result.safeAlternatives && result.safeAlternatives.length > 0 && (
                <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-500" /> Safe Alternatives
                  </h3>
                  <div className="space-y-2">
                    {result.safeAlternatives.map((alt: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted">
                        <ChevronRight className="w-3 h-3 text-primary-500 flex-shrink-0" />
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.summary && (
                <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-foreground">Summary</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{result.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                <Waves className="w-8 h-8 text-amber-500/50" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Apna Decision Enter Karo</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                Koi bhi financial decision poocho — hum saare downstream effects calculate karenge, savings se le kar goals tak.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
