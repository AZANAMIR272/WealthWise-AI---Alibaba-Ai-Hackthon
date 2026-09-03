'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, LayoutDashboard, Zap, Waves, GitBranch, Navigation, RotateCcw, X
} from 'lucide-react';
import { ProfileModal } from '@/components/profile-modal';
import { AvatarView } from '@/lib/avatar';
import { useLang } from '@/lib/i18n';

const AI_MODULES = [
  { href: '/ripple', label: 'Ripple Engine', desc: 'Decision ke saare effects', icon: Waves, gradient: 'from-amber-500 to-orange-500' },
  { href: '/parallel', label: 'Parallel Futures', desc: '3 futures compare karo', icon: GitBranch, gradient: 'from-violet-500 to-purple-500' },
  { href: '/gps', label: 'Financial GPS', desc: 'Goal tak ka route', icon: Navigation, gradient: 'from-cyan-500 to-blue-500' },
  { href: '/time-machine', label: 'Time Machine', desc: 'Past badlo, future dekho', icon: RotateCcw, gradient: 'from-rose-500 to-pink-500' },
];

/**
 * Mobile bottom navigation bar (hidden on desktop lg+).
 * Rendered inside <Sidebar /> so it appears on every app page automatically.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  const [modulesOpen, setModulesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('User');

  // Load current user (avatar + name) from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ww_user');
      if (stored) {
        const u = JSON.parse(stored);
        setAvatar(u.avatar || null);
        if (u.name) setName(u.name);
      }
    } catch {}
  }, []);

  // Reserve document space so the fixed bar never covers page content (mobile only)
  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  const isModuleActive = AI_MODULES.some((m) => pathname === m.href);

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
      active ? 'text-primary-500' : 'text-text-muted hover:text-text-secondary'
    }`;

  return (
    <>
      {/* AI Modules bottom sheet */}
      {modulesOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setModulesOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden sheet-up rounded-t-3xl bg-surface-secondary border-t border-border-secondary shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {lang === 'en' ? 'AI Modules' : 'AI ماڈیولز'}
              </h3>
              <button
                onClick={() => setModulesOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 pt-2 pb-7">
              {AI_MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    onClick={() => setModulesOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-primary border border-border-secondary hover:border-primary-500/40 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${mod.gradient} flex items-center justify-center flex-shrink-0 shadow`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{mod.label}</p>
                      <p className="text-[10px] text-text-muted truncate">{mod.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom bar (mobile only) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-surface-secondary/95 backdrop-blur-xl border-t border-border-secondary shadow-[0_-4px_24px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4 max-w-lg mx-auto">
          <Link href="/home" className={itemClass(pathname === '/home')}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">{lang === 'en' ? 'Home' : 'ہوم'}</span>
          </Link>
          <Link href="/dashboard" className={itemClass(pathname === '/dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">{lang === 'en' ? 'Dashboard' : 'ڈیش بورڈ'}</span>
          </Link>
          <button onClick={() => setModulesOpen(true)} className={itemClass(isModuleActive)}>
            <Zap className={`w-5 h-5 ${isModuleActive ? 'text-amber-400' : ''}`} />
            <span className="text-[10px] font-bold">{lang === 'en' ? 'AI Modules' : 'AI ماڈیولز'}</span>
          </button>
          <button onClick={() => setProfileOpen(true)} className={itemClass(false)}>
            <AvatarView avatar={avatar} name={name} size="sm" />
            <span className="text-[10px] font-bold">{lang === 'en' ? 'Profile' : 'پروفائل'}</span>
          </button>
        </div>
      </nav>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={(user) => {
          setAvatar(user.avatar);
          setName(user.name);
        }}
      />
    </>
  );
}
