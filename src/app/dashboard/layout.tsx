import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Command Center - WealthWise AI',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
