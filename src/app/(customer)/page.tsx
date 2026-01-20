'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, ChevronDown, Sparkles, Shield, Clock, CreditCard, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useUserStore, useContentStore, useDealDraftStore, useDealStore } from '@/stores';
import { DealHelper, ContentHelper } from '@/classes';
import { BannerSlider, Modal } from '@/components/common';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUserStore();
  const { getVisibleBanners, getHomeFeaturedFAQs, fetchBanners, fetchFaqs } = useContentStore();
  const { drafts, clearCurrentDraft } = useDealDraftStore();
  const { deals } = useDealStore();
  const [amount, setAmount] = useState('');
  const [mounted, setMounted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 홈 페이지 진입 시 currentDraft 클리어 (새로운 송금 시작을 위해)
    clearCurrentDraft();
    // 배너, FAQ 데이터 API에서 가져오기
    fetchBanners();
    fetchFaqs();
  }, []);

  // 강제 로그아웃 감지 (탈퇴 처리 등)
  useEffect(() => {
    if (mounted && !isLoggedIn && sessionStorage.getItem('wasLoggedIn') === 'true') {
      sessionStorage.removeItem('wasLoggedIn');
      router.replace('/auth/login');
    } else if (mounted && isLoggedIn) {
      sessionStorage.setItem('wasLoggedIn', 'true');
    }
  }, [mounted, isLoggedIn, router]);

  // 현재 사용자의 작성중 송금
  const userDrafts = mounted && isLoggedIn && currentUser
    ? drafts.filter((d) => d.uid === currentUser.uid && d.status && d.status === 'draft')
    : [];

  // 현재 사용자의 결제대기 송금
  const userAwaitingDeals = mounted && isLoggedIn && currentUser
    ? deals.filter((d) => d.uid === currentUser.uid && d.status && d.status === 'awaiting_payment' && !d.isPaid)
    : [];

  const banners = getVisibleBanners();
  const faqs = getHomeFeaturedFAQs().slice(0, 5);

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    return Number(numericValue).toLocaleString('ko-KR');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setAmount(formatted);
  };

  const numericAmount = Number(amount.replace(/,/g, '')) || 0;
  const feeRate = currentUser?.feeRate || 4.0;
  const { feeAmount, totalAmount } = DealHelper.calculateTotal(numericAmount, feeRate);

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId?: string) => {
    const cat = ContentHelper.FAQ_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId || '기타';
  };

  // 카테고리 색상 가져오기
  const getCategoryColor = (categoryId?: string): string => {
    const colors: Record<string, string> = {
      service: 'bg-blue-100 text-blue-700',
      payment: 'bg-green-100 text-green-700',
      transfer: 'bg-purple-100 text-purple-700',
      account: 'bg-orange-100 text-orange-700',
    };
    return colors[categoryId || ''] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 영역 */}
      <header className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-400">PLIC</h1>
          {isLoggedIn ? (
            <Link href="/mypage" className="text-sm text-gray-600 hover:text-gray-900">
              {currentUser?.name}님
            </Link>
          ) : (
            <Link href="/auth/login" className="text-sm text-primary-400 font-medium">
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-b from-primary-50 to-white px-5 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          현금 결제를 카드로!
        </h2>
        <p className="text-gray-600 mb-6">
          카드 한도만큼 현금 즉시 송금
        </p>

        {/* 결제대기 송금 알림 배너 (우선 표시) */}
        {userAwaitingDeals.length > 0 && (
          <button
            onClick={() => {
              if (currentUser?.status !== 'active') {
                setShowStatusModal(true);
                return;
              }
              window.location.href = '/deals?tab=progress';
            }}
            className="w-full block bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  결제대기 중인 송금이 <strong className="text-blue-600">{userAwaitingDeals.length}건</strong> 있습니다
                </p>
                <p className="text-xs text-gray-500">바로 결제하기</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        )}

        {/* 작성중 송금 알림 배너 */}
        {userDrafts.length > 0 && (
          <button
            onClick={() => {
              if (currentUser?.status !== 'active') {
                setShowStatusModal(true);
                return;
              }
              window.location.href = '/deals?tab=progress';
            }}
            className="w-full block bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  작성중인 송금이 <strong className="text-orange-600">{userDrafts.length}건</strong> 있습니다
                </p>
                <p className="text-xs text-gray-500">이어서 작성하기</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        )}

        {/* 배너 슬라이더 */}
        <div className="mb-6">
          <BannerSlider />
        </div>

        {/* 금액 입력 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm text-gray-500 mb-2">송금할 금액</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full text-3xl font-bold text-gray-900 border-none outline-none bg-transparent"
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl text-gray-400">원</span>
          </div>

          {numericAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>수수료 ({feeRate}%)</span>
                <span>{feeAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>총 결제금액</span>
                <span className="text-primary-400">{totalAmount.toLocaleString()}원</span>
              </div>
            </div>
          )}

          {isLoggedIn ? (
            <button
              onClick={() => {
                if (currentUser?.status !== 'active') {
                  setShowStatusModal(true);
                  return;
                }
                const url = numericAmount > 0 ? `/deals/new?amount=${numericAmount}` : '/deals/new';
                window.location.href = url;
              }}
              className="
                mt-5 w-full h-12
                bg-primary-400 hover:bg-primary-500
                text-white font-semibold
                rounded-xl
                flex items-center justify-center gap-2
                transition-colors
              "
            >
              송금 신청하기
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="
                mt-5 w-full h-12
                bg-primary-400 hover:bg-primary-500
                text-white font-semibold
                rounded-xl
                flex items-center justify-center gap-2
                transition-colors
              "
            >
              로그인하고 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* 혜택 섹션 */}
      <section className="px-5 py-6 bg-white">
        <h3 className="font-bold text-lg text-gray-900 mb-4">PLIC만의 특별한 혜택</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <Sparkles className="w-8 h-8 text-primary-400 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">포인트 적립</h4>
            <p className="text-sm text-gray-500">카드 포인트/마일리지 적립</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <Shield className="w-8 h-8 text-primary-400 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">안전한 거래</h4>
            <p className="text-sm text-gray-500">서류 검증 후 송금 진행</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <Clock className="w-8 h-8 text-primary-400 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">빠른 처리</h4>
            <p className="text-sm text-gray-500">승인 후 즉시 송금</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <CreditCard className="w-8 h-8 text-primary-400 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">분할 결제</h4>
            <p className="text-sm text-gray-500">최대 3개 카드로 분할</p>
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">자주 묻는 질문</h3>
          <Link href="/guide" className="text-sm text-gray-500 flex items-center">
            더보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {mounted && faqs.length > 0 ? (
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.faqId} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.faqId ? null : faq.faqId)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 pr-4">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap flex-shrink-0',
                      getCategoryColor(faq.category)
                    )}>
                      {getCategoryName(faq.category)}
                    </span>
                    <span className="font-medium text-gray-900 truncate">{faq.question.length > 14 ? faq.question.substring(0, 14) + '...' : faq.question}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-gray-400 transition-transform flex-shrink-0',
                      expandedFaq === faq.faqId && 'rotate-180'
                    )}
                  />
                </button>
                {expandedFaq === faq.faqId && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : mounted ? (
          <div className="bg-white rounded-xl p-4 text-center text-gray-500">
            FAQ가 준비 중입니다.
          </div>
        ) : null}
      </section>

      {/* 하단 여백 */}
      <div className="h-8" />

      {/* 계정 상태 모달 */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={currentUser?.status === 'pending_verification' ? '사업자 인증 안내' : '계정 상태 안내'}
      >
        {currentUser?.status === 'pending_verification' ? (
          <p>
            안녕하세요, <strong className="text-gray-900">{currentUser?.name}</strong>님!
            <br /><br />
            현재 회원님의 계정은 <strong className="text-primary-400">가승인</strong> 상태로,
            사업자등록증 검수가 진행 중입니다.
            <br /><br />
            검수는 영업일 기준 1~2일 내에 완료되며, 승인 완료 시 바로 서비스 이용이 가능합니다.
            빠르게 처리해 드리겠습니다. 감사합니다.
          </p>
        ) : (
          <p>
            죄송합니다. 현재 <strong className="text-gray-900">{currentUser?.name}</strong>님의 계정은{' '}
            <strong className="text-gray-900">
              {currentUser?.status === 'pending' ? '대기' : '정지'}
            </strong>
            {' '}처리되었습니다. 원활한 서비스 이용을 위하여 고객센터로 문의주시면 친절하게 답변드리겠습니다. 감사합니다.
          </p>
        )}
      </Modal>
    </div>
  );
}
