'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Tag,
  Image,
  Bell,
  HelpCircle,
  Settings,
  UserCog,
  LogOut,
  BarChart3,
  Bug,
} from 'lucide-react';
import { useAdminStore } from '@/stores';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드', permission: null },
  { href: '/admin/users', icon: Users, label: '회원정보', permission: 'user.view' },
  { href: '/admin/deals', icon: FileText, label: '거래정보', permission: 'deal.view' },
  { href: '/admin/codes', icon: Tag, label: '코드관리', permission: 'code.view' },
  { href: '/admin/contents/banners', icon: Image, label: '배너관리', permission: 'content.banner.manage' },
  { href: '/admin/contents/notices', icon: Bell, label: '공지사항', permission: 'content.notice.manage' },
  { href: '/admin/contents/faqs', icon: HelpCircle, label: 'FAQ관리', permission: 'content.faq.manage' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', permission: 'analytics.view' },
  { href: '/admin/api-logs', icon: Bug, label: 'API Logs', permission: 'analytics.view' },
  { href: '/admin/admins', icon: UserCog, label: '어드민관리', permission: 'admin.view' },
  { href: '/admin/settings', icon: Settings, label: '설정', permission: 'settings.view' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentAdmin, logout, hasPermission } = useAdminStore();
  const [mounted, setMounted] = useState(false);

  // 토큰 확인 함수
  const checkToken = () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('plic_admin_token');
    }
    return false;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 마운트 후 토큰 체크
    if (mounted && pathname !== '/admin/login') {
      const hasToken = checkToken();
      if (!hasToken) {
        router.replace('/admin/login');
      }
    }
  }, [mounted, pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('plic_admin_token');
    logout();
    router.replace('/admin/login');
  };

  // 로그인 페이지일 경우 레이아웃 없이 렌더링
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 마운트 전이면 로딩
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
      </div>
    );
  }

  // 토큰 없으면 로딩 (리다이렉트 대기)
  if (!checkToken()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 - PLIC 디자인 시스템 적용 */}
      <aside className="w-64 bg-white border-r border-gray-100 fixed h-full shadow-sm">
        {/* 로고 */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <h1 className="text-xl font-black text-gradient">PLIC Admin</h1>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <p className="font-bold text-gray-900">{currentAdmin?.name || '관리자'}</p>
          <p className="text-sm text-gray-500 font-medium">{currentAdmin?.email || ''}</p>
        </div>

        {/* 메뉴 */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (item.permission && currentAdmin && !hasPermission(item.permission)) {
                return null;
              }

              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold shadow-md'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-[#2563EB]'
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 로그아웃 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-300 font-medium"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
