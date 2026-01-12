'use client';

import { ReactNode, useEffect } from 'react';
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
} from 'lucide-react';
import { useAdminStore } from '@/stores';
import { cn } from '@/lib/utils';
import { AdminHelper } from '@/classes';

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
  { href: '/admin/admins', icon: UserCog, label: '어드민관리', permission: 'admin.view' },
  { href: '/admin/settings', icon: Settings, label: '설정', permission: 'settings.view' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentAdmin, isLoggedIn, logout, hasPermission, login, adminList } = useAdminStore();

  useEffect(() => {
    // 개발 환경: 자동 로그인 (로그인 우회)
    if (!isLoggedIn) {
      // 마스터 관리자 계정으로 자동 로그인
      const admin = adminList.find((a) => a.email === 'admin');
      if (admin) {
        const roleConfig = AdminHelper.getRoleConfig(admin.role);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8시간

        login({
          adminId: admin.adminId,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: roleConfig.permissions,
          loginAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });
      }
    }
  }, [isLoggedIn, login, adminList]);

  const handleLogout = () => {
    logout();
    // 로그아웃 후 자동으로 다시 로그인됨
  };

  // 로그인 페이지일 경우 레이아웃 없이 렌더링
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 로그인되지 않은 경우 로딩
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        {/* 로고 */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-400">PLIC Admin</h1>
        </div>

        {/* 사용자 정보 */}
        <div className="p-4 border-b border-gray-200">
          <p className="font-semibold text-gray-900">{currentAdmin?.name}</p>
          <p className="text-sm text-gray-500">{currentAdmin?.email}</p>
        </div>

        {/* 메뉴 */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              // 권한 체크
              if (item.permission && !hasPermission(item.permission)) {
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
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 로그아웃 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
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
