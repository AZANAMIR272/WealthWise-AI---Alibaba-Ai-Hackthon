'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogoIcon } from '@/components/logo';
import {
  ShieldCheck, Loader2, ArrowLeft, ArrowRight, Users, Ban, CheckCircle,
  Trash2, LogOut, Search, RefreshCw, Activity, AlertTriangle, Mail, XCircle
} from 'lucide-react';
import { ADMIN_TEAM } from '@/lib/admin-config';

interface AdminUser {
  id: string; name: string; email: string; status: string; is_demo: number;
  email_verified: number; created_at: string; accounts_count: number;
  transactions_count: number; total_balance: number;
}

interface AdminLog {
  admin_name: string; action: string; target_email: string | null;
  details: string; created_at: string;
}

function formatPKR(n: number): string {
  if (Math.abs(n) >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}

export default function AdminPage() {
  const router = useRouter();
  // Step 1: credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  // Step 2: photo selection
  const [adminName, setAdminName] = useState('');
  const [adminToken, setAdminToken] = useState('');
  // Step 3: dashboard
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0, totalBalance: 0 });
  const [search, setSearch] = useState('');
  const [selectedAdminPhoto, setSelectedAdminPhoto] = useState('');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ─── Step 1: credential login ───────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Email aur password enter karein'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setTempToken(data.tempToken);
        setStep(2);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: select which team member is using the panel ───────────────────────────────────────────
  const handleSelectAdmin = async (member: { name: string; photo: string }) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, adminName: member.name }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminName(data.adminName);
        setAdminToken(data.adminToken);
        setSelectedAdminPhoto(member.photo);
        setStep(3);
        loadUsers(data.adminToken);
      } else {
        setError(data.error || 'Selection failed');
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: dashboard data ───────────────────────────────────────────
  const loadUsers = async (token?: string) => {
    const t = token || adminToken;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setLogs(data.logs);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'block' | 'unblock' | 'delete') => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken, action, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Action successful');
        setConfirmDelete(null);
        loadUsers();
      } else {
        setError(data.error || 'Action failed');
      }
    } catch {
      setError('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setStep(1);
    setEmail(''); setPassword(''); setTempToken('');
    setAdminName(''); setAdminToken(''); setSelectedAdminPhoto('');
    setUsers([]); setLogs([]); setSearch('');
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const actionIcons: Record<string, any> = {
    block: <Ban className="w-3 h-3" />,
    unblock: <CheckCircle className="w-3 h-3" />,
    delete: <Trash2 className="w-3 h-3" />,
  };

  return (
    <div className="min-h-screen bg-surface-primary relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl">
          {/* ─── STEP 1: Credentials ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="max-w-md mx-auto">
              <div className="rounded-3xl bg-surface-secondary/80 backdrop-blur-xl border border-border-secondary p-8 shadow-2xl shadow-black/10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-text-primary">Admin Panel</h1>
                  <p className="text-sm text-text-muted mt-1">WealthWise AI — Management Console</p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Admin Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="admin@wealthwise.ai"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Admin Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Access Admin Panel</>}
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-xs text-text-muted hover:text-text-secondary font-semibold flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Select Admin Photo ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-3xl bg-surface-secondary/80 backdrop-blur-xl border border-border-secondary p-8 shadow-2xl shadow-black/10">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-extrabold text-text-primary">Kaun ho aap?</h1>
                  <p className="text-sm text-text-muted mt-1">Select your photo to continue — this will be logged</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {ADMIN_TEAM.map((member) => (
                    <button
                      key={member.name}
                      onClick={() => handleSelectAdmin(member)}
                      disabled={loading}
                      className="group relative flex flex-col items-center"
                    >
                      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-[3px] ring-primary-500/30 group-hover:ring-primary-500 shadow-lg group-hover:scale-105 group-hover:shadow-primary-500/30 transition-all duration-300">
                        <Image src={member.photo} alt={member.name} fill className="object-cover" sizes="96px" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="mt-3 text-xs font-bold text-text-primary text-center leading-tight group-hover:text-primary-500 transition-colors">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-text-muted mt-0.5">{member.role}</span>
                      <span className="mt-2 flex items-center gap-1 px-3 py-1 rounded-full bg-primary-500/10 group-hover:bg-primary-500/20 text-[9px] font-bold text-primary-500 transition-all">
                        <ArrowRight className="w-2.5 h-2.5" /> Select
                      </span>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mt-6 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="mt-8 w-full text-xs text-text-muted hover:text-text-secondary font-semibold flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Dashboard ─────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-[3px] ring-primary-500/40 shadow-lg">
                    <Image src={selectedAdminPhoto} alt={adminName} fill className="object-cover" sizes="56px" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary-500" /> Admin Panel
                    </h1>
                    <p className="text-xs text-text-muted mt-0.5">
                      Logged in as <span className="font-bold text-primary-500">{adminName}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadUsers()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-secondary bg-surface-primary hover:bg-surface-tertiary text-text-secondary text-xs font-semibold transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-surface-secondary/80 border border-border-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Users</span>
                  </div>
                  <p className="text-2xl font-extrabold text-text-primary">{stats.total}</p>
                </div>
                <div className="bg-surface-secondary/80 border border-border-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-500">{stats.active}</p>
                </div>
                <div className="bg-surface-secondary/80 border border-border-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Ban className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Blocked</span>
                  </div>
                  <p className="text-2xl font-extrabold text-red-500">{stats.blocked}</p>
                </div>
                <div className="bg-surface-secondary/80 border border-border-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Balance</span>
                  </div>
                  <p className="text-lg font-extrabold text-amber-500 leading-7">{formatPKR(stats.totalBalance)}</p>
                </div>
              </div>

              {/* Search + Users Table */}
              <div className="bg-surface-secondary/80 border border-border-secondary rounded-2xl overflow-hidden mb-6">
                <div className="p-4 border-b border-border-secondary">
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 mx-4 mt-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-tertiary/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Accounts</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Balance</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Joined</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-border-secondary hover:bg-surface-tertiary/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary text-xs truncate flex items-center gap-1.5">
                                  {u.name}
                                  {u.is_demo === 1 && <span className="text-[8px] font-black px-1.5 py-px rounded-full bg-amber-500/15 text-amber-500">DEMO</span>}
                                </p>
                                <p className="text-[10px] text-text-muted truncate flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" /> {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {u.status === 'blocked' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/10 text-red-500">
                                <Ban className="w-3 h-3" /> Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            )}
                            {u.email_verified === 0 && (
                              <span className="ml-1 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-text-secondary font-semibold">{u.accounts_count} accts</span>
                            <p className="text-[10px] text-text-muted">{u.transactions_count} txns</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs font-bold text-text-primary">{formatPKR(u.total_balance || 0)}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-[10px] text-text-muted">
                              {u.created_at ? new Date(u.created_at + 'Z').toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.status === 'blocked' ? (
                                <button
                                  onClick={() => handleAction(u.id, 'unblock')}
                                  disabled={loading}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold transition-all"
                                  title="Unblock user"
                                >
                                  <CheckCircle className="w-3 h-3" /> Unblock
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(u.id, 'block')}
                                  disabled={loading}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold transition-all"
                                  title="Block user"
                                >
                                  <Ban className="w-3 h-3" /> Block
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmDelete(u)}
                                disabled={loading}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold transition-all"
                                title="Delete user"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-surface-secondary/80 border border-border-secondary rounded-2xl p-5">
                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> Recent Admin Activity
                </h2>
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-primary/50">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.action === 'block' ? 'bg-amber-500/10 text-amber-500' :
                        log.action === 'delete' ? 'bg-red-500/10 text-red-500' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {actionIcons[log.action] || <Activity className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary">
                          <span className="font-bold">{log.admin_name}</span> — {log.details}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {log.created_at ? new Date(log.created_at + 'Z').toLocaleString('en-PK') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-xs text-text-muted text-center py-6">No admin activity yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logo footer */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <LogoIcon size="sm" />
            <span className="text-[10px] text-text-muted font-bold tracking-wider">WEALTHWISE AI — ADMIN CONSOLE</span>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-secondary border border-border-secondary rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Delete User?</h3>
                <p className="text-xs text-text-muted">This cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              <span className="font-bold text-text-primary">{confirmDelete.name}</span> ({confirmDelete.email}) aur unka sara data — accounts, transactions, goals — permanently delete ho jayega.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border-secondary text-text-secondary text-sm font-semibold hover:bg-surface-tertiary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmDelete.id, 'delete')}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}
    </div>
  );
}
