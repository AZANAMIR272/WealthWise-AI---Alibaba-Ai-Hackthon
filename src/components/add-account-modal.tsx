'use client';
import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', labelUr: 'بینک اکاؤنٹ', icon: '🏦' },
  { value: 'savings', label: 'Savings', labelUr: 'بچت', icon: '💰' },
  { value: 'cash', label: 'Cash', labelUr: 'نقد', icon: '💵' },
  { value: 'mobile_wallet', label: 'Mobile Wallet', labelUr: 'موبائل والیٹ', icon: '📱' },
  { value: 'investment', label: 'Investment', labelUr: 'سرمایہ کاری', icon: '📈' },
  { value: 'debt', label: 'Loan / Debt', labelUr: 'قرض', icon: '💳' },
  { value: 'credit', label: 'Credit Card', labelUr: 'کریڈٹ کارڈ', icon: '💳' },
];

export function AddAccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError(lang === 'en' ? 'Account name required' : 'اکاؤنٹ کا نام ضروری ہے'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, balance: parseFloat(balance) || 0 }),
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
      <div
        className="relative w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-500" />
            <h2 className="text-base font-bold text-foreground">
              {lang === 'en' ? 'Add Account' : 'اکاؤنٹ شامل کریں'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              {lang === 'en' ? 'Account Name' : 'اکاؤنٹ کا نام'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. HBL Salary Account' : 'مثلاً HBL سیلری اکاؤنٹ'}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              {lang === 'en' ? 'Account Type' : 'اکاؤنٹ کی قسم'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all ${
                    type === t.value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                      : 'border-surface-border hover:border-primary-500/30 text-foreground/70'
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="font-medium leading-tight text-center">
                    {lang === 'en' ? t.label : t.labelUr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              {lang === 'en' ? 'Opening Balance (PKR)' : 'افتتاحی بیلنس (PKR)'}
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-surface-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-surface-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-foreground/70 hover:bg-surface-hover transition-colors"
          >
            {lang === 'en' ? 'Cancel' : 'منسوخ'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {lang === 'en' ? 'Add Account' : 'شامل کریں'}
          </button>
        </div>
      </div>
    </div>
  );
}
