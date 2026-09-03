'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, any>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  /** Increment this value to force-reset the widget (e.g. after a failed submit consumed the token) */
  resetKey?: number;
}

export function TurnstileWidget({ onVerify, onExpire, onError, theme = 'auto', resetKey = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);

  // Store callbacks in refs so they don't trigger re-renders
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  // Responsive sizing: compact on small screens, normal on larger
  const [widgetSize, setWidgetSize] = useState<'normal' | 'compact'>('normal');

  useEffect(() => {
    const check = () => setWidgetSize(window.innerWidth < 400 ? 'compact' : 'normal');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const doRender = useCallback(() => {
    const el = containerRef.current;
    if (!el || !window.turnstile) return;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || renderedRef.current) return;

    // Clear container content (in case of stale widget)
    while (el.firstChild) el.removeChild(el.firstChild);

    try {
      const id = window.turnstile.render(el, {
        sitekey: siteKey,
        theme,
        size: widgetSize,
        callback: (token: string) => {
          onVerifyRef.current?.(token);
        },
        'expired-callback': () => {
          onExpireRef.current?.();
          // Auto-reset so the widget visually returns to unsolved state
          try { if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current); } catch {}
        },
        'error-callback': () => {
          onErrorRef.current?.();
        },
      });
      widgetIdRef.current = id;
      renderedRef.current = true;
    } catch (e) {
      console.error('Turnstile render error:', e);
    }
  }, [theme, widgetSize]);

  // Render once on mount, cleanup on unmount
  useEffect(() => {
    renderedRef.current = false;

    const tryRender = () => {
      if (window.turnstile) {
        doRender();
      } else {
        // Script not loaded yet — poll
        const timer = setInterval(() => {
          if (window.turnstile) {
            clearInterval(timer);
            doRender();
          }
        }, 500);
        setTimeout(() => clearInterval(timer), 10000); // stop after 10s
      }
    };

    tryRender();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
      renderedRef.current = false;
    };
  }, [doRender]);

  // Reset the widget when parent requests it (token consumed by failed submit, mode switch, etc.)
  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch {}
    }
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => {
          if (!renderedRef.current) doRender();
        }}
      />
      <div ref={containerRef} className="flex justify-center my-3 min-h-[65px] w-full overflow-hidden" />
    </>
  );
}
