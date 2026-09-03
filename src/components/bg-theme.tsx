'use client';
import { useState, useEffect } from 'react';
import { Palette, X } from 'lucide-react';
import Image from 'next/image';

const backgrounds = [
  { id: 'none', name: 'Default', nameUr: 'ڈیفالٹ', src: '' },
  { id: 'default-mandala', name: 'Mandala', nameUr: 'منڈالا', src: '/backgrounds/default-mandala.avif' },
  { id: 'mandala', name: 'Mandala 2', nameUr: 'منڈالا 2', src: '/backgrounds/mandala.avif' },
  { id: 'culture', name: 'Cultural', nameUr: 'کلچرل', src: '/backgrounds/mandala-culture.avif' },
  { id: 'pattern1', name: 'Floral', nameUr: 'فلورل', src: '/backgrounds/pattern-1.jpg' },
  { id: 'pattern2', name: 'Textile', nameUr: 'ٹیکسٹائل', src: '/backgrounds/pattern-2.jpg' },
];

export function useBgTheme() {
  const [bgTheme, setBgTheme] = useState('default-mandala');

  useEffect(() => {
    const saved = localStorage.getItem('ww_bg_theme');
    if (saved && backgrounds.find(b => b.id === saved)) {
      setBgTheme(saved);
    } else if (!localStorage.getItem('ww_bg_theme')) {
      // First visit: set default-mandala as default
      localStorage.setItem('ww_bg_theme', 'default-mandala');
    }
  }, []);

  const setBg = (id: string) => {
    setBgTheme(id);
    localStorage.setItem('ww_bg_theme', id);
  };

  const current = backgrounds.find(b => b.id === bgTheme);
  return { bgTheme, setBg, current, backgrounds };
}

export function BackgroundLayer() {
  const { current } = useBgTheme();
  if (!current?.src) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700">
      <Image src={current.src} alt="" fill className="object-cover opacity-[0.25]" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/50" />
    </div>
  );
}

export function BgPickerButton({ lang = 'en', className = '', variant = 'dark' }: { lang?: string; className?: string; variant?: 'dark' | 'light' }) {
  const { bgTheme, setBg, backgrounds } = useBgTheme();
  const [open, setOpen] = useState(false);

  const btnClass = variant === 'light'
    ? 'flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-secondary/80 backdrop-blur-md border border-border-secondary/50 shadow-lg hover:bg-surface-tertiary text-text-primary text-xs font-bold transition-all cursor-pointer group'
    : 'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors bg-white/5 hover:bg-white/10 text-gray-300';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={btnClass}
        title={lang === 'en' ? 'Change Background' : 'بیک گراؤنڈ بدلیں'}
      >
        <Palette className={`w-3.5 h-3.5 text-gold-500 ${variant === 'light' ? 'group-hover:rotate-45' : ''} transition-transform`} />
        <span>{lang === 'en' ? 'Background' : 'بیک گراؤنڈ'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute ${variant === 'light' ? 'top-full mt-2 right-0' : 'bottom-full mb-2 left-0'} w-56 rounded-2xl ${variant === 'light' ? 'bg-surface-secondary/95 backdrop-blur-xl border border-border-secondary/60' : 'bg-primary-900/95 backdrop-blur-xl border border-primary-800/40'} shadow-2xl p-3 z-50`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold tracking-wider uppercase ${variant === 'light' ? 'text-text-primary' : 'text-primary-200'}`}>
                {lang === 'en' ? 'Choose Background' : 'بیک گراؤنڈ منتخب کریں'}
              </span>
              <button onClick={() => setOpen(false)} className={`p-0.5 rounded ${variant === 'light' ? 'hover:bg-surface-tertiary' : 'hover:bg-white/10'}`}>
                <X className={`w-3 h-3 ${variant === 'light' ? 'text-text-muted' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {backgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => { setBg(bg.id); setOpen(false); }}
                  className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                    bgTheme === bg.id
                      ? 'border-emerald-400 scale-110 shadow-lg shadow-emerald-500/20'
                      : variant === 'light'
                        ? 'border-border-secondary/40 hover:border-border-secondary'
                        : 'border-primary-700/40 hover:border-primary-500/60'
                  }`}
                  title={lang === 'en' ? bg.name : bg.nameUr}
                >
                  {bg.src ? (
                    <Image src={bg.src} alt={bg.name} width={36} height={36} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-800 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
