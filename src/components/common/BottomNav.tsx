'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, FileText, HelpCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/deals', icon: FileText, label: '거래내역' },
  { href: '/guide', icon: HelpCircle, label: '이용안내' },
  { href: '/mypage', icon: User, label: '내정보' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="
      flex-shrink-0
      bg-white/90 backdrop-blur-md border-t border-gray-100
      pb-safe
      z-50
    ">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-all duration-300',
                active ? 'text-[#2563EB]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon className={cn('w-6 h-6', active && 'stroke-[2.5]')} strokeWidth={2} />
              <span className={cn(
                'text-xs mt-1',
                active ? 'font-semibold' : 'font-medium'
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
