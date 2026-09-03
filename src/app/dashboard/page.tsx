'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { LogoIcon } from '@/components/logo';
import { useLang } from '@/lib/i18n';
import { AddAccountModal } from '@/components/add-account-modal';
import { QuickAddTransaction, QuickAddGoal } from '@/components/quick-add-modal';
import { ProfileModal } from '@/components/profile-modal';
import { AvatarView } from '@/lib/avatar';
import { useCurrentUser } from '@/lib/use-current-user';
import {
  TrendingUp, TrendingDown, Wallet, Shield, Target, Sparkles,
  ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Clock,
  Brain, Zap, ChevronRight, PiggyBank, CreditCard, BarChart3, Plus, X,
  Trash2, Upload, Loader2, Database, UserRound
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Snapshot {
  totalBalance: number; monthlyIncome: number; monthlyExpenses: number; monthlySavings: number;
  savingsRate: number; emergencyReserve: number; emergencyMonths: number; totalDebt: number;
  netWorth: number; healthScore: number; liquidBalance: number;
  healthFactors: Array<{ name: string; score: number; maxScore: number; status: string; explanation: string }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  cashFlowHistory: Array<{ month: string; income: number; expenses: number; savings: number }>;
}
interface SafeSpend { today: number; thisWeek: number; thisMonth: number; explanation: string; }
interface RiskItem { id: string; severity: string; title: string; description: string; category: string; }
interface GoalAnalysis { id: string; name: string; target: number; current: number; progress: number; status: string; deadline: string; }
interface Account { id: string; name: string; type: string; balance: number; is_primary: number; }

const CAT_COLORS = ['#059669','#d4a017','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#64748b','#f43f5e','#0ea5e9','#a855f7'];

const ACCT_ICONS: Record<string, { icon: string; color: string }> = {
  bank: { icon: '🏦', color: '#059669' },
  savings: { icon: '💰', color: '#d4a017' },
  cash: { icon: '💵', color: '#14b8a6' },
  mobile_wallet: { icon: '📱', color: '#8b5cf6' },
  investment: { icon: '📈', color: '#3b82f6' },
  debt: { icon: '💳', color: '#ef4444' },
  credit: { icon: '💳', color: '#f97316' },
};

function formatPKR(n: number): string {
  if (Math.abs(n) >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#059669' : score >= 50 ? '#d4a017' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-700/20" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="score-ring transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-foreground/80 font-semibold">/ 100</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, sub, color = 'primary' }: any) {
  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color === 'gold' ? 'bg-gold-500/10' : color === 'red' ? 'bg-red-500/10' : 'bg-primary-500/10'}`}>
          <Icon className={`w-4.5 h-4.5 ${color === 'gold' ? 'text-gold-500' : color === 'red' ? 'text-red-500' : 'text-primary-500'}`} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const currentUser = useCurrentUser();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [safeSpend, setSafeSpend] = useState<SafeSpend | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [goals, setGoals] = useState<GoalAnalysis[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'account' | 'transaction' | 'goal' | null>(null);

  // Keep dashboard avatar in sync with localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ww_user');
      if (stored) setProfileAvatar(JSON.parse(stored).avatar || null);
    } catch {}
  }, []);

  const hasData = accounts.length > 0;

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) setAccounts(await res.json());
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [snapRes, safeRes, riskRes, goalRes] = await Promise.all([
        fetch('/api/financial?type=snapshot'),
        fetch('/api/financial?type=safe-to-spend'),
        fetch('/api/financial?type=risk'),
        fetch('/api/financial?type=goals'),
      ]);
      if (!snapRes.ok) { router.push('/'); return; }
      setSnapshot(await snapRes.json());
      setSafeSpend(await safeRes.json());
      setRisks(await riskRes.json());
      setGoals(await goalRes.json());
      await loadAccounts();
    } catch (err) {
      console.error(err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router, loadAccounts]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLoadSample = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/auth/seed', { method: 'POST' });
      if (res.ok) await loadData();
    } catch {} finally {
      setSeeding(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this account and its transactions?' : 'یہ اکاؤنٹ اور اس کے لین دین حذف کریں؟')) return;
    await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 animate-pulse-glow"><LogoIcon size="xxl" /></div>
          <p className="text-muted text-sm font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }
  if (!snapshot) return null;

  const greeting = lang === 'en'
    ? `Assalam o Alaikum, ${currentUser?.name || 'User'}!`
    : `السلام علیکم، ${currentUser?.name || 'User'}!`;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />

      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setProfileOpen(true)}
                  className="relative group flex-shrink-0"
                  title={lang === 'en' ? 'Profile Setup' : 'پروفائل سیٹ اپ'}
                >
                  <AvatarView avatar={profileAvatar} name={currentUser?.name || 'User'} size="lg" className="shadow-lg group-hover:scale-105 transition-transform" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-600 border-2 border-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UserRound className="w-3 h-3 text-white" />
                  </span>
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{greeting} 👋</h1>
                  <p className="text-foreground/90 text-sm mt-1">{t('dashSubtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Profile Setup */}
                <button onClick={() => setProfileOpen(true)}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl border border-surface-border bg-surface hover:bg-surface-hover hover:border-primary-500/30 text-sm font-medium text-foreground transition-all"
                  title={lang === 'en' ? 'Profile Setup' : 'پروفائل سیٹ اپ'}>
                  <UserRound className="w-4 h-4 text-primary-500" />
                  <span className="hidden sm:inline">{lang === 'en' ? 'Profile' : 'پروفائل'}</span>
                </button>
                {/* Quick Add */}
                <div className="relative">
                  <button onClick={() => setQuickAddOpen(!quickAddOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-surface-border hover:bg-surface-hover hover:border-primary-500/30 transition-all"
                    title={lang === 'en' ? 'Quick Add' : 'فوری شامل کریں'}>
                    {quickAddOpen ? <X className="w-4 h-4 text-foreground" /> : <Plus className="w-4 h-4 text-primary-500" />}
                  </button>
                  {quickAddOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
                      <div className="absolute top-full mt-2 right-0 w-48 rounded-xl bg-surface border border-surface-border shadow-2xl p-1.5 z-50">
                        {[
                          { key: 'account' as const, icon: Wallet, label: 'Add Account', labelUr: 'اکاؤنٹ' },
                          { key: 'transaction' as const, icon: TrendingUp, label: 'Add Transaction', labelUr: 'لین دین' },
                          { key: 'goal' as const, icon: Target, label: 'Add Goal', labelUr: 'مقصد' },
                        ].map((item) => (
                          <button key={item.key} onClick={() => { setModalType(item.key); setQuickAddOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-hover transition-colors">
                            <item.icon className="w-4 h-4 text-primary-500" />
                            <span className="font-medium">{lang === 'en' ? item.label : item.labelUr}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => router.push('/simulator')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-4 h-4" />
                  {t('whatIfSimNav')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty State — No Accounts */}
          {!hasData && (
            <div className="bg-surface border border-surface-border rounded-2xl p-8 mb-8 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {lang === 'en' ? 'Welcome to WealthWise AI!' : 'WealthWise AI میں خوش آمدید!'}
              </h2>
              <p className="text-sm text-foreground/80 mb-6 max-w-md mx-auto">
                {lang === 'en'
                  ? 'Upload your bank statement (PDF) for AI analysis, add accounts manually, or load sample data to explore.'
                  : 'اپنا بینک اسٹیٹمنٹ (PDF) اپلوڈ کریں AI تجزیہ کے لیے، دستی طور پر اکاؤنٹس شامل کریں، یا نمونہ ڈیٹا لوڈ کریں۔'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => router.push('/transactions')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20">
                  <Upload className="w-4 h-4" />
                  {lang === 'en' ? 'Upload Statement (AI)' : 'اسٹیٹمنٹ اپلوڈ (AI)'}
                </button>
                <button onClick={handleLoadSample} disabled={seeding}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 font-semibold text-sm hover:bg-primary-500/10 transition-all disabled:opacity-50">
                  {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  {lang === 'en' ? 'Load Sample Data' : 'نمونہ ڈیٹا لوڈ کریں'}
                </button>
                <button onClick={() => setModalType('account')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 font-semibold text-sm hover:bg-primary-500/10 transition-all">
                  <Plus className="w-4 h-4" />
                  {lang === 'en' ? 'Add Account' : 'اکاؤنٹ شامل کریں'}
                </button>
              </div>
            </div>
          )}

          {/* Accounts Section */}
          {hasData && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary-500" />
                  <h2 className="text-sm font-bold text-foreground">
                    {lang === 'en' ? 'My Accounts' : 'میرے اکاؤنٹس'}
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-500">{accounts.length}</span>
                </div>
                <button onClick={() => setModalType('account')}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 font-medium">
                  <Plus className="w-3 h-3" />
                  {lang === 'en' ? 'Add' : 'شامل'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {accounts.map((acct) => {
                  const info = ACCT_ICONS[acct.type] || { icon: '🏦', color: '#059669' };
                  return (
                    <div key={acct.id} className="bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all group">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${info.color}15` }}>
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{acct.name}</p>
                        <p className="text-[10px] text-muted capitalize">{acct.type.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${acct.balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                          {formatPKR(acct.balance)}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteAccount(acct.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 transition-all"
                        title={lang === 'en' ? 'Delete' : 'حذف کریں'}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats (only when data exists) */}
          {hasData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
                <div className="lg:col-span-4 bg-surface border border-surface-border rounded-2xl p-6 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-foreground">{t('healthScore')}</h3>
                  </div>
                  <ScoreCircle score={snapshot.healthScore} size={140} />
                  <div className="mt-4 w-full space-y-2">
                    {snapshot.healthFactors.slice(0, 3).map((f) => (
                      <div key={f.name} className="flex items-center justify-between text-xs">
                        <span className="text-muted">{f.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-700/20 overflow-hidden">
                            <div className={`h-full rounded-full ${f.status === 'healthy' ? 'bg-primary-500' : f.status === 'warning' ? 'bg-gold-500' : 'bg-red-500'}`}
                              style={{ width: `${(f.score / f.maxScore) * 100}%` }} />
                          </div>
                          <span className="text-foreground font-medium w-12 text-right">{f.score}/{f.maxScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard label={t('totalBalance')} value={formatPKR(snapshot.totalBalance)} icon={Wallet} />
                  <StatCard label={t('monthlyIncome')} value={formatPKR(snapshot.monthlyIncome)} icon={TrendingUp} color="gold" />
                  <StatCard label={t('monthlyExpenses')} value={formatPKR(snapshot.monthlyExpenses)} icon={TrendingDown} color="red" />
                  <StatCard label={t('monthlySavings')} value={formatPKR(snapshot.monthlySavings)} icon={PiggyBank} sub={`${snapshot.savingsRate}% savings rate`} />
                  <StatCard label={t('emergencyFund')} value={formatPKR(snapshot.emergencyReserve)} icon={Shield} sub={`${snapshot.emergencyMonths} months coverage`} />
                  <StatCard label={t('netWorth')} value={formatPKR(snapshot.netWorth)} icon={BarChart3} sub={`Debt: ${formatPKR(snapshot.totalDebt)}`} color="gold" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-gold-500" />
                    <h3 className="text-sm font-semibold text-foreground">{t('safeToSpend')}</h3>
                  </div>
                  {safeSpend && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: t('today'), value: safeSpend.today },
                          { label: t('thisWeek'), value: safeSpend.thisWeek },
                          { label: t('thisMonth'), value: safeSpend.thisMonth },
                        ].map((s) => (
                          <div key={s.label} className="text-center p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                            <p className="text-lg font-bold text-primary-500">{formatPKR(s.value)}</p>
                            <p className="text-[10px] text-muted mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{safeSpend.explanation}</p>
                    </>
                  )}
                </div>
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-foreground">{t('cashFlow6mo')}</h3>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={snapshot.cashFlowHistory}>
                        <defs>
                          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: '#111a11', border: '1px solid #1e3a1e', borderRadius: 12, fontSize: 12 }}
                          formatter={(v: any) => [`Rs. ${Number(v).toLocaleString('en-PK')}`, '']} />
                        <Area type="monotone" dataKey="income" stroke="#059669" fill="url(#incGrad)" strokeWidth={2} name={t('monthlyIncome')} />
                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name={t('monthlyExpenses')} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-foreground">{t('spendingBreakdown')}</h3>
                  </div>
                  <div className="h-[160px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={snapshot.categoryBreakdown.slice(0, 8)} dataKey="amount" nameKey="category"
                          cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                          {snapshot.categoryBreakdown.slice(0, 8).map((_, i) => (
                            <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatPKR(Number(v))} contentStyle={{ background: '#111a11', border: '1px solid #1e3a1e', borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {snapshot.categoryBreakdown.slice(0, 6).map((c, i) => (
                      <div key={c.category} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[i] }} />
                        <span className="text-muted capitalize">{c.category}</span>
                        <span className="ml-auto font-medium text-foreground">{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary-500" />
                      <h3 className="text-sm font-semibold text-foreground">{t('goals')}</h3>
                    </div>
                    <button onClick={() => router.push('/goals')} className="text-xs text-primary-500 hover:text-primary-400">{t('viewAll')}</button>
                  </div>
                  <div className="space-y-3">
                    {goals.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-foreground/60">{lang === 'en' ? 'No goals yet' : 'ابھی کوئی مقصد نہیں'}</p>
                        <button onClick={() => setModalType('goal')} className="mt-2 text-xs text-primary-500 hover:text-primary-400 font-medium">
                          + {lang === 'en' ? 'Add Goal' : 'مقصد شامل کریں'}
                        </button>
                      </div>
                    ) : goals.slice(0, 4).map((g) => (
                      <div key={g.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-medium truncate max-w-[60%]">{g.name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            g.status === 'achievable' ? 'bg-green-500/10 text-green-500' :
                            g.status === 'at_risk' ? 'bg-gold-500/10 text-gold-500' :
                            g.status === 'unrealistic' ? 'bg-red-500/10 text-red-500' : 'bg-primary-500/10 text-primary-500'
                          }`}>{g.status}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-700/20 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            g.status === 'achievable' ? 'bg-green-500' : g.status === 'at_risk' ? 'bg-gold-500' : 'bg-red-500'
                          }`} style={{ width: `${g.progress}%` }} />
                        </div>
                        <p className="text-[10px] text-muted">{formatPKR(g.current)} / {formatPKR(g.target)} ({g.progress}%)</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary-500" />
                      <h3 className="text-sm font-semibold text-foreground">{t('riskRadar')}</h3>
                    </div>
                    <button onClick={() => router.push('/risk')} className="text-xs text-primary-500 hover:text-primary-400">{t('viewAll')}</button>
                  </div>
                  {risks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle className="w-10 h-10 text-primary-500 mb-2" />
                      <p className="text-sm text-foreground font-medium">{lang === 'en' ? 'All Clear!' : 'سب ٹھیک!'}</p>
                      <p className="text-xs text-muted mt-1">{lang === 'en' ? 'No significant risks detected' : 'کوئی نمایاں خطرہ نہیں'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {risks.slice(0, 4).map((r) => (
                        <div key={r.id} className={`p-2.5 rounded-lg border ${
                          r.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                          r.severity === 'high' ? 'bg-gold-500/5 border-gold-500/20' : 'bg-surface border-surface-border'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              r.severity === 'critical' ? 'text-red-500' : r.severity === 'high' ? 'text-gold-500' : 'text-muted'
                            }`} />
                            <div>
                              <p className="text-xs font-medium text-foreground">{r.title}</p>
                              <p className="text-[10px] text-muted mt-0.5 line-clamp-2">{r.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tagline */}
          <div className="text-center py-6">
            <div className="flex justify-center items-center gap-3 mb-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold-500/50" />
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rotate-45" style={{
                    background: i % 3 === 0 ? '#059669' : i % 3 === 1 ? '#d4a017' : '#e63946',
                    opacity: 0.5,
                  }} />
                ))}
              </div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold-500/50" />
            </div>
            <p className="text-sm text-foreground/80 italic">{t('dashTagline')}</p>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modalType === 'account' && <AddAccountModal onClose={() => setModalType(null)} onSuccess={() => { loadAccounts(); loadData(); }} />}
                <ProfileModal
                  open={profileOpen}
                  onClose={() => setProfileOpen(false)}
                  onSaved={(user) => setProfileAvatar(user.avatar)}
                />
      {modalType === 'transaction' && <QuickAddTransaction onClose={() => setModalType(null)} onSuccess={loadData} />}
      {modalType === 'goal' && <QuickAddGoal onClose={() => setModalType(null)} onSuccess={loadData} />}
    </div>
  );
}
