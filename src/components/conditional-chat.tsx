'use client';
import { usePathname } from 'next/navigation';
import { FloatingChat } from '@/components/floating-chat';

export function ConditionalChat() {
  const pathname = usePathname();
  // Don't show on landing page
  if (pathname === '/' || pathname === '/login' || pathname === '/register') return null;
  return <FloatingChat />;
}
