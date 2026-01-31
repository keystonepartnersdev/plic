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
        // 401 에러 시 로그아웃 처리
        if (error.message?.includes('401') || error.message?.includes('인증')) {
          tokenManager.clearTokens();
          logout();
          router.replace('/auth/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    if (mounted && isLoggedIn) {
      fetchData();
    }
  }, [mounted, isLoggedIn, setUser, logout, router]);

  if (!mounted || !isLoggedIn || !currentUser || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
      </div>
    );
  }

  const userDeals = deals.filter((d) => d.uid === currentUser.uid);
  const completedDeals = userDeals.filter((d) => d.status && d.status === 'completed');
  const totalAmount = gradeInfo?.stats?.totalPaymentAmount || completedDeals.reduce((sum, d) => sum + d.amount, 0);

  const gradeConfig = currentUser?.grade ? UserHelper.getGradeConfig(currentUser.grade) : { name: '베이직', feeRate: 4.0, monthlyLimit: 10000000 };
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
        // 빌링키 API 미지원으로 결제카드 관리 임시 숨김
        // { href: '/mypage/cards', icon: CreditCard, label: '결제카드 관리', badge: registeredCards.length > 0 ? `${registeredCards.length}개` : undefined },
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

      {/* 프로필 카드 - PLIC 디자인 시스템 적용 */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
            <User className="w-8 h-8 text-[#2563EB]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">{currentUser.name}</h2>
            <p className="text-sm text-gray-500 font-medium">{currentUser.email}</p>
          </div>
        </div>

        {/* 등급 정보 - PLIC 디자인 시스템 적용 */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold',
                  gradeConfig.name === "베이직" ? "bg-gray-100 text-gray-700" : gradeConfig.name === "플래티넘" ? "bg-purple-100 text-purple-700" : gradeConfig.name === "B2B" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                )}
              >
                {gradeConfig.name}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                수수료 {gradeInfo?.fee?.rateText || `${currentUser.feeRate}%`}
              </span>
            </div>
            <Link href="/mypage/grade" className="text-sm text-[#2563EB] font-semibold hover:text-[#1d4ed8] transition-colors duration-300">
              등급 안내
            </Link>
          </div>

          {/* 한도 사용률 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 font-medium">월 한도 사용</span>
              <span className="text-gray-900 font-semibold">
                {(gradeInfo?.limit?.used || currentUser.usedAmount || 0).toLocaleString()}원 /{' '}
                {(gradeInfo?.limit?.monthly || currentUser.monthlyLimit).toLocaleString()}원
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usageRate, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            이번 달 잔여 한도: <span className="text-[#2563EB] font-semibold">{remainingLimit.toLocaleString()}원</span>
          </p>
        </div>
      </div>

      {/* 거래 통계 - PLIC 디자인 시스템 적용 */}
      <div className="bg-white px-5 py-5 mb-2">
        <div className="flex justify-between">
          <div className="text-center flex-1">
            <p className="text-2xl font-black text-gradient">
              {gradeInfo?.stats?.totalDealCount || completedDeals.length}
            </p>
            <p className="text-sm text-gray-500 font-medium">총 거래</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-2xl font-black text-gradient">
              {totalAmount >= 10000
                ? `${Math.floor(totalAmount / 10000).toLocaleString()}만`
                : totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 font-medium">총 금액</p>
          </div>
        </div>
      </div>

      {/* 메뉴 - PLIC 디자인 시스템 적용 */}
      {menuItems.map((group) => (
        <div key={group.group} className="bg-white mb-2">
          <p className="px-5 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {group.group}
          </p>
          {group.items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex items-center justify-between px-5 py-4 hover:bg-blue-50/50 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB] transition-colors duration-300" strokeWidth={2} />
                <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-300">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all duration-300" strokeWidth={2} />
            </Link>
          ))}
        </div>
      ))}

      {/* 로그아웃 - PLIC 디자인 시스템 적용 */}
      <div className="bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 w-full hover:bg-red-50 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors duration-300" strokeWidth={2} />
          <span className="text-gray-500 group-hover:text-red-500 font-medium transition-colors duration-300">로그아웃</span>
        </button>
      </div>

    </div>
  );
}
