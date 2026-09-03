import Image from 'next/image';

export function LogoIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' }) {
  const sizes = { sm: 48, md: 56, lg: 72, xl: 96, xxl: 120 };
  const s = sizes[size];
  return (
    <div className={`${className} relative flex-shrink-0 rounded-xl overflow-hidden`} style={{ width: s, height: s }}>
      <Image
        src="/logo.png"
        alt="WealthWise AI"
        width={s}
        height={s}
        className="object-cover"
        priority
      />
    </div>
  );
}

export function LogoFull({ className = '', light = false, size = 'md' }: { className?: string; light?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const imgSizes = { sm: 52, md: 68, lg: 84 };
  const s = imgSizes[size];
  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
  const subSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: s, height: s }}>
        <Image
          src="/logo.png"
          alt="WealthWise AI"
          width={s}
          height={s}
          className="object-cover"
          priority
        />
      </div>
      <div>
        <h1 className={`${textSizes[size]} font-extrabold tracking-tight leading-tight ${light ? 'text-white' : 'bg-gradient-to-r from-[#0D3B66] via-[#1A938C] to-[#0D3B66] dark:from-emerald-400 dark:via-amber-300 dark:to-emerald-400 bg-clip-text text-transparent'}`}>
          WealthWise AI
        </h1>
        <p className={`${subSizes[size]} tracking-[0.15em] font-bold mt-0.5 ${light ? 'text-emerald-200/60' : 'text-text-muted'}`}>
          EMPOWERING FINANCIAL FUTURES
        </p>
      </div>
    </div>
  );
}

export function LogoBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 border-2 border-gold-500/30">
        <Image
          src="/logo.png"
          alt="WealthWise AI"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
