'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/recipes', label: 'Recetas', icon: '📖' },
  { href: '/despensa', label: 'Despensa', icon: Package },
  { href: '/planning', label: 'Planificar', icon: Calendar },
  { href: '/shopping', label: 'Compras', icon: '🛒' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <span className="text-xl">
                {typeof item.icon === 'string' ? item.icon : <item.icon className="h-5 w-5" />}
              </span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
