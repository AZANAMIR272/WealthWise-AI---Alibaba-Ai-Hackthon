'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { useLang } from '@/lib/i18n';
import {
  Navigation, Send, Loader2, MapPin, Flag, Clock, AlertTriangle,
  Zap, ChevronRight, Target, Route
} from 'lucide-react';

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const EXAMPLES = [
  "Rs. 500,000 emergency fund 12 months mein",
  "Rs. 200,000 bike 6 months mein",
  "Rs. 1,000,000 car 2 saal mein",
  "Rs. 300,000 wedding fund 1 saal mein",
];

export default function GPSPage() {
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
        body: JSON.stringify({ type: 'gps', query: q }),
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Financial GPS</h1>
                <p className="text-sm text-muted">Goal tak ka dynamic route — current position se manzil tak</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-6">
            <div className="flex gap-3">
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder="Goal batao — Rs. 500,000 12 months mein chahiye..."
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-cyan-500" />
              <button onClick={() => analyze()} disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium text-sm hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                Navigate
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => { setQuery(ex); analyze(ex); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-background border border-surface-border text-muted hover:text-foreground hover:border-cyan-500/50 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-500 text-sm">{error}</div>}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-blue-500/30" />
                <div className="absolute inset-3 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
                <Navigation className="w-6 h-6 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-lg font-bold text-foreground">Route calculate ho raha hai...</p>
              <p className="text-sm text-muted mt-1">Finding the best path to your goal</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* GPS Summary */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{result.goal}</h3>
                    <p className="text-sm text-muted mb-3">{result.currentPosition}</p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-bold text-foreground">ETA: {result.eta}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold text-foreground">Distance: {formatPKR(result.distance || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-foreground">Fuel: {result.fuelRequired}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Steps */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-500" /> Your Route ({result.route?.length || 0} steps)
                </h3>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-primary-500 hidden md:block" />
                  <div className="space-y-4">
                    {result.route?.map((step: any, i: number) => (
                      <div key={i} className="relative flex gap-4 md:gap-6">
                        {/* Step circle */}
                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${
                          step.completed ? 'bg-green-500 text-white' : 'bg-surface border-2 border-cyan-500 text-cyan-500'
                        }`}>
                          {step.completed ? <Flag className="w-5 h-5" /> : <span className="text-sm font-bold">{step.step}</span>}
                        </div>
                        {/* Step card */}
                        <div className="flex-1 bg-surface border border-surface-border rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                              <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {step.timeline}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-cyan-500">{formatPKR(step.milestone || 0)}</span>
                          </div>
                          <p className="text-xs text-muted mb-2">{step.description}</p>
                          {step.action && (
                            <div className="flex items-center gap-1 text-xs text-primary-500">
                              <ChevronRight className="w-3 h-3" /> {step.action}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detours & Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.detours && result.detours.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Potential Detours
                    </h3>
                    {result.detours.map((d: string, i: number) => (
                      <p key={i} className="text-xs text-muted mb-2 flex items-start gap-1">
                        <span className="text-amber-500">!</span> {d}
                      </p>
                    ))}
                  </div>
                )}
                {result.shortcuts && result.shortcuts.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-500" /> Shortcuts
                    </h3>
                    {result.shortcuts.map((s: string, i: number) => (
                      <p key={i} className="text-xs text-muted mb-2 flex items-start gap-1">
                        <span className="text-green-500">+</span> {s}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5">
                  <p className="text-sm text-muted">{result.summary}</p>
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center">
                <Navigation className="w-8 h-8 text-cyan-500/50" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Apna Goal Batao</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                Current financial position se goal tak ka optimal route milega — step by step guidance.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
