'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp, TrendingDown, PiggyBank, Target } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const TXN_CATEGORIES = [
  'income', 'food', 'transport', 'bills', 'housing', 'shopping',
  'healthcare', 'education', 'entertainment', 'savings', 'debt', 'other',
];

const GOAL_PRIORITIES = [
  { value: 'critical', label: 'Critical', labelUr: 'اہم' },
  { value: 'high', label: 'High', labelUr: 'زیادہ' },
  { value: 'medium', label: 'Medium', labelUr: 'درمیانہ' },
  { value: 'low', label: 'Low', labelUr: 'کم' },
];

interface Account { id: string; name: string; type: string; balance: number; }

// ─── Transaction Quick Add ───
export function QuickAddTransaction({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { lang } = useLang();
  const [type, setType] = useState<'income' | 'expense' | 'savings'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError(lang === 'en' ? 'Enter a valid amount' : 'درست رقم درج کریں');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          category: type === 'income' ? 'income' : category,
          description: description.trim(),
          account_id: accountId || null,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const typeBtns = [
    { value: 'income' as const, label: 'Income', labelUr: 'آمدنی', icon: TrendingUp, color: 'text-green-500' },
    { value: 'expense' as const, label: 'Expense', labelUr: 'خرچہ', icon: TrendingDown, color: 'text-red-500' },
    { value: 'savings' as const, label: 'Savings', labelUr: 'بچت', icon: PiggyBank, color: 'text-gold-500' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h2 className="text-base font-bold text-foreground">{lang === 'en' ? 'Add Transaction' : 'لین دین شامل کریں'}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {typeBtns.map((t) => (
              <button
                key={t.value}
                onClick={() => { setType(t.value); if (t.value === 'income') setCategory('income'); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  type === t.value
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                    : 'border-surface-border hover:border-primary-500/30 text-foreground/60'
                }`}
              >
                <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                {lang === 'en' ? t.label : t.labelUr}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Amount (PKR)' : 'رقم (PKR)'}</label>
            <input
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
            />
          </div>

          {/* Category (hide for income) */}
          {type !== 'income' && (
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Category' : 'قسم'}</label>
              <div className="flex flex-wrap gap-1.5">
                {TXN_CATEGORIES.filter(c => c !== 'income').map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                      category === c ? 'bg-primary-500/15 text-primary-500 border border-primary-500/30' : 'bg-surface-secondary border border-surface-border text-foreground/60 hover:border-primary-500/20'
                    }`}
                  >{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Account + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Account' : 'اکاؤنٹ'}</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm focus:outline-none focus:border-primary-500/50">
                <option value="">{lang === 'en' ? 'None' : 'کوئی نہیں'}</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Date' : 'تاریخ'}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Description' : 'تفصیل'}</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Lunch at restaurant' : 'مثلاً ریستوران میں لنچ'}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-surface-border">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-foreground/70 hover:bg-surface-hover transition-colors">
            {lang === 'en' ? 'Cancel' : 'منسوخ'}
          </button>
          <button
            onClick={handleSubmit} disabled={loading || !amount}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {lang === 'en' ? 'Add' : 'شامل کریں'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Goal Quick Add ───
export function QuickAddGoal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError(lang === 'en' ? 'Goal name required' : 'مقصد کا نام ضروری ہے'); return; }
    if (!target || parseFloat(target) <= 0) { setError(lang === 'en' ? 'Target amount required' : 'ہدف کی رقم ضروری ہے'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          target_amount: parseFloat(target),
          current_amount: parseFloat(current) || 0,
          deadline: deadline || null,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            <h2 className="text-base font-bold text-foreground">{lang === 'en' ? 'Add Goal' : 'مقصد شامل کریں'}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Goal Name' : 'مقصد کا نام'}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Emergency Fund' : 'مثلاً ایمرجنسی فنڈ'}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
            />
          </div>

          {/* Target + Current */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Target (PKR)' : 'ہدف (PKR)'}</label>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Saved (PKR)' : 'بچت (PKR)'}</label>
              <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Priority + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Priority' : 'ترجیح'}</label>
              <div className="flex gap-1.5">
                {GOAL_PRIORITIES.map((p) => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-semibold border transition-all ${
                      priority === p.value
                        ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                        : 'border-surface-border text-foreground/50 hover:border-primary-500/30'
                    }`}
                  >{lang === 'en' ? p.label : p.labelUr}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">{lang === 'en' ? 'Deadline' : 'آخری تاریخ'}</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-surface-border">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-foreground/70 hover:bg-surface-hover transition-colors">
            {lang === 'en' ? 'Cancel' : 'منسوخ'}
          </button>
          <button
            onClick={handleSubmit} disabled={loading || !name.trim() || !target}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {lang === 'en' ? 'Add Goal' : 'شامل کریں'}
          </button>
        </div>
      </div>
    </div>
  );
}
