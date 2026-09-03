'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowRightLeft, Target, Shield, Brain,
  TrendingUp, Moon, Sun, LogOut, Menu, X, Sparkles, ChevronRight,
  Globe, Waves, GitBranch, Navigation, RotateCcw, ShoppingBag,
  ChevronDown, ChevronUp, Zap, Camera, Home, LifeBuoy, Mail
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { clearCurrentUser } from '@/lib/use-current-user';
import { LogoIcon } from '@/components/logo';
import { useLang } from '@/lib/i18n';
import { BgPickerButton } from '@/components/bg-theme';
import { ProfileModal } from '@/components/profile-modal';
import { SupportModal } from '@/components/support-modal';
import { BottomNav } from '@/components/bottom-nav';
import { AvatarView } from '@/lib/avatar';

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportTab, setSupportTab] = useState<'contact' | 'support' | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userNameState, setUserNameState] = useState(userName);
  const { lang, toggleLang, t } = useLang();

  useEffect(() => setMounted(true), []);

  // Load avatar from localStorage (kept in sync on login and profile save)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ww_user');
      if (stored) {
        const u = JSON.parse(stored);
        setAvatar(u.avatar || null);
        if (u.name) setUserNameState(u.name);
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    document.cookie = 'ww_token=; path=/; max-age=0';
    clearCurrentUser();
    router.push('/');
  };

  const navItems = [
    { href: '/home', label: t('home'), icon: Home },
    { href: '/dashboard', label: t('commandCenter'), icon: LayoutDashboard },
    { href: '/simulator', label: t('whatIfSimNav'), icon: Sparkles },
    { href: '/digital-twin', label: t('digitalTwinNav'), icon: Brain },
    { href: '/transactions', label: t('transactionsNav'), icon: ArrowRightLeft },
    { href: '/goals', label: t('goalPlanner'), icon: Target },
    { href: '/risk', label: t('riskRadar'), icon: Shield },
    { href: '/coach', label: t('aiCoachNav'), icon: TrendingUp },
  ];

  const aiModules = [
    {
      href: '/ripple',
      label: 'Ripple Engine',
      desc: 'Decision ke saare effects',
      icon: Waves,
      gradient: 'from-amber-500 to-orange-500',
      badge: 'HERO',
    },
    {
      href: '/parallel',
      label: 'Parallel Futures',
      desc: '3 futures compare karo',
      icon: GitBranch,
      gradient: 'from-violet-500 to-purple-500',
      badge: null,
    },
    {
      href: '/gps',
      label: 'Financial GPS',
      desc: 'Goal tak ka route',
      icon: Navigation,
      gradient: 'from-cyan-500 to-blue-500',
      badge: null,
    },
    {
      href: '/time-machine',
      label: 'Time Machine',
      desc: 'Past badlo, future dekho',
      icon: RotateCcw,
      gradient: 'from-rose-500 to-pink-500',
      badge: null,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo with cultural accent */}
      <div className="p-5 border-b border-primary-800/30 relative">
        {/* Ajrak-inspired top border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
        <div className="flex items-center gap-3">
          <LogoIcon size="sm" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">WealthWise AI</h1>
            <p className="text-[9px] text-primary-300/70 font-bold tracking-wider">{t('digitalTwinNav').toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary-600/20 text-primary-300 shadow-sm shadow-primary-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto text-primary-500" />}
            </Link>
          );
        })}

        {/* Show All AI Modules Toggle */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 mt-2"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-[18px] h-[18px] text-amber-400" />
            <span>AI Modules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">{aiModules.length}</span>
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* AI Module Cards */}
        {showAll && (
          <div className="space-y-1.5 mt-1 pl-1">
            {aiModules.map((mod) => {
              const active = pathname === mod.href;
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg p-2.5 transition-all duration-200 ${
                    active
                      ? 'bg-white/10 border border-white/10'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${mod.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${active ? 'text-white' : 'text-gray-300'}`}>{mod.label}</span>
                        {mod.badge && (
                          <span className="text-[8px] font-black text-amber-400 bg-amber-400/10 px-1 py-px rounded-full">{mod.badge}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{mod.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-800/30 space-y-3">
        {/* Contact & Support */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSupportTab('contact')}
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[11px] font-semibold"
          >
            <Mail className="w-3.5 h-3.5 text-primary-400" />
            {t('contactUs')}
          </button>
          <button
            onClick={() => setSupportTab('support')}
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[11px] font-semibold"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
            {t('support')}
          </button>
        </div>

        {/* Language switcher */}
        {mounted && (
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors bg-white/5 hover:bg-white/10 text-gray-300"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? '🇬🇧 English' : '🇵🇰 اردو'}</span>
            </span>
            <span className="text-[9px] font-bold bg-primary-700/50 px-1.5 py-0.5 rounded text-primary-200">
              {lang === 'en' ? 'EN' : 'UR'}
            </span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 group text-left min-w-0"
            title="Profile Setup"
          >
            <div className="relative">
              <AvatarView avatar={avatar} name={userNameState} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary-600 border-2 border-primary-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-2 h-2 text-white" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate max-w-[110px] group-hover:text-primary-300 transition-colors">{userNameState}</p>
              <p className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors">{t('account')} 🇵🇰 · <span className="text-primary-400 font-semibold">Profile</span></p>
            </div>
          </button>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0" title={t('logout')}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? t('lightMode') : t('darkMode')}
          </button>
        )}
        {mounted && (
          <BgPickerButton lang={lang} className="w-full" />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-primary-900/90 text-white shadow-lg backdrop-blur-sm"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gradient-to-b from-primary-950 via-primary-900/95 to-primary-950 border-r border-primary-800/30 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-primary-950 border-r border-primary-800/30 transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Profile Setup Modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={(user) => {
          setAvatar(user.avatar);
          setUserNameState(user.name);
        }}
      />

      {/* Contact & Support Modal */}
      <SupportModal
        open={supportTab !== null}
        initialTab={supportTab ?? 'contact'}
        onClose={() => setSupportTab(null)}
      />

      {/* Mobile bottom navigation */}
      <BottomNav />
    </>
  );
}
