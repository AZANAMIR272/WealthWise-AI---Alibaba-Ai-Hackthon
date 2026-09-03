'use client';
import { useEffect, useState } from 'react';
import { LogoIcon } from './logo';

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 800);
    const hideTimer = setTimeout(() => setVisible(false), 1200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background, #0a0f0a)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Animated background glow orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            animation: 'ls-glow 2s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)',
            animation: 'ls-glow 2s ease-in-out infinite 0.5s',
          }}
        />
      </div>

      {/* Pulsing Logo */}
      <div style={{ position: 'relative', animation: 'ls-pulse 1.5s ease-in-out infinite' }}>
        {/* Glow ring behind logo */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)',
            animation: 'ls-ring 2s ease-in-out infinite',
          }}
        />
        <LogoIcon size="xl" />
      </div>

      {/* Brand name with shimmer */}
      <h1
        style={{
          marginTop: 24,
          fontSize: 24,
          fontWeight: 800,
          background: 'linear-gradient(90deg, #10b981 0%, #d4a017 50%, #10b981 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'ls-shimmer 2s linear infinite',
        }}
      >
        WealthWise AI
      </h1>

      {/* Loading bar */}
      <div
        style={{
          marginTop: 32,
          width: 180,
          height: 3,
          borderRadius: 999,
          background: 'var(--surface-tertiary, #1a2520)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #10b981, #d4a017, #10b981)',
            animation: 'ls-bar 1.8s ease-in-out infinite',
          }}
        />
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 10,
          color: 'var(--muted, #6b7b73)',
          letterSpacing: '0.15em',
          animation: 'ls-pulse 2s ease-in-out infinite',
        }}
      >
        LOADING...
      </p>

      <style>{`
        @keyframes ls-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes ls-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }
        @keyframes ls-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ls-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ls-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
