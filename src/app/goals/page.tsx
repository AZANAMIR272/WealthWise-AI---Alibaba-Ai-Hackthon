'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { Target, Plus, CheckCircle, AlertTriangle, XCircle, Clock, TrendingUp, Loader2, ShoppingBag, Zap, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Goal {
  id: string; name: string; target: number; current: number; progress: number;
  deadline: string; monthlyRequired: number; monthlyAvailable: number;
  status: string; monthsRemaining: number; explanation: string; alternativePlan?: string;
}

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  achievable: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-500', icon: CheckCircle, label: 'Achievable' },
  at_risk: { bg: 'bg-gold-500/10 border-gold-500/20', text: 'text-gold-500', icon: AlertTriangle, label: 'At Risk' },
  unrealistic: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-500', icon: XCircle, label: 'Unrealistic' },
  completed: { bg: 'bg-primary-500/10 border-primary-500/20', text: 'text-primary-500', icon: CheckCircle, label: 'Completed' },
};

export default function GoalsPage() {
  const currentUser = useCurrentUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', deadline: '', priority: 'medium' });
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [marketplaceType, setMarketplaceType] = useState('');
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceResult, setMarketplaceResult] = useState<any>(null);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try {
      const res = await fetch('/api/financial?type=goals');
      if (!res.ok) { window.location.href = '/'; return; }
      setGoals(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) return;
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newGoal, target_amount: parseFloat(newGoal.target_amount) }),
      });
      setShowAdd(false);
      setNewGoal({ name: '', target_amount: '', deadline: '', priority: 'medium' });
      loadGoals();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-primary-500" /> Goal Planner
              </h1>
              <p className="text-muted text-sm mt-1">Plan, track, and achieve your financial goals</p>
            </div>
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500">
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>

          {showAdd && (
            <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input placeholder="Goal name (e.g., Emergency Fund)" value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm" />
                <input type="number" placeholder="Target amount (PKR)" value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm" />
                <input type="date" value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm" />
                <button onClick={addGoal} className="px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium">Create Goal</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {goals.map((g) => {
              const style = STATUS_STYLES[g.status] || STATUS_STYLES.at_risk;
              const Icon = style.icon;
              return (
                <div key={g.id} className={`bg-surface border rounded-2xl p-5 ${style.bg}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${style.text}`} />
                        <h3 className="text-base font-semibold text-foreground">{g.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.text} bg-current/10`}>{style.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted mb-3">
                        <span>Target: <span className="font-semibold text-foreground">{formatPKR(g.target)}</span></span>
                        <span>Saved: <span className="font-semibold text-foreground">{formatPKR(g.current)}</span></span>
                        <span>Deadline: <span className="font-semibold text-foreground">{new Date(g.deadline).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</span></span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-gray-700/15 overflow-hidden mb-2">
                        <div className={`h-full rounded-full transition-all duration-700 ${style.text.replace('text-', 'bg-')}`} style={{ width: `${g.progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted">
                        <span>{g.progress}% complete</span>
                        <span>{g.monthsRemaining} months remaining</span>
                      </div>
                    </div>
                    <div className="md:w-48 p-3 rounded-xl bg-background/50">
                      <p className="text-[10px] text-muted mb-1">Monthly Required</p>
                      <p className="text-sm font-bold text-foreground">{formatPKR(g.monthlyRequired)}/mo</p>
                      <p className="text-[10px] text-muted mt-2 mb-1">Available to Save</p>
                      <p className={`text-sm font-bold ${g.monthlyAvailable >= g.monthlyRequired ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPKR(g.monthlyAvailable)}/mo
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-3 leading-relaxed">{g.explanation}</p>
                  {g.alternativePlan && (
                    <div className="mt-2 p-2.5 rounded-lg bg-gold-500/5 border border-gold-500/10">
                      <p className="text-xs text-gold-500"><span className="font-semibold">Alternative Plan:</span> {g.alternativePlan}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Goal Marketplace */}
          <div className="mt-8">
            <button
              onClick={() => setShowMarketplace(!showMarketplace)}
              className="w-full flex items-center justify-between bg-gradient-to-r from-primary-500/10 to-violet-500/10 border border-primary-500/20 rounded-2xl p-5 hover:border-primary-500/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-foreground">Goal Marketplace</h2>
                  <p className="text-xs text-muted">Goal ke liye strategies, resources aur tools</p>
                </div>
              </div>
              {showMarketplace ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
            </button>

            {showMarketplace && (
              <div className="mt-4 space-y-4">
                {/* Goal Type Buttons */}
                <div className="flex flex-wrap gap-2">
                  {['Emergency Fund', 'Investment Portfolio', 'Debt Free', 'Wedding', 'Home', 'Education', 'Business'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setMarketplaceType(type);
                        setMarketplaceLoading(true);
                        setMarketplaceResult(null);
                        fetch('/api/ai/analyze', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'marketplace', goalType: type }),
                        })
                          .then((r) => r.json())
                          .then((data) => setMarketplaceResult(data.error ? { error: data.error } : data))
                          .catch((e) => setMarketplaceResult({ error: e.message || 'Failed to load marketplace' }))
                          .finally(() => setMarketplaceLoading(false));
                      }}
                      className={`text-xs px-4 py-2 rounded-full border transition-all ${
                        marketplaceType === type
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-surface border-surface-border text-muted hover:text-foreground hover:border-primary-500/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {marketplaceLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  </div>
                )}

                {marketplaceResult && !marketplaceLoading && (
                  <div className="space-y-4">
                    {marketplaceResult.error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-sm">{marketplaceResult.error}</div>
                    )}
                    {/* Strategies */}
                    {marketplaceResult.strategies && (
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Strategies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {marketplaceResult.strategies.map((s: any, i: number) => (
                            <div key={i} className="bg-surface border border-surface-border rounded-xl p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{s.icon || '💡'}</span>
                                  <span className="text-sm font-bold text-foreground">{s.name}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  s.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' :
                                  s.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                }`}>{s.difficulty}</span>
                              </div>
                              <p className="text-xs text-muted mb-2">{s.description}</p>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted">⏱ {s.timeToResult}</span>
                                <span className="text-green-500 font-bold">{s.potentialSavings > 0 ? `Save Rs. ${(s.potentialSavings / 1000).toFixed(0)}K` : ''}</span>
                              </div>
                              {s.steps && (
                                <div className="mt-2 space-y-1">
                                  {s.steps.map((step: string, j: number) => (
                                    <p key={j} className="text-[10px] text-muted flex items-start gap-1">
                                      <span className="text-primary-500">{j + 1}.</span> {step}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {marketplaceResult.resources && (
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Resources</h3>
                        <div className="flex flex-wrap gap-2">
                          {marketplaceResult.resources.map((r: any, i: number) => (
                            <a
                              key={i}
                              href={r.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/30 transition-all text-xs"
                            >
                              <span>{r.icon || '🔗'}</span>
                              <div>
                                <p className="font-bold text-foreground">{r.name}</p>
                                <p className="text-[10px] text-muted">{r.type}</p>
                              </div>
                              {r.url && <ExternalLink className="w-3 h-3 text-muted ml-1" />}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Wins */}
                    {marketplaceResult.quickWins && (
                      <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" /> Quick Wins
                        </h3>
                        {marketplaceResult.quickWins.map((w: string, i: number) => (
                          <p key={i} className="text-xs text-muted mb-1 flex items-start gap-1">
                            <span className="text-green-500">✓</span> {w}
                          </p>
                        ))}
                      </div>
                    )}

                    {marketplaceResult.summary && (
                      <p className="text-xs text-muted">{marketplaceResult.summary}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
