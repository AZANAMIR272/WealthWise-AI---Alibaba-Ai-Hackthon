'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogoIcon } from './logo';

export function PageTransition() {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [loading, setLoading] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (pathname !== prevPath) {
      setLoading(true);
      setFading(false);
      const fadeTimer = setTimeout(() => setFading(true), 200);
      const hideTimer = setTimeout(() => { setLoading(false); setFading(false); }, 350);
      setPrevPath(pathname);
      return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
    }
  }, [pathname, prevPath]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background, #0a0f0a)',
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          animation: 'pt-glow 1.5s ease-in-out infinite',
        }}
      />

      {/* Logo with pulse */}
      <div style={{ position: 'relative', animation: 'pt-pulse 0.8s ease-in-out infinite' }}>
        <div
          style={{
            position: 'absolute',
            inset: -16,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
            animation: 'pt-ring 1.2s ease-in-out infinite',
          }}
        />
        <LogoIcon size="lg" />
      </div>

      <style>{`
        @keyframes pt-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes pt-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }
        @keyframes pt-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
