'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { ArrowRightLeft, Plus, Upload, Filter, Search, Trash2, Loader2, FileText, Check, X, Sparkles, Brain, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import Papa from 'papaparse';

interface Transaction {
  id: string; type: string; amount: number; category: string; description: string;
  date: string; account_name?: string; status: string; is_recurring: number;
}

const CATEGORIES = ['food','transport','shopping','bills','housing','education','healthcare','entertainment','travel','income','savings','debt','transfers','other'];
const CAT_ICONS: Record<string, string> = {
  food: '🍽️', transport: '🚗', shopping: '🛒', bills: '📄', housing: '🏠',
  education: '📚', healthcare: '🏥', entertainment: '🎬', travel: '✈️',
  income: '💰', savings: '🏦', debt: '💳', transfers: '🔄', other: '📦'
};

function formatPKR(n: number): string {
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

export default function TransactionsPage() {
  const currentUser = useCurrentUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState({ category: '', search: '' });
  const [importData, setImportData] = useState<any[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState('');
  const [newTxn, setNewTxn] = useState({
    type: 'expense', amount: '', category: 'food', description: '', date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { loadTransactions(); }, [filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) { window.location.href = '/'; return; }
      const data = await res.json();
      setTransactions(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addTransaction = async () => {
    if (!newTxn.amount) return;
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTxn, amount: parseFloat(newTxn.amount) }),
      });
      setNewTxn({ type: 'expense', amount: '', category: 'food', description: '', date: new Date().toISOString().split('T')[0] });
      setShowAdd(false);
      loadTransactions();
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const rows = results.data as any[];
        const mapped = rows.filter(r => r.amount || r.Amount).map(r => ({
          type: (r.type || r.Type || 'expense').toLowerCase(),
          amount: parseFloat(r.amount || r.Amount || '0'),
          category: (r.category || r.Category || 'other').toLowerCase(),
          description: r.description || r.Description || r.memo || '',
          date: r.date || r.Date || new Date().toISOString().split('T')[0],
        })).filter(r => r.amount > 0);
        setImportData(mapped);
        setShowImport(true);
      },
    });
  };

  const confirmImport = async () => {
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'import', transactions: importData }),
      });
      setShowImport(false);
      setImportData([]);
      loadTransactions();
    } catch (err) { console.error(err); }
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAiAnalyzing(true);
    setAiError('');
    setAiResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/ai/statement', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data);
        loadTransactions();
      } else {
        setAiError(data.error || 'Analysis failed');
      }
    } catch {
      setAiError('Server se connect nahi ho pa raha');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const deleteTxn = async (id: string) => {
    try {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      loadTransactions();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
              <p className="text-muted text-sm">View, add, and import your financial transactions</p>
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 cursor-pointer transition-all shadow-lg shadow-primary-500/20">
                <Sparkles className="w-4 h-4" />
                AI Statement Upload
                <input type="file" accept=".pdf,.csv,.png,.jpg,.jpeg" onChange={handleAiUpload} className="hidden" />
              </label>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-surface-border text-sm text-foreground hover:border-primary-500/30 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-primary-500" />
                Import CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Add Transaction Form */}
          {showAdd && (
            <div className="bg-surface border border-surface-border rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Add Transaction</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <select value={newTxn.type} onChange={(e) => setNewTxn({...newTxn, type: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                  <option value="debt_payment">Debt Payment</option>
                </select>
                <input type="number" placeholder="Amount (PKR)" value={newTxn.amount}
                  onChange={(e) => setNewTxn({...newTxn, amount: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm" />
                <select value={newTxn.category} onChange={(e) => setNewTxn({...newTxn, category: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                <input type="text" placeholder="Description" value={newTxn.description}
                  onChange={(e) => setNewTxn({...newTxn, description: e.target.value})}
                  className="px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm" />
                <div className="flex gap-2">
                  <input type="date" value={newTxn.date} onChange={(e) => setNewTxn({...newTxn, date: e.target.value})}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-background border border-surface-border text-foreground text-sm" />
                  <button onClick={addTransaction} className="px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Review */}
          {showImport && importData.length > 0 && (
            <div className="bg-surface border border-gold-500/30 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold-500" />
                  Review Import ({importData.length} transactions)
                </h3>
                <div className="flex gap-2">
                  <button onClick={confirmImport} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm">
                    <Check className="w-3.5 h-3.5" /> Confirm All
                  </button>
                  <button onClick={() => setShowImport(false)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {importData.slice(0, 20).map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 text-xs rounded hover:bg-background">
                    <div className="flex items-center gap-2">
                      <span>{CAT_ICONS[t.category] || '📦'}</span>
                      <span className="text-foreground">{t.description || t.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">{t.date}</span>
                      <span className={`font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatPKR(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {importData.length > 20 && <p className="text-xs text-muted text-center py-2">...and {importData.length - 20} more</p>}
              </div>
            </div>
          )}

          {/* AI Analyzing */}
          {aiAnalyzing && (
            <div className="bg-surface border border-primary-500/30 rounded-2xl p-8 mb-5 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center animate-pulse">
                <Brain className="w-7 h-7 text-primary-500 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-foreground">AI is analyzing your statement...</p>
              <p className="text-xs text-muted mt-1">Reading transactions, categorizing, and generating savings advice</p>
              <div className="flex justify-center gap-1.5 mt-4">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* AI Error */}
          {aiError && !aiAnalyzing && (
            <div className="bg-surface border border-red-500/30 rounded-2xl p-5 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Statement Analysis Failed</p>
                  <p className="text-xs text-muted mt-0.5">{aiError}</p>
                </div>
              </div>
              <button onClick={() => setAiError('')} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Results */}
          {aiResult && !aiAnalyzing && (
            <div className="space-y-4 mb-5">
              {/* Summary Bar */}
              <div className="bg-surface border border-primary-500/30 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">AI Analysis Complete</h3>
                      <p className="text-[10px] text-muted">{aiResult.imported} transactions added to "{aiResult.accountName}"</p>
                    </div>
                  </div>
                  <button onClick={() => setAiResult(null)} className="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center justify-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-500" /></div>
                    <p className="text-base font-bold text-green-500 mt-1">{formatPKR(aiResult.totalIncome)}</p>
                    <p className="text-[10px] text-muted">Income</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center justify-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /></div>
                    <p className="text-base font-bold text-red-500 mt-1">{formatPKR(aiResult.totalExpense)}</p>
                    <p className="text-[10px] text-muted">Expenses</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                    <div className="flex items-center justify-center gap-1"><Brain className="w-3.5 h-3.5 text-primary-500" /></div>
                    <p className={`text-base font-bold mt-1 ${aiResult.balanceDelta >= 0 ? 'text-primary-500' : 'text-gold-500'}`}>{formatPKR(aiResult.balanceDelta)}</p>
                    <p className="text-[10px] text-muted">Net Change</p>
                  </div>
                </div>
                {aiResult.analysis?.summary && (
                  <p className="text-xs text-foreground/80 leading-relaxed border-t border-surface-border pt-3">{aiResult.analysis.summary}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category Breakdown */}
                <div className="bg-surface border border-surface-border rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary-500" />
                    Categories Detected
                  </h4>
                  <div className="space-y-2">
                    {aiResult.byCategory?.slice(0, 8).map((c: any) => {
                      const maxTotal = aiResult.byCategory[0]?.total || 1;
                      return (
                        <div key={c.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground font-medium flex items-center gap-1.5">
                              <span>{CAT_ICONS[c.category] || '📦'}</span>
                              <span className="capitalize">{c.category}</span>
                            </span>
                            <span className="text-muted">{formatPKR(c.total)} <span className="text-[10px]">({c.count})</span></span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-700/20 overflow-hidden">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${(c.total / maxTotal) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-gradient-to-br from-primary-500/10 to-gold-500/5 border border-primary-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-gold-500" />
                      AI Savings Suggestions
                    </h4>
                    {aiResult.analysis?.monthly_save_target && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gold-500/10 text-gold-500">
                        Save {formatPKR(aiResult.analysis.monthly_save_target)}/mo
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {aiResult.analysis?.suggestions?.map((s: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-surface border border-surface-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-foreground capitalize flex items-center gap-1.5">
                            <span>{CAT_ICONS[s.category] || '📦'}</span>{s.category}
                          </span>
                          {s.save_amount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">
                              −{formatPKR(s.save_amount)}/mo
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted mb-1">{s.issue}</p>
                        <p className="text-xs text-foreground/90 leading-relaxed">💡 {s.tip}</p>
                      </div>
                    )) || (
                      <p className="text-xs text-muted">Suggestions unavailable right now.</p>
                    )}
                  </div>
                  {aiResult.analysis?.general_advice && (
                    <p className="text-xs text-foreground/80 italic mt-3 pt-3 border-t border-surface-border/50 leading-relaxed">
                      🧠 {aiResult.analysis.general_advice}
                    </p>
                  )}
                </div>
              </div>

              {/* Extracted Transactions Preview */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-foreground mb-3">Extracted Transactions (auto-added)</h4>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {aiResult.transactions?.slice(0, 30).map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 text-xs rounded hover:bg-background">
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{CAT_ICONS[t.category] || '📦'}</span>
                        <span className="text-foreground truncate">{t.description}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-muted">{t.date}</span>
                        <span className={`font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '−'}{formatPKR(t.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilter({ ...filter, category: '' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filter.category ? 'bg-primary-600 text-white' : 'bg-surface border border-surface-border text-muted hover:text-foreground'}`}>
              All
            </button>
            {CATEGORIES.slice(0, 8).map(c => (
              <button key={c} onClick={() => setFilter({ ...filter, category: c })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter.category === c ? 'bg-primary-600 text-white' : 'bg-surface border border-surface-border text-muted hover:text-foreground'}`}>
                {CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <ArrowRightLeft className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                  <p className="text-foreground font-medium">No transactions found</p>
                  <p className="text-muted text-sm">Add your first transaction or import a CSV file</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border/50">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">{CAT_ICONS[t.category] || '📦'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.description || t.category}</p>
                          <p className="text-[10px] text-muted">{t.date} • {t.category} {t.account_name && `• ${t.account_name}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-500' : t.type === 'savings' ? 'text-blue-500' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : t.type === 'savings' ? '' : '-'}{formatPKR(t.amount)}
                        </span>
                        <button onClick={() => deleteTxn(t.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
