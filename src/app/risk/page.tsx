'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { Shield, AlertTriangle, CheckCircle, Loader2, AlertCircle, Zap, TrendingUp } from 'lucide-react';

interface RiskItem {
  id: string; severity: string; category: string; title: string;
  description: string; why: string; action: string; metric?: string;
}
interface StressResult {
  scenario: string; stabilityScore: number; shortfall: number;
  emergencyFundImpact: string; survivalMonths: number; recoveryTime: string;
  recommendedBuffer: number; details: string[]; actions: string[];
}

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: any }> = {
  critical: { bg: 'bg-red-500/5', border: 'border-red-500/30', text: 'text-red-500', icon: AlertCircle },
  high: { bg: 'bg-orange-500/5', border: 'border-orange-500/30', text: 'text-orange-500', icon: AlertTriangle },
  medium: { bg: 'bg-gold-500/5', border: 'border-gold-500/30', text: 'text-gold-500', icon: AlertTriangle },
  low: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-500', icon: AlertCircle },
};

export default function RiskPage() {
  const currentUser = useCurrentUser();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stressResult, setStressResult] = useState<StressResult | null>(null);
  const [stressLoading, setStressLoading] = useState(false);

  useEffect(() => {
    fetch('/api/financial?type=risk')
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(d => { setRisks(d); setLoading(false); })
      .catch(() => { setLoading(false); window.location.href = '/'; });
  }, []);

  const runStressTest = async (scenario: string, params: Record<string, number> = {}) => {
    setStressLoading(true);
    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stress-test', scenario, params }),
      });
      setStressResult(await res.json());
    } catch (err) { console.error(err); }
    finally { setStressLoading(false); }
  };

  const stressScenarios: Array<{ id: string; label: string; params: Record<string, number> }> = [
    { id: 'salary_delay', label: 'Salary Delay 15 Days', params: { days: 15 } },
    { id: 'salary_delay', label: 'Salary Delay 30 Days', params: { days: 30 } },
    { id: 'income_loss', label: 'Income -20%', params: { percentage: 20 } },
    { id: 'income_loss', label: 'Income -50%', params: { percentage: 50 } },
    { id: 'unexpected_expense', label: 'Rs. 50K Emergency', params: { amount: 50000 } },
    { id: 'unexpected_expense', label: 'Rs. 200K Emergency', params: { amount: 200000 } },
    { id: 'job_loss', label: 'Complete Job Loss', params: {} },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-500" /> Risk Radar
            </h1>
            <p className="text-muted text-sm mt-1">Financial risks detected from your actual data</p>
          </div>

          {/* Risk Summary */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['critical', 'high', 'medium', 'low'].map(sev => {
              const count = risks.filter(r => r.severity === sev).length;
              const s = SEVERITY_STYLES[sev];
              return (
                <div key={sev} className={`bg-surface border rounded-2xl p-4 text-center ${s.border}`}>
                  <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
                  <p className="text-xs text-muted capitalize">{sev} Risks</p>
                </div>
              );
            })}
          </div>

          {/* Risk Items */}
          <div className="space-y-3 mb-8">
            {risks.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground">All Clear!</p>
                <p className="text-muted text-sm">No significant risks detected in your finances</p>
              </div>
            ) : risks.map((r) => {
              const s = SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.medium;
              const Icon = s.icon;
              return (
                <div key={r.id} className={`bg-surface border rounded-2xl p-5 ${s.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.text} bg-current/5`}>{r.severity}</span>
                        <span className="text-[10px] text-muted px-1.5 py-0.5 rounded bg-background">{r.category}</span>
                      </div>
                      <p className="text-xs text-muted mb-2">{r.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="p-2.5 rounded-lg bg-background/50">
                          <p className="text-[10px] font-semibold text-foreground mb-1">Why this matters:</p>
                          <p className="text-[11px] text-muted leading-relaxed">{r.why}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary-500/5 border border-primary-500/10">
                          <p className="text-[10px] font-semibold text-primary-500 mb-1">Recommended action:</p>
                          <p className="text-[11px] text-foreground leading-relaxed">{r.action}</p>
                        </div>
                      </div>
                      {r.metric && <p className="text-[10px] text-muted mt-2">Metric: <span className="font-medium text-foreground">{r.metric}</span></p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stress Test Section */}
          <div className="bg-surface border border-surface-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold-500" /> Financial Stress Test
            </h2>
            <p className="text-muted text-sm mb-4">Test how your finances hold up under pressure</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {stressScenarios.map((s, i) => (
                <button key={i} onClick={() => runStressTest(s.id, s.params)}
                  className="px-3 py-2 rounded-lg bg-background border border-surface-border text-xs font-medium text-foreground hover:border-primary-500/30 hover:bg-primary-500/5 transition-colors">
                  {s.label}
                </button>
              ))}
            </div>

            {stressLoading && <div className="text-center py-6"><Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" /></div>}

            {stressResult && !stressLoading && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background border border-surface-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{stressResult.scenario}</h3>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${stressResult.stabilityScore >= 60 ? 'text-green-500' : stressResult.stabilityScore >= 40 ? 'text-gold-500' : 'text-red-500'}`}>
                        {stressResult.stabilityScore}/100
                      </p>
                      <p className="text-[10px] text-muted">Stability Score</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-2.5 rounded-lg bg-surface">
                      <p className="text-sm font-bold text-foreground">{formatPKR(stressResult.shortfall)}</p>
                      <p className="text-[10px] text-muted">Shortfall</p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-surface">
                      <p className="text-sm font-bold text-foreground">{stressResult.survivalMonths > 100 ? '∞' : `${stressResult.survivalMonths} mo`}</p>
                      <p className="text-[10px] text-muted">Survival Time</p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-surface">
                      <p className="text-sm font-bold text-foreground">{stressResult.recoveryTime}</p>
                      <p className="text-[10px] text-muted">Recovery</p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-surface">
                      <p className="text-sm font-bold text-foreground">{formatPKR(stressResult.recommendedBuffer)}</p>
                      <p className="text-[10px] text-muted">Buffer Needed</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted mb-2"><span className="font-semibold text-foreground">Emergency Fund Impact:</span> {stressResult.emergencyFundImpact}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-background">
                    <p className="text-[10px] font-semibold text-foreground mb-2">Details</p>
                    {stressResult.details.map((d, i) => (
                      <p key={i} className="text-[11px] text-muted flex items-start gap-1.5 mb-1">
                        <span className="text-primary-500 mt-0.5">•</span> {d}
                      </p>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                    <p className="text-[10px] font-semibold text-primary-500 mb-2">Recommended Actions</p>
                    {stressResult.actions.map((a, i) => (
                      <p key={i} className="text-[11px] text-foreground flex items-start gap-1.5 mb-1">
                        <span className="text-primary-500 mt-0.5">→</span> {a}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
