'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
  AlertCircle,
  UserX,
} from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useDealStore } from '@/stores';
import { usersAPI } from '@/lib/api';
import { secureAuth } from '@/lib/auth';
// UserHelper 제거 - 단일 등급 시스템으로 직접 계산
import { cn, getErrorMessage } from '@/lib/utils';

export default function MyPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, logout, registeredCards, setUser, _hasHydrated } = useUserStore();
  const { deals, clearDeals } = useDealStore();

  const [mounted, setMounted] = useState(false);
  const [gradeInfo, setGradeInfo] = useState<{
    grade: { code: string; name: string; isManual: boolean };
    fee: { rate: number; rateText: string };
    limit: { monthly: number; used: number; remaining: number; usagePercent: number };
    stats: { totalPaymentAmount: number; totalDealCount: number; lastMonthPaymentAmount: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // hydration 완료 후에만 로그인 상태 체크
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, _hasHydrated, isLoggedIn, router]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isLoggedIn) return;
      try {
        const [meData, gradeData] = await Promise.all([
          usersAPI.getMe(),
          usersAPI.getGrade(),
        ]);
        if (isMounted) {
          if (meData) {
            setUser(meData);
          }
          setGradeInfo(gradeData);
        }
      } catch (error: unknown) {
        console.error('사용자 정보 로드 실패:', error);
        // 401 에러 시 로그아웃 처리
        if (getErrorMessage(error)?.includes('401') || getErrorMessage(error)?.includes('인증')) {
          await secureAuth.logout().catch(() => {});
          if (isMounted) {
            logout();
            router.replace('/auth/login');
          }
          return;
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (mounted && isLoggedIn) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [mounted, isLoggedIn, setUser, logout, router]);

  // useMemo로 필터링 및 계산 최적화 - hooks는 반드시 조건부 return 전에 호출
  const { userDeals, completedDeals, totalAmount } = useMemo(() => {
    if (!currentUser) return { userDeals: [], completedDeals: [], totalAmount: 0 };
    const userDeals = deals.filter((d) => d.uid === currentUser.uid);
    const completedDeals = userDeals.filter((d) => d.status && d.status === 'completed');
    const totalAmount = gradeInfo?.stats?.totalPaymentAmount || completedDeals.reduce((sum, d) => sum + d.amount, 0);
    return { userDeals, completedDeals, totalAmount };
  }, [deals, currentUser?.uid, gradeInfo?.stats?.totalPaymentAmount]);

  // DB값을 Single Source of Truth로 사용 (fallback: 4.5%, 2000만원)
  const monthlyLimit = currentUser?.monthlyLimit || 20000000;
  const feeRate = currentUser?.feeRate || 4.5;
  const usedAmount = gradeInfo?.limit?.used || currentUser?.usedAmount || 0;
  const remainingLimit = Math.max(monthlyLimit - usedAmount, 0);
  const usageRate = Math.round((usedAmount / monthlyLimit) * 100);

  // useCallback으로 핸들러 최적화
  const handleLogout = useCallback(async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await secureAuth.logout().catch(() => {});
      logout();
      clearDeals();
      router.replace('/');
    }
  }, [logout, clearDeals, router]);

  const handleWithdraw = useCallback(async () => {
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await usersAPI.withdraw();
      await useUserStore.getState().logoutWithAPI();
      router.replace('/auth/login');
    } catch (error: any) {
      setWithdrawError(error?.message || '회원 탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsWithdrawing(false);
    }
  }, [router]);

  // 조건부 early return은 모든 hooks 호출 후에
  if (!mounted || !_hasHydrated || !isLoggedIn || !currentUser || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
      </div>
    );
  }

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

        {/* 이용 조건 - 단일 등급 시스템 */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">
                수수료 {feeRate}%
              </span>
            </div>
          </div>

          {/* 한도 사용률 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 font-medium">월 한도 사용</span>
              <span className="text-gray-900 font-semibold">
                {usedAmount.toLocaleString()}원 /{' '}
                {monthlyLimit.toLocaleString()}원
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

      {/* 로그아웃 / 회원탈퇴 */}
      <div className="bg-white mb-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 w-full hover:bg-red-50 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors duration-300" strokeWidth={2} />
          <span className="text-gray-500 group-hover:text-red-500 font-medium transition-colors duration-300">로그아웃</span>
        </button>
        <div className="h-px bg-gray-100 mx-5" />
        <button
          onClick={() => { setWithdrawError(null); setShowWithdrawModal(true); }}
          className="flex items-center gap-3 px-5 py-4 w-full hover:bg-red-50 transition-all duration-300 group"
        >
          <UserX className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors duration-300" strokeWidth={2} />
          <span className="text-gray-400 group-hover:text-red-400 font-medium text-sm transition-colors duration-300">회원 탈퇴</span>
        </button>
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="fixed inset-0" onClick={() => !isWithdrawing && setShowWithdrawModal(false)} />
          <div className="relative bg-white rounded-3xl w-[calc(100%-2rem)] max-w-sm p-6 shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">회원 탈퇴</h2>

            <div className="text-sm text-gray-600 space-y-3 mb-4">
              <div className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-800 text-xs leading-relaxed">
                  탈퇴 시 개인정보는 즉시 삭제되며, 전자상거래법 등 관련 법령에 따라 거래 및 결제 기록은 <strong>5년간 분리 보관</strong>됩니다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-medium text-gray-900 text-xs mb-2">보관 항목</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>- 거래 내역 (금액, 일시, 상태)</li>
                  <li>- 결제 기록</li>
                  <li>- 서비스 이용 기록</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500">
                탈퇴 후 동일 계정으로 재가입이 가능합니다. 단, 보유 중인 쿠폰 및 혜택은 모두 소멸됩니다.
              </p>
            </div>

            {withdrawError && (
              <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600">{withdrawError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {isWithdrawing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    처리 중...
                  </span>
                ) : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
