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
import { usersAPI, tokenManager } from '@/lib/api';
import { UserHelper } from '@/classes';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, logout, registeredCards, setUser } = useUserStore();
  const { deals, clearDeals } = useDealStore();

  const [mounted, setMounted] = useState(false);
  const [gradeInfo, setGradeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) return;
      try {
        const [meData, gradeData] = await Promise.all([
          usersAPI.getMe(),
          usersAPI.getGrade(),
        ]);
        if (meData) {
          setUser(meData);
        }
        setGradeInfo(gradeData);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    if (mounted && isLoggedIn) {
      fetchData();
    }
  }, [mounted, isLoggedIn, setUser]);

  if (!mounted || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const userDeals = deals.filter((d) => d.uid === currentUser.uid);
  const completedDeals = userDeals.filter((d) => d.status === 'completed');
  const totalAmount = gradeInfo?.stats?.totalPaymentAmount || completedDeals.reduce((sum, d) => sum + d.amount, 0);

  const gradeConfig = currentUser ? UserHelper.getGradeConfig(currentUser.grade) : { name: '베이직', feeRate: 4.0, monthlyLimit: 10000000 };
  const remainingLimit = gradeInfo?.limit?.remaining ?? UserHelper.getRemainingLimit(currentUser);
  const usageRate = gradeInfo?.limit?.usagePercent ?? UserHelper.getUsageRate(currentUser);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      clearDeals();
      tokenManager.clearTokens();
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
      <Header title="마이페이지" />

      {/* 프로필 카드 */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
          </div>
        </div>

        {/* 등급 정보 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  gradeConfig.name === "베이직" ? "bg-gray-100 text-gray-700" : gradeConfig.name === "플래티넘" ? "bg-purple-100 text-purple-700" : gradeConfig.name === "B2B" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                )}
              >
                {gradeConfig.name}
              </span>
              <span className="text-sm text-gray-500">
                수수료 {gradeInfo?.fee?.rateText || `${currentUser.feeRate}%`}
              </span>
            </div>
            <Link href="/mypage/grade" className="text-sm text-primary-400">
              등급 안내
            </Link>
          </div>

          {/* 한도 사용률 */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">월 한도 사용</span>
              <span className="text-gray-900">
                {(gradeInfo?.limit?.used || currentUser.usedAmount || 0).toLocaleString()}원 /{' '}
                {(gradeInfo?.limit?.monthly || currentUser.monthlyLimit).toLocaleString()}원
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all"
                style={{ width: `${Math.min(usageRate, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            이번 달 잔여 한도: {remainingLimit.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 거래 통계 */}
      <div className="bg-white px-5 py-4 mb-2">
        <div className="flex justify-between">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-gray-900">
              {gradeInfo?.stats?.totalDealCount || completedDeals.length}
            </p>
            <p className="text-sm text-gray-500">총 거래</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-gray-900">
              {totalAmount >= 10000
                ? `${Math.floor(totalAmount / 10000).toLocaleString()}만`
                : totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">총 금액</p>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      {menuItems.map((group) => (
        <div key={group.group} className="bg-white mb-2">
          <p className="px-5 pt-4 pb-2 text-xs font-medium text-gray-400">
            {group.group}
          </p>
          {group.items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-sm text-primary-400">{item.badge}</span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </Link>
          ))}
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
