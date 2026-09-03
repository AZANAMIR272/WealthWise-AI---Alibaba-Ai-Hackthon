'use client';

import { useLang } from '@/lib/i18n';

export function LangSwitch() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-200 dark:bg-surface-800/60 hover:bg-surface-300 dark:hover:bg-surface-700/60 transition-all cursor-pointer border border-border-subtle dark:border-border-dark/50"
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-lg">{lang === 'en' ? '🇬🇧' : '🇵🇰'}</span>
        <span className="text-foreground">{lang === 'en' ? 'English' : 'اردو'}</span>
      </span>
      <span className="text-[10px] font-bold text-text-muted bg-surface-100 dark:bg-surface-900 px-2 py-0.5 rounded-full">
        {lang === 'en' ? 'EN' : 'UR'}
      </span>
    </button>
  );
}
