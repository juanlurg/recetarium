'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
}

export function AppShell({
  children,
  title,
  showBack = false,
  hideNav = false
}: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader title={title} showBack={showBack} />
        <main className={`pt-14 ${hideNav ? 'pb-4' : 'pb-20'} px-4`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </ProtectedRoute>
  );
}
