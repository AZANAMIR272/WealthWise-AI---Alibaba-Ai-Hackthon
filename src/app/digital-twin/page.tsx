'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { Brain, Wallet, Shield, TrendingUp, TrendingDown, Target, PieChart, AlertTriangle, Zap, Activity } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

function formatPKR(n: number): string {
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

export default function DigitalTwinPage() {
  const currentUser = useCurrentUser();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/financial?type=snapshot')
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(d => { setSnapshot(d); setLoading(false); })
      .catch(() => { setLoading(false); window.location.href = '/'; });
  }, []);

  if (loading || !snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Brain className="w-10 h-10 text-primary-500 animate-pulse" />
      </div>
    );
  }

  const radarData = snapshot.healthFactors.map((f: any) => ({
    subject: f.name.replace(' ', '\n'),
    value: (f.score / f.maxScore) * 100,
    fullMark: 100,
  }));

  const twinMetrics = [
    { label: 'Income Power', value: formatPKR(snapshot.monthlyIncome), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Spending Rate', value: formatPKR(snapshot.monthlyExpenses), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Savings Velocity', value: `${formatPKR(snapshot.monthlySavings)}/mo`, icon: Zap, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { label: 'Shield Level', value: `${snapshot.emergencyMonths} months`, icon: Shield, color: 'text-gold-500', bg: 'bg-gold-500/10' },
    { label: 'Debt Burden', value: `${snapshot.debtToIncome}%`, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Net Worth', value: formatPKR(snapshot.netWorth), icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 animate-pulse-glow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Financial Digital Twin</h1>
                <p className="text-muted text-sm">A living model of your complete financial reality</p>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Financial Health Radar</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e3a1e" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Radar name="Health" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Health Factors Detail */}
            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Health Factor Breakdown</h3>
              <div className="space-y-4">
                {snapshot.healthFactors.map((f: any) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground">{f.name}</span>
                      <span className={`text-xs font-bold ${f.status === 'healthy' ? 'text-green-500' : f.status === 'warning' ? 'text-gold-500' : 'text-red-500'}`}>
                        {f.score}/{f.maxScore}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-700/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${f.status === 'healthy' ? 'bg-green-500' : f.status === 'warning' ? 'bg-gold-500' : 'bg-red-500'}`}
                        style={{ width: `${(f.score / f.maxScore) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-1">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Twin Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {twinMetrics.map((m) => (
              <div key={m.label} className="bg-surface border border-surface-border rounded-2xl p-5 hover:shadow-lg hover:shadow-primary-500/5 transition-all">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <p className="text-xl font-bold text-foreground">{m.value}</p>
                <p className="text-xs text-muted mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Financial DNA */}
          <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/10 border border-primary-700/20 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-500" />
              Your Financial DNA
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-primary-500">{snapshot.savingsRate}%</p>
                <p className="text-[10px] text-muted mt-1">Savings Rate</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-gold-500">{formatPKR(snapshot.monthlyIncome - snapshot.monthlyExpenses)}</p>
                <p className="text-[10px] text-muted mt-1">Monthly Surplus</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-blue-500">{formatPKR(snapshot.totalAssets)}</p>
                <p className="text-[10px] text-muted mt-1">Total Assets</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-red-500">{formatPKR(snapshot.totalDebt)}</p>
                <p className="text-[10px] text-muted mt-1">Total Debt</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
