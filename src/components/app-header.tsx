'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title = 'Recetarium', showBack = false }: AppHeaderProps) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1"
            >
              ← Atrás
            </Button>
          )}
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 capitalize">{currentUser}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
