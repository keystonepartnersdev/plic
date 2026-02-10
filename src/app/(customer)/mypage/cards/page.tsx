'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Trash2, Star, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { IRegisteredCard } from '@/types/payment';
import { cn } from '@/lib/utils';

// 카드사 정보
const CARD_COMPANIES = [
  { code: 'shinhan', name: '신한카드', color: 'bg-blue-500' },
  { code: 'samsung', name: '삼성카드', color: 'bg-blue-700' },
  { code: 'kb', name: 'KB국민카드', color: 'bg-yellow-500' },
  { code: 'hyundai', name: '현대카드', color: 'bg-gray-800' },
  { code: 'lotte', name: '롯데카드', color: 'bg-red-500' },
  { code: 'hana', name: '하나카드', color: 'bg-green-500' },
  { code: 'woori', name: '우리카드', color: 'bg-blue-400' },
  { code: 'nh', name: 'NH농협카드', color: 'bg-green-600' },
  { code: 'bc', name: 'BC카드', color: 'bg-red-600' },
  { code: '비자', name: '비자', color: 'bg-blue-600' },
  { code: '마스터', name: '마스터카드', color: 'bg-orange-500' },
  { code: '아멕스', name: '아멕스', color: 'bg-blue-800' },
  { code: '은련', name: '은련카드', color: 'bg-red-700' },
  { code: '기타', name: '기타', color: 'bg-gray-500' },
];

function CardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoggedIn, registeredCards, addCard, removeCard, setDefaultCard, _hasHydrated } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardPassword, setCardPassword] = useState('');
  const [cardNickname, setCardNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const callbackProcessedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 빌링키 발급 콜백 처리
  useEffect(() => {
    if (!mounted || !currentUser) return;
    if (callbackProcessedRef.current) return; // 이미 처리됨

    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const billingKey = searchParams.get('billingKey');
    const cardNo = searchParams.get('cardNo');
    const issuer = searchParams.get('issuer');
    const issuerCode = searchParams.get('issuerCode');

    if (error) {
      callbackProcessedRef.current = true;
      alert(`카드 등록 실패: ${decodeURIComponent(error)}`);
      // URL 파라미터 제거
      router.replace('/mypage/cards');
      return;
    }

    if (success === 'true' && billingKey) {
      callbackProcessedRef.current = true;
      // 빌링키 발급 성공 - 카드 추가
      const card: IRegisteredCard = {
        cardId: `CARD${Date.now()}`,
        billingKey: billingKey,
        cardNickname: `${issuer || '카드'} ${cardNo?.slice(-4) || '****'}`,
        cardCompany: issuerCode?.toLowerCase() || 'etc',
        cardNumberLast4: cardNo?.slice(-4) || '****',
        isDefault: registeredCards.length === 0,
        createdAt: new Date().toISOString(),
      };

      addCard(card);
      alert('카드가 등록되었습니다.');
      // URL 파라미터 제거
      router.replace('/mypage/cards');
    }
  }, [mounted, currentUser, searchParams, addCard, registeredCards.length, router]);

  useEffect(() => {
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, _hasHydrated, isLoggedIn, router]);

  if (!mounted || !_hasHydrated || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // 빌링키 발급 시작 (PG 결제창으로 이동)
  const handleStartBillingKeyRegistration = async () => {
    if (!currentUser) return;

    setIsRegistering(true);
    try {
      const response = await fetch('/api/payments/billing-key/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payerName: currentUser.name || '',
          payerEmail: currentUser.email || '',
          payerTel: currentUser.phone || '',
          device: 'mobile',
          userId: currentUser.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || '카드 등록 요청에 실패했습니다.');
        setIsRegistering(false);
        return;
      }

      // 빌링키 발급창으로 이동
      if (data.authPageUrl) {
        window.location.href = data.authPageUrl;
      } else {
        alert('카드 등록 페이지 URL을 받지 못했습니다.');
        setIsRegistering(false);
      }
    } catch (error) {
      console.error('Billing key registration error:', error);
      alert('카드 등록 요청 중 오류가 발생했습니다.');
      setIsRegistering(false);
    }
  };

  // 기존 로컬 카드 등록 (테스트용 - 나중에 제거)
  const handleAddCard = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const cardCompany = getCardCompany(cleanCardNumber);

    const card: IRegisteredCard = {
      cardId: `CARD${Date.now()}`,
      billingKey: `BK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardNickname: cardNickname.trim() || `${cardCompany} ${cleanCardNumber.slice(-4)}`,
      cardCompany: cardCompany.toLowerCase(),
      cardNumberLast4: cleanCardNumber.slice(-4),
      isDefault: registeredCards.length === 0,
      createdAt: new Date().toISOString(),
    };

    addCard(card);
    setShowAddModal(false);
    setCardNumber('');
    setCardHolderName('');
    setCardExpiry('');
    setCardCvc('');
    setCardPassword('');
    setCardNickname('');
    setIsLoading(false);
  };

  const getCardCompany = (cardNumber: string): string => {
    const firstDigit = cardNumber[0];
    const firstTwo = cardNumber.slice(0, 2);

    if (firstDigit === '4') return '비자';
    if (['51', '52', '53', '54', '55'].includes(firstTwo)) return '마스터';
    if (['34', '37'].includes(firstTwo)) return '아멕스';
    if (firstTwo === '62') return '은련';
    return '기타';
  };

  const handleRemoveCard = (cardId: string) => {
    if (confirm('카드를 삭제하시겠습니까?')) {
      removeCard(cardId);
    }
  };

  const handleSetDefault = (cardId: string) => {
    setDefaultCard(cardId);
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
    }
    return numbers;
  };

  const canAddCard =
    cardNumber.replace(/\s/g, '').length >= 15 &&
    cardExpiry.length === 5 &&
    cardCvc.length >= 3 &&
    cardPassword.length === 2 &&
    cardHolderName.trim().length > 0;

  const getCardCompanyInfo = (code: string) => {
    return CARD_COMPANIES.find((c) => c.code === code) || { code, name: code, color: 'bg-gray-500' };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="결제카드 관리" showBack />

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* 카드 추가 버튼 */}
        <button
          onClick={handleStartBillingKeyRegistration}
          disabled={isRegistering}
          className="w-full mb-4 h-14 bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-primary-400 hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              카드 등록 중...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              새 카드 등록
            </>
          )}
        </button>

        {/* 등록된 카드 목록 */}
        {registeredCards.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {[...registeredCards]
                .sort((a, b) => {
                  if (a.isDefault && !b.isDefault) return -1;
                  if (!a.isDefault && b.isDefault) return 1;
                  return 0;
                })
                .map((card: IRegisteredCard) => {
                const companyInfo = getCardCompanyInfo(card.cardCompany);
                return (
                  <motion.div
                    key={card.cardId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className={cn(
                      'relative rounded-2xl p-5 text-white overflow-hidden',
                      companyInfo.color
                    )}
                  >
                  {/* 배경 패턴 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm opacity-80">{companyInfo.name}</p>
                        {card.isDefault && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-400 text-gray-900 rounded text-xs font-medium">
                            <Star className="w-3 h-3" />
                            기본 결제
                          </span>
                        )}
                      </div>
                      <CreditCard className="w-8 h-8 opacity-80" />
                    </div>

                    <p className="text-lg font-mono tracking-wider mb-4">
                      **** **** **** {card.cardNumberLast4}
                    </p>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs opacity-60">CARD NAME</p>
                        <p className="font-medium">{card.cardNickname}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-60">REGISTERED</p>
                        <p className="font-medium">{new Date(card.createdAt).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                      {!card.isDefault && (
                        <button
                          onClick={() => handleSetDefault(card.cardId)}
                          className="flex-1 h-9 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                          기본 결제로 설정
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveCard(card.cardId)}
                        className="h-9 px-4 bg-white/20 hover:bg-red-500/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">등록된 카드가 없습니다</p>
            <p className="text-sm text-gray-400">결제에 사용할 카드를 등록해주세요</p>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">카드 등록 안내</p>
              <p className="text-sm text-blue-700 mt-1">
                등록된 카드는 거래 결제 시 사용됩니다.
                카드 정보는 안전하게 암호화되어 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 카드 추가 모달 */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up max-h-[90%] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">새 카드 등록</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 카드 번호 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">카드 번호</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                />
              </div>

              {/* 카드 소유자 이름 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">카드 소유자 이름</label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="카드에 표시된 이름"
                  className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                />
              </div>

              {/* 유효기간 & CVC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">유효기간</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">CVC</label>
                  <input
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="***"
                    maxLength={4}
                    className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                  />
                </div>
              </div>

              {/* 비밀번호 앞 2자리 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">비밀번호 앞 2자리</label>
                <input
                  type="password"
                  value={cardPassword}
                  onChange={(e) => setCardPassword(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="**"
                  maxLength={2}
                  className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                />
              </div>

              {/* 카드 별명 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">카드 별명 (선택)</label>
                <input
                  type="text"
                  value={cardNickname}
                  onChange={(e) => setCardNickname(e.target.value)}
                  placeholder="예: 개인카드, 법인카드"
                  className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  미입력시 카드사와 뒷번호로 자동 생성됩니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleAddCard}
              disabled={!canAddCard || isLoading}
              className="w-full h-14 mt-6 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors"
            >
              {isLoading ? '등록 중...' : '카드 등록하기'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              테스트: 아무 카드번호(15자리 이상) 입력
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
        </div>
      }
    >
      <CardsPageContent />
    </Suspense>
  );
}
