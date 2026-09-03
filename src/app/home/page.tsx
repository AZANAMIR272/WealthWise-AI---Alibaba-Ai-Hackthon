'use client';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useLang } from '@/lib/i18n';
import { useCurrentUser, saveCurrentUser } from '@/lib/use-current-user';
import { useEffect } from 'react';
import {
  LayoutDashboard, ArrowRightLeft, Target, Shield, Brain, TrendingUp,
  Sparkles, Waves, GitBranch, Navigation, RotateCcw, ChevronRight, LayoutGrid
} from 'lucide-react';
import type { ComponentType } from 'react';

interface FeatureItem {
  href: string;
  label: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  badge?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const currentUser = useCurrentUser();

  // Pick up user data from Google OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    if (uid) {
      saveCurrentUser({
        id: uid,
        name: params.get('uname') || '',
        email: params.get('uemail') || '',
        avatar: params.get('uavatar'),
      });
      // Clean URL — remove user params
      window.history.replaceState({}, '', '/home');
      // Reload to update currentUser state
      window.location.reload();
    }
  }, []);

  const categories: { title: string; subtitle?: string; items: FeatureItem[] }[] = [
    {
      title: lang === 'en' ? 'AI Modules' : 'AI ماڈیولز',
      subtitle: lang === 'en' ? 'Hero AI tools — test every decision before you make it' : 'ہیرو AI ٹولز — ہر فیصلہ پہلے ٹیسٹ کریں',
      items: [
        {
          href: '/ripple',
          label: 'Ripple Engine',
          desc: lang === 'en' ? 'See every downstream effect of one money decision' : 'ایک مالی فیصلے کے سارے اثرات دیکھیں',
          icon: Waves,
          gradient: 'from-amber-500 to-orange-500',
          badge: 'HERO',
        },
        {
          href: '/parallel',
          label: 'Parallel Futures',
          desc: lang === 'en' ? 'Compare 3 futures — buy, wait, or skip' : '3 مستقبل کا موازنہ کریں — خریدیں، انتظار، یا نہیں',
          icon: GitBranch,
          gradient: 'from-violet-500 to-purple-500',
        },
        {
          href: '/gps',
          label: 'Financial GPS',
          desc: lang === 'en' ? 'Live route from where you stand to your goal' : 'موجودہ مقام سے گول تک زندہ راستہ',
          icon: Navigation,
          gradient: 'from-cyan-500 to-blue-500',
        },
        {
          href: '/time-machine',
          label: 'Time Machine',
          desc: lang === 'en' ? 'Rewind a past decision, see the alternate reality' : 'ماضی کا فیصلہ بدلیں، متبادل حقیقت دیکھیں',
          icon: RotateCcw,
          gradient: 'from-rose-500 to-pink-500',
        },
      ],
    },
    {
      title: lang === 'en' ? 'Planning & Intelligence' : 'پلاننگ اور ذہانت',
      items: [
        {
          href: '/simulator',
          label: t('whatIfSimNav'),
          desc: lang === 'en' ? '"What if I buy a Rs. 2 lakh car?" — AI will tell you' : '"اگر میں 2 لاکھ کی گاڑی لوں؟" — AI بتائے گا',
          icon: Sparkles,
          gradient: 'from-emerald-500 to-emerald-700',
        },
        {
          href: '/digital-twin',
          label: t('digitalTwinNav'),
          desc: lang === 'en' ? 'A virtual replica of your money — test every decision first' : 'آپ کے پیسوں کا ورچوئل نقل — ہر فیصلہ پہلے ٹیسٹ کریں',
          icon: Brain,
          gradient: 'from-blue-500 to-blue-700',
        },
        {
          href: '/goals',
          label: t('goalPlanner'),
          desc: lang === 'en' ? 'Set goals + AI Goal Marketplace strategies' : 'گول بنائیں + AI گول مارکیٹ پلیس اسٹریٹجیز',
          icon: Target,
          gradient: 'from-amber-500 to-amber-700',
        },
      ],
    },
    {
      title: lang === 'en' ? 'Money Management' : 'پیسوں کا انتظام',
      items: [
        {
          href: '/dashboard',
          label: t('commandCenter'),
          desc: t('dashSubtitle'),
          icon: LayoutDashboard,
          gradient: 'from-primary-500 to-primary-700',
        },
        {
          href: '/transactions',
          label: t('transactionsNav'),
          desc: lang === 'en' ? 'Every transaction, categorized and searchable' : 'ہر ٹرانزیکشن، درجہ بند اور تلاش کے قابل',
          icon: ArrowRightLeft,
          gradient: 'from-teal-500 to-teal-700',
        },
      ],
    },
    {
      title: lang === 'en' ? 'Safety & Guidance' : 'حفاظت اور رہنمائی',
      items: [
        {
          href: '/risk',
          label: t('riskRadar'),
          desc: lang === 'en' ? 'Salary delay, job loss, emergency — plan every scenario' : 'تنخواہ میں دیری، نوکری ختم، ایمرجنسی — ہر منظرنامہ',
          icon: Shield,
          gradient: 'from-red-500 to-red-700',
        },
        {
          href: '/coach',
          label: t('aiCoachNav'),
          desc: lang === 'en' ? 'Real AI that gives advice on your actual data — English or Urdu' : 'آپ کے اصل ڈیٹا پر حقیقی AI مشورہ — اردو یا انگریزی',
          icon: TrendingUp,
          gradient: 'from-rose-500 to-rose-700',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={currentUser?.name || 'User'} />

      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                <LayoutGrid className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold text-foreground">
                  {lang === 'en' ? 'Feature Hub' : 'فیچر ہب'}
                </h1>
                <p className="text-foreground/90 text-xs lg:text-sm mt-0.5">
                  {lang === 'en'
                    ? `Every WealthWise AI tool in one place, ${currentUser?.name?.split(' ')[0] || 'friend'} — tap any card to open`
                    : 'ویلتھ وائز AI کا ہر ٹول ایک جگہ — کھولنے کے لیے کارڈ دبائیں'}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Categories */}
          {categories.map((cat) => (
            <section key={cat.title} className="mb-8 lg:mb-10">
              <div className="mb-3 lg:mb-4">
                <h2 className="text-base lg:text-lg font-bold text-foreground">{cat.title}</h2>
                {cat.subtitle && <p className="text-[11px] lg:text-xs text-foreground/70 mt-0.5">{cat.subtitle}</p>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="group text-left rounded-xl lg:rounded-2xl bg-surface border border-surface-border p-3 sm:p-4 lg:p-5 hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/10 transition-all"
                    >
                      <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg mb-2.5 lg:mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-foreground text-xs lg:text-sm flex items-center gap-1.5 flex-wrap">
                        {item.label}
                        {item.badge && (
                          <span className="text-[7px] lg:text-[8px] font-black text-amber-600 dark:text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] lg:text-xs text-foreground/70 mt-1 leading-snug lg:leading-relaxed line-clamp-2">{item.desc}</p>
                      <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lang === 'en' ? 'Open' : 'کھولیں'}
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
