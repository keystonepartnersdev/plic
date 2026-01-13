'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  User,
  CreditCard,
  Building2,
  Bell,
  HelpCircle,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useDealStore } from '@/stores';
import { UserHelper } from '@/classes';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, logout, registeredCards } = useUserStore();
  const { deals, clearDeals } = useDealStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  if (!mounted || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const userDeals = deals.filter((d) => d.uid === currentUser.uid);
  const completedDeals = userDeals.filter((d) => d.status === 'completed');
  const totalAmount = completedDeals.reduce((sum, d) => sum + d.amount, 0);

  const gradeConfig = UserHelper.getGradeConfig(currentUser.grade);
  const remainingLimit = UserHelper.getRemainingLimit(currentUser);
  const usageRate = UserHelper.getUsageRate(currentUser);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      clearDeals();
      router.replace('/');
    }
  };

  const menuItems = [
    {
      group: '내 정보',
      items: [
        { href: '/mypage/edit', icon: User, label: '개인정보 수정' },
        { href: '/mypage/cards', icon: CreditCard, label: '결제카드 관리', badge: registeredCards.length > 0 ? `${registeredCards.length}개` : undefined },
        { href: '/mypage/accounts', icon: Building2, label: '거래 계좌내역' },
      ],
    },
    {
      group: '서비스',
      items: [
        { href: '/mypage/notices', icon: Bell, label: '공지사항' },
        { href: '/guide', icon: HelpCircle, label: '이용안내' },
        { href: '/guide', icon: FileText, label: '이용약관' },
      ],
    },
    {
      group: '설정',
      items: [
        { href: '/mypage/settings', icon: Settings, label: '알림설정' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="내 정보" />

      {/* 프로필 카드 */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
              {currentUser.status !== 'active' && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded',
                  currentUser.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                  currentUser.status === 'suspended' && 'bg-red-100 text-red-700',
                  currentUser.status === 'withdrawn' && 'bg-gray-100 text-gray-700'
                )}>
                  {currentUser.status === 'pending' && '대기'}
                  {currentUser.status === 'suspended' && '정지'}
                  {currentUser.status === 'withdrawn' && '탈퇴'}
                </span>
              )}
            </div>
            <p className="text-gray-500">{currentUser.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
          </div>
        </div>

        {/* 등급 정보 */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-primary-600">회원 등급</span>
              <p className="font-bold text-primary-700">{gradeConfig.name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-primary-600">수수료율</span>
              <p className="font-bold text-primary-700">{currentUser.feeRate}%</p>
            </div>
          </div>

          {/* 한도 프로그레스 */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-primary-600 mb-1">
              <span>이번 달 한도</span>
              <span>{usageRate}% 사용</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all"
                style={{ width: `${usageRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-primary-600">
                {currentUser.usedAmount.toLocaleString()}원 사용
              </span>
              <span className="text-primary-700 font-medium">
                {remainingLimit.toLocaleString()}원 남음
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 이용 현황 */}
      <div className="bg-white px-5 py-4 mb-2">
        <h3 className="font-semibold text-gray-900 mb-3">이용 현황</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{userDeals.length}</p>
            <p className="text-xs text-gray-500">전체 거래</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">{completedDeals.length}</p>
            <p className="text-xs text-gray-500">완료 거래</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {totalAmount >= 10000 ? `${Math.floor(totalAmount / 10000)}만` : totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">누적 송금액</p>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      {menuItems.map((group) => (
        <div key={group.group} className="bg-white mb-2">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">{group.group}</h3>
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="text-sm text-primary-400">{item.badge}</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>
            );
          })}
        </div>
      ))}

      {/* 로그아웃 */}
      <div className="bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 w-full hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500">로그아웃</span>
        </button>
      </div>

      {/* 버전 정보 */}
      <div className="text-center py-6 text-xs text-gray-400">
        PLIC v1.0.0 (Phase 1)
      </div>
    </div>
  );
}
