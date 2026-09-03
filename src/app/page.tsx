'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Sparkles, Shield, TrendingUp, Brain, ArrowRight, Lock, ExternalLink, KeyRound, MailCheck, ArrowLeft, ShieldCheck, Mail, LifeBuoy } from 'lucide-react';
import { LogoFull, LogoIcon } from '@/components/logo';
import { useLang } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import Image from 'next/image';
import { saveCurrentUser } from '@/lib/use-current-user';
import { createClient } from '@supabase/supabase-js';
import { TurnstileWidget } from '@/components/turnstile';
import { SupportModal } from '@/components/support-modal';

// Animated Aurora Background — live theme-matched glow (emerald/gold/teal)
function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="aurora-blob aurora-4" />
    </div>
  );
}

// LinkedIn Icon SVG
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// Google Icon
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t, lang, toggleLang } = useLang();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState('');
  // OTP / Forgot password flow
  const [authStep, setAuthStep] = useState<'form' | 'otp' | 'forgot'>('form');
  const [otpPurpose, setOtpPurpose] = useState<'register' | 'reset'>('register');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devCode, setDevCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  // Contact / Support modal
  const [supportTab, setSupportTab] = useState<'contact' | 'support' | null>(null);

  // Reset CAPTCHA widget + token together so visual state never lies
  const [captchaReset, setCaptchaReset] = useState(0);
  const resetCaptcha = () => {
    setTurnstileToken('');
    setCaptchaReset(k => k + 1);
  };

  // Handle Supabase OAuth hash fragment (implicit flow — access_token in URL hash)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      // Clean URL immediately to avoid re-processing
      window.history.replaceState({}, '', window.location.pathname);
      setGoogleLoading(true);
      fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
        redirect: 'manual',
      })
        .then(() => {
          router.replace('/home');
        })
        .catch(() => {
          setError('Google login failed. Please try again.');
          setGoogleLoading(false);
        });
    }
    // Also check hash for Supabase error messages
    const hashError = params.get('error');
    if (hashError && !accessToken) {
      setError('Google login failed: ' + (params.get('error_description') || hashError));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  // OTP resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');
    if (!email || !password || (mode === 'register' && (!name || !confirmPassword))) {
      setError('Sab fields fill karein');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords match nahi ho rahe');
      return;
    }
    if (password.length < 6) {
      setError('Password minimum 6 characters');
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      resetCaptcha();
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email, password, turnstileToken }
        : { name, email, password, turnstileToken };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.needVerification) {
          // Registration successful — OTP verification required
          setOtpPurpose('register');
          setAuthStep('otp');
          setDevCode(data.devCode || '');
          setOtpCode('');
          setResendCooldown(60);
        } else {
          saveCurrentUser(data.user);
          router.push('/home');
        }
      } else {
        setError(data.error || 'Kuch galat ho gaya');
        // Token is single-use — even a failed attempt consumes it, so reset the widget
        resetCaptcha();
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP Verification (after registration) ───────────────────
  const handleVerifyOtp = async () => {
    setError('');
    if (!otpCode.trim()) { setError('Code enter karein'); return; }
    if (otpPurpose === 'reset' && newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      if (otpPurpose === 'register') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: otpCode }),
        });
        const data = await res.json();
        if (res.ok) {
          saveCurrentUser(data.user);
          router.push('/home');
        } else {
          setError(data.error || 'Verification failed');
        }
      } else {
        // Reset password with OTP
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: otpCode, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setAuthStep('form');
          setMode('login');
          setOtpCode('');
          setNewPassword('');
          setPassword('');
          setDevCode('');
          setSuccessMsg('Password reset ho gaya! Ab naye password se login karein.');
        } else {
          setError(data.error || 'Reset failed');
        }
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: otpPurpose }),
      });
      const data = await res.json();
      if (res.ok) {
        setDevCode(data.devCode || '');
        setResendCooldown(60);
        setSuccessMsg('Naya code bhej diya gaya hai!');
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password: send OTP ───────────────────────────────────────────
  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!email.trim()) { setError('Email enter karein'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpPurpose('reset');
        setAuthStep('otp');
        setDevCode(data.devCode || '');
        setOtpCode('');
        setResendCooldown(60);
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setError('Google OAuth not configured. Use email/password login.');
      setGoogleLoading(false);
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Force-clear all cached Supabase sessions from storage
    try {
      const keys = Object.keys(localStorage);
      keys.filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
    await supabase.auth.signOut().catch(() => {});
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/google`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      setError('Google login failed: ' + error.message);
      setGoogleLoading(false);
    }
    // Supabase redirects to Google — page will navigate away
  };

  // Show Google OAuth error from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err && err !== 'google_no_code') {
      const messages: Record<string, string> = {
        google_exchange_failed: 'Google authentication failed. Please try again.',
        google_no_email: 'Google account has no email.',
        google_login_failed: 'Google login failed. Please try again.',
      };
      setError(messages[err] || 'Google login error. Try email/password.');
    }
  }, []);

  const [demoLoading, setDemoLoading] = useState(false);
  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        saveCurrentUser(data.user);
        router.push('/home');
      } else {
        setError(data.error || 'Demo login failed');
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setDemoLoading(false);
    }
  };

  const features = [
    { icon: Brain, title: t('financialTwin'), desc: t('financialTwinDesc'), color: 'from-emerald-500 to-emerald-700' },
    { icon: Sparkles, title: t('whatIfSim'), desc: t('whatIfSimDesc'), color: 'from-amber-500 to-amber-700' },
    { icon: Shield, title: t('stressTest'), desc: t('stressTestDesc'), color: 'from-blue-500 to-blue-700' },
    { icon: TrendingUp, title: t('aiCoach'), desc: t('aiCoachDesc'), color: 'from-rose-500 to-rose-700' },
  ];

  const team = [
    { name: 'Syed Muhammad Azan', photo: '/team/syed-az.jpg', linkedin: 'https://www.linkedin.com/in/syed-muhammad-azan-5703a9312/', glow: 'shadow-emerald-500/40', ring: 'ring-emerald-500/50', gradient: 'from-emerald-500 to-emerald-700', role: lang === 'en' ? 'Lead Developer' : 'لیڈ ڈیولپر' },
    { name: 'Mariam Zuberi', photo: '/team/mariam-z.png', linkedin: 'https://www.linkedin.com/in/mariam-zuberi-24a2a7294/', glow: 'shadow-rose-500/40', ring: 'ring-rose-500/50', gradient: 'from-rose-500 to-rose-700', role: lang === 'en' ? 'Designer' : 'ڈیزائنر' },
    { name: 'Isbah Ali', photo: '/team/isbah-a.png', linkedin: 'https://www.linkedin.com/in/isbah-ali-dataanalyst/', glow: 'shadow-blue-500/40', ring: 'ring-blue-500/50', gradient: 'from-blue-500 to-blue-700', role: lang === 'en' ? 'Data Analyst' : 'ڈیٹا اینالسٹ' },
    { name: 'Muhammad Safwan', photo: '/team/safwan.png', linkedin: 'https://www.linkedin.com/in/safwan282/', glow: 'shadow-amber-500/40', ring: 'ring-amber-500/50', gradient: 'from-amber-500 to-amber-700', role: lang === 'en' ? 'Developer' : 'ڈیولپر' },
  ];

  return (
    <div className="min-h-screen bg-surface-primary relative overflow-hidden">
      <AuroraBackground />

      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-secondary/80 backdrop-blur-md border border-border-secondary/50 shadow-lg hover:bg-surface-tertiary transition-all cursor-pointer group"
      >
        <Globe className="w-4 h-4 text-primary-500 group-hover:rotate-12 transition-transform" />
        <span className="text-sm font-bold text-text-primary">{lang === 'en' ? '\uD83C\uDDF5\uD83C\uDDF0 \u0627\u0631\u062F\u0648' : '\uD83C\uDDFA\uD83C\uDDF8 English'}</span>
      </button>

      <div className="relative z-10 lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* LEFT: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-transparent">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <LogoFull light size="lg" />
            </div>

            <div className="mb-12">
              <h2 className="text-4xl font-extrabold text-text-primary leading-tight mb-4">
                {lang === 'en' ? <>Paisa Soch Ke Chalao,<br /><span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 bg-clip-text text-transparent">Future AI Se Poochho</span></> : <>پیسہ سوچ کے چلاؤ،<br /><span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 bg-clip-text text-transparent">فیوچر AI سے پوچھو</span></>}
              </h2>
              <p className="text-text-secondary text-lg max-w-md leading-relaxed">
                {t('taglineSub')}
              </p>
            </div>
          </div>

          {/* Feature cards */}
          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-secondary/50 backdrop-blur-sm border border-border-secondary/30 hover:border-primary-500/30 transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm">{f.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Cultural footer */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
            <div className="flex gap-2">
              {['🇵🇰', '🕌', '✨'].map((e, i) => (
                <span key={i} className="text-lg">{e}</span>
              ))}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
          </div>
          <p className="text-center text-xs text-text-muted mt-3">
            {t('provinces')}
          </p>
        </div>

        {/* RIGHT: Auth */}
        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8 pt-6">
              <div className="inline-flex items-center gap-4 mb-4">
                <LogoIcon size="lg" />
                <div className="text-left">
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-500 to-amber-400 bg-clip-text text-transparent leading-tight">
                    WealthWise AI
                  </h1>
                  <p className="text-[10px] text-text-muted tracking-[0.2em] font-bold mt-0.5">EMPOWERING FINANCIAL FUTURES</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{t('taglineRoman')}</p>
            </div>

            {/* Auth Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-surface-secondary/80 backdrop-blur-xl border border-border-secondary p-5 sm:p-8 shadow-2xl shadow-black/10 overflow-hidden">
              <h2 className="text-2xl font-extrabold text-center text-text-primary mb-2">
                {authStep === 'otp' ? (lang === 'en' ? 'Verify Your Email' : 'اپنی ای میل کی تصدیق کریں')
                  : authStep === 'forgot' ? (lang === 'en' ? 'Reset Password' : 'پاس ورڈ ری سیٹ')
                  : mode === 'login' ? (lang === 'en' ? 'Welcome Back' : 'واپس آئیں') : (lang === 'en' ? 'Get Started' : 'شروع کریں')}
              </h2>
              <p className="text-sm text-center text-text-muted mb-8">
                {authStep === 'otp'
                  ? (lang === 'en' ? `We sent a 6-digit code to ${email}` : `ہم نے 6 ہندسوں کا کوڈ ${email} پر بھیجا ہے`)
                  : authStep === 'forgot'
                  ? (lang === 'en' ? 'Enter your email — we will send a reset code' : 'اپنی ای میل درج کریں — ہم ری سیٹ کوڈ بھیجیں گے')
                  : mode === 'login' ? (lang === 'en' ? 'Log in to your account' : 'اپنے اکاؤنٹ میں لاگ ان کریں') : (lang === 'en' ? 'Create a new account — it\'s free!' : 'نیا اکاؤنٹ بنائیں — مفت ہے!')}
              </p>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 mb-4">
                  <MailCheck className="w-4 h-4 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              {devCode && authStep === 'otp' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 mb-4">
                  <KeyRound className="w-4 h-4 flex-shrink-0" />
                  <span>Demo mode (email service not configured) — your code: <span className="font-black tracking-widest text-sm">{devCode}</span></span>
                </div>
              )}

              {authStep === 'form' && (<>
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-border-secondary bg-surface-primary hover:bg-surface-tertiary transition-all text-text-primary font-semibold disabled:opacity-50 mb-4"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-text-muted border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm">{googleLoading ? (lang === 'en' ? 'Connecting...' : 'کنیکٹ ہو رہا ہے...') : (lang === 'en' ? 'Continue with Google' : 'گوگل سے جاری رکھیں')}</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border-secondary" />
                <span className="text-xs text-text-muted font-medium">{lang === 'en' ? 'OR BY EMAIL' : 'یا ای میل سے'}</span>
                <div className="flex-1 h-px bg-border-secondary" />
              </div>

              {/* Form */}
              <div className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">{t('fullName')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ahmed Khan"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">{t('email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aapka@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">{t('password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {mode === 'login' && (
                  <div className="text-right -mt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthStep('forgot'); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-primary-500 hover:text-primary-400 font-semibold"
                    >
                      {lang === 'en' ? 'Forgot Password?' : 'پاس ورڈ بھول گئے؟'}
                    </button>
                  </div>
                )}
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">{t('confirmPassword')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Dobara password likhein"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                )}
                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                    {error}
                  </div>
                )}
                {/* Cloudflare Turnstile CAPTCHA */}
                <div className="overflow-hidden">
                  <TurnstileWidget
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken('')}
                    onError={() => setTurnstileToken('')}
                    resetKey={captchaReset}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? (lang === 'en' ? 'Login' : 'لاگ ان کریں') : (lang === 'en' ? 'Create Account' : 'اکاؤنٹ بنائیں')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Toggle */}
              <p className="text-center text-sm text-text-muted mt-6">
                {mode === 'login' ? (lang === 'en' ? "Don't have an account?" : 'اکاؤنٹ نہیں ہے؟') : (lang === 'en' ? 'Already have an account?' : 'پہلے سے اکاؤنٹ ہے؟')}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); resetCaptcha(); }}
                  className="ml-2 text-primary-500 hover:text-primary-400 font-semibold"
                >
                  {mode === 'login' ? (lang === 'en' ? 'Register' : 'رجسٹر کریں') : (lang === 'en' ? 'Login' : 'لاگ ان کریں')}
                </button>
              </p>
              </>)}

              {/* ─── OTP Verification Step ─────────────────────────────────────────── */}
              {authStep === 'otp' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">{lang === 'en' ? '6-Digit Code' : '6 ہندسوں کا کوڈ'}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                      placeholder="000000"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary text-center text-2xl tracking-[0.5em] font-bold placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                  {otpPurpose === 'reset' && (
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">{lang === 'en' ? 'New Password' : 'نیا پاس ورڈ'}</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      />
                    </div>
                  )}
                  {error && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length < 6}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {otpPurpose === 'register' ? (lang === 'en' ? 'Verify & Continue' : 'تصدیق کریں اور جاری رکھیں') : (lang === 'en' ? 'Reset Password' : 'پاس ورڈ ری سیٹ کریں')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      className="text-primary-500 hover:text-primary-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `${lang === 'en' ? 'Resend' : 'دوبارہ بھیجیں'} (${resendCooldown}s)` : (lang === 'en' ? 'Resend Code' : 'کوڈ دوبارہ بھیجیں')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthStep('form'); setDevCode(''); setError(''); setSuccessMsg(''); setTurnstileToken(''); }}
                      className="text-text-muted hover:text-text-secondary font-semibold flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      {lang === 'en' ? 'Back to Login' : 'واپس لاگ ان'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Forgot Password Step ─────────────────────────────────────────── */}
              {authStep === 'forgot' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">{t('email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                      placeholder="aapka@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-surface-primary border border-border-secondary text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {lang === 'en' ? 'Send Reset Code' : 'ری سیٹ کوڈ بھیجیں'}
                        <KeyRound className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthStep('form'); setError(''); setSuccessMsg(''); setTurnstileToken(''); }}
                    className="w-full text-xs text-text-muted hover:text-text-secondary font-semibold flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    {lang === 'en' ? 'Back to Login' : 'واپس لاگ ان'}
                  </button>
                </div>
              )}

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border-secondary">
                <Lock className="w-3 h-3 text-text-muted" />
                <span className="text-[10px] text-text-muted">{t('encrypted')}</span>
              </div>

              {/* Admin Panel Access */}
              <button
                onClick={() => router.push('/admin')}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-secondary bg-surface-primary hover:bg-surface-tertiary transition-all text-text-secondary font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-primary-500" />
                <span className="text-xs">{lang === 'en' ? 'Admin Panel' : 'ایڈمن پینل'}</span>
              </button>

              {/* Demo for Guide */}
              <button
                onClick={handleDemoLogin}
                disabled={demoLoading || loading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all text-amber-600 dark:text-amber-400 font-semibold disabled:opacity-50"
              >
                {demoLoading ? (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span className="text-xs">{demoLoading ? (lang === 'en' ? 'Loading...' : 'لوڈ ہو رہا ہے...') : (lang === 'en' ? 'Demo for Guide' : 'ڈیمو فار گائیڈ')}</span>
              </button>

              {/* Contact & Support */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setSupportTab('contact')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border-secondary bg-surface-primary hover:bg-surface-tertiary transition-all text-text-secondary font-semibold text-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-primary-500" />
                  {t('contactUs')}
                </button>
                <button
                  onClick={() => setSupportTab('support')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border-secondary bg-surface-primary hover:bg-surface-tertiary transition-all text-text-secondary font-semibold text-xs"
                >
                  <LifeBuoy className="w-3.5 h-3.5 text-amber-500" />
                  {t('support')}
                </button>
              </div>
            </div>

            {/* Team / Contact Section */}
            <div className="mt-12">
              <div className="rounded-3xl bg-surface-secondary/40 backdrop-blur-xl border border-border-secondary/30 p-8 shadow-xl relative overflow-hidden">
                {/* Decorative glow orbs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

                {/* Section Header */}
                <div className="text-center mb-8 relative z-10">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/50" />
                    <span className="text-xs font-bold text-gold-500 tracking-widest uppercase">
                      {lang === 'en' ? 'Our Team' : 'ہماری ٹیم'}
                    </span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/50" />
                  </div>
                  <h3 className="text-xl font-extrabold text-text-primary">
                    {lang === 'en' ? 'Meet the Minds Behind WealthWise AI' : 'WealthWise AI کی ٹیم سے ملیں'}
                  </h3>
                  <p className="text-xs text-text-muted mt-2 max-w-sm mx-auto">
                    {lang === 'en'
                      ? 'A passionate team building financial solutions for Pakistan'
                      : 'پاکستان کے لیے مالی حل بنانے والی ایک پرجوش ٹیم'}
                  </p>
                </div>

                {/* Team Members Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 relative z-10">
                  {team.map((member, i) => (
                    <a
                      key={i}
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col items-center"
                    >
                      {/* Glow backdrop */}
                      <div className={`absolute top-4 w-20 h-20 rounded-full ${member.glow.replace('shadow-', 'bg-').replace('/40', '/0')} blur-2xl group-hover:${member.glow.replace('shadow-', 'bg-')} transition-all duration-500 opacity-0 group-hover:opacity-100`} />

                      {/* Photo avatar with animated ring */}
                      <div className={`relative w-20 h-20 rounded-full overflow-hidden ring-[3px] ${member.ring} shadow-lg ${member.glow} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                        <Image
                          src={member.photo}
                          alt={member.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        {/* Hover shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Animated glow ring on hover */}
                      <div className={`absolute top-0 w-24 h-24 rounded-full border-2 border-transparent group-hover:border-current opacity-0 group-hover:opacity-20 transition-all duration-500 scale-75 group-hover:scale-100 ${member.ring.replace('ring-', 'text-')}`} />

                      {/* Name */}
                      <span className="mt-3 text-sm font-bold text-text-primary text-center leading-tight group-hover:text-primary-500 transition-colors">
                        {member.name}
                      </span>

                      {/* Role */}
                      <span className="text-[10px] text-text-muted mt-0.5 font-medium">
                        {member.role}
                      </span>

                      {/* LinkedIn button */}
                      <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A66C2]/10 group-hover:bg-[#0A66C2]/20 transition-all group-hover:shadow-sm">
                        <LinkedInIcon className="w-3 h-3 text-[#0A66C2]" />
                        <span className="text-[9px] font-bold text-[#0A66C2]">
                          {lang === 'en' ? 'LinkedIn' : 'لنکڈ ان'}
                        </span>
                        <ExternalLink className="w-2 h-2 text-[#0A66C2] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>

                {/* Contact footer */}
                <div className="flex items-center justify-center gap-3 mt-8 pt-5 border-t border-border-secondary/30 relative z-10">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted tracking-wider font-medium">
                      {lang === 'en' ? 'CONNECT WITH US' : 'ہم سے جڑیں'}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent" />
                </div>
              </div>
            </div>

            {/* Pakistani cultural motifs at bottom */}
            <div className="flex justify-center mt-8 gap-4">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-6 rounded-full" style={{
                    background: i === 0 ? '#16a34a' : i === 1 ? '#d4a017' : '#e63946',
                    opacity: 0.5,
                  }} />
                ))}
              </div>
              <p className="text-[10px] text-text-muted tracking-widest font-medium">
                {lang === 'en' ? 'MADE IN PAKISTAN 🇵🇰 WITH ❤️' : 'پاکستان میں بنایا گیا 🇵🇰 ❤️'}
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-6 rounded-full" style={{
                    background: i === 0 ? '#e63946' : i === 1 ? '#d4a017' : '#16a34a',
                    opacity: 0.5,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Support Modal */}
      <SupportModal
        open={supportTab !== null}
        initialTab={supportTab ?? 'contact'}
        onClose={() => setSupportTab(null)}
      />
    </div>
  );
}
