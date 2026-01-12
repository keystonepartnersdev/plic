'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, Plus, ChevronRight, Star, Trash2 } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useDealStore, usePaymentStore } from '@/stores';
import { PaymentHelper, DealHelper } from '@/classes';
import { IDeal, IRegisteredCard } from '@/types';
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

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const did = params.did as string;

  const { currentUser, isLoggedIn, registeredCards, addCard, updateUser, removeCard, setDefaultCard } = useUserStore();
  const { deals, updateDeal } = useDealStore();
  const { addPayment } = usePaymentStore();

  const [mounted, setMounted] = useState(false);
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [installment, setInstallment] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // 카드 등록 폼
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardPassword, setCardPassword] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNickname, setCardNickname] = useState('');

  useEffect(() => {
    setMounted(true);
    // Portal 타겟 설정
    setPortalTarget(document.getElementById('mobile-frame'));
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
      return;
    }

    const foundDeal = deals.find((d) => d.did === did);
    if (mounted && (!foundDeal || foundDeal.isPaid)) {
      router.replace('/deals');
      return;
    }

    setDeal(foundDeal || null);

    // 기본 카드 선택 (선택된 카드가 없을 때만)
    if (!selectedCard) {
      const defaultCard = registeredCards.find((c) => c.isDefault);
      if (defaultCard) {
        setSelectedCard(defaultCard.cardId);
      } else if (registeredCards.length > 0) {
        setSelectedCard(registeredCards[0].cardId);
      }
    }
  }, [mounted, isLoggedIn, deals, did, router, registeredCards]);

  if (!mounted || !isLoggedIn || !deal || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

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

  const handleAddCard = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const cardCompany = getCardCompany(cleanCardNumber);

    const newCard = PaymentHelper.createRegisteredCard(
      cardNickname.trim() || `${cardCompany} ${cleanCardNumber.slice(-4)}`,
      cardCompany,
      cleanCardNumber.slice(-4),
      registeredCards.length === 0
    );

    addCard(newCard);
    setSelectedCard(newCard.cardId);
    setShowAddCard(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardPassword('');
    setCardHolderName('');
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

  const getCardCompanyInfo = (code: string) => {
    return CARD_COMPANIES.find((c) => c.code === code) || { code, name: code, color: 'bg-gray-500' };
  };

  const handlePayment = async () => {
    if (!selectedCard) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const payment = PaymentHelper.createSinglePayment(
      deal.did,
      currentUser.uid,
      deal.finalAmount,
      selectedCard,
      installment
    );

    // 결제 완료 처리
    payment.status = 'completed';
    payment.completedAt = new Date().toISOString();
    payment.items[0].status = 'completed';
    payment.items[0].paidAt = new Date().toISOString();
    payment.items[0].pgTransactionId = `PG${Date.now()}`;

    addPayment(payment);

    // 거래 업데이트
    updateDeal(deal.did, {
      paymentId: payment.paymentId,
      isPaid: true,
      paidAt: new Date().toISOString(),
      status: 'reviewing',
      history: [
        {
          timestamp: new Date().toISOString(),
          action: '결제 완료',
          description: `${deal.finalAmount.toLocaleString()}원 결제가 완료되었습니다.`,
          actor: 'system',
        },
        ...deal.history,
      ],
    });

    // 사용자 한도 업데이트
    updateUser({
      usedAmount: currentUser.usedAmount + deal.amount,
      totalPaymentAmount: currentUser.totalPaymentAmount + deal.finalAmount,
      totalDealCount: currentUser.totalDealCount + 1,
    });

    setIsLoading(false);
    router.replace(`/deals/${deal.did}`);
  };

  const canAddCard =
    cardNumber.replace(/\s/g, '').length >= 15 &&
    cardExpiry.length === 5 &&
    cardCvc.length >= 3 &&
    cardPassword.length === 2 &&
    cardHolderName.trim().length > 0;

  return (
    <div className="bg-gray-50 pb-24">
      <Header title="결제하기" showBack />

      {/* 결제 금액 */}
      <div className="bg-white px-5 py-6 mb-2">
        <p className="text-sm text-gray-500 mb-1">결제 금액</p>
        <p className="text-3xl font-bold text-gray-900">
          {deal.finalAmount.toLocaleString()}
          <span className="text-lg font-normal text-gray-500">원</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          송금 {deal.amount.toLocaleString()}원 + 수수료 {deal.feeAmount.toLocaleString()}원
        </p>
      </div>

      {/* 결제 카드 선택 */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="font-semibold text-gray-900 mb-4">결제 카드</h3>

        {!showAddCard ? (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-300 transition-colors mb-4"
          >
            <Plus className="w-5 h-5" />
            <span>새 카드 등록</span>
          </button>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">카드 정보 입력</h4>

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

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddCard(false)}
                className="flex-1 h-12 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleAddCard}
                disabled={!canAddCard || isLoading}
                className="flex-1 h-12 bg-gray-900 text-white rounded-xl font-medium disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isLoading ? '등록 중...' : '카드 등록'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              테스트: 아무 카드번호(15자리 이상) 입력
            </p>
          </div>
        )}

        {registeredCards.length > 0 && !showAddCard && (
          <div className="space-y-4">
            <AnimatePresence>
              {[...registeredCards]
                .sort((a, b) => {
                  if (a.isDefault && !b.isDefault) return -1;
                  if (!a.isDefault && b.isDefault) return 1;
                  return 0;
                })
                .map((card) => {
                const companyInfo = getCardCompanyInfo(card.cardCompany);
                return (
                  <motion.button
                    key={card.cardId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: selectedCard === card.cardId ? 1 : 1.02 }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 }
                    }}
                    onClick={() => setSelectedCard(card.cardId)}
                    className={cn(
                      'relative w-full rounded-2xl p-5 text-white overflow-hidden text-left',
                      companyInfo.color,
                      selectedCard === card.cardId && 'ring-4 ring-primary-400 ring-offset-2'
                    )}
                  >
                  {/* 배경 패턴 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
                  </div>

                  {/* 선택 체크마크 */}
                  {selectedCard === card.cardId && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center z-10">
                      <Check className="w-4 h-4 text-primary-400" />
                    </div>
                  )}

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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('카드를 삭제하시겠습니까?')) {
                            removeCard(card.cardId);
                            if (selectedCard === card.cardId) {
                              setSelectedCard(null);
                            }
                          }
                        }}
                        className="h-9 px-4 bg-white/20 hover:bg-red-500/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {!card.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefaultCard(card.cardId);
                            setSelectedCard(card.cardId);
                          }}
                          className="flex-1 h-9 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                          기본 결제로 설정
                        </button>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 할부 선택 */}
      {selectedCard && !showAddCard && deal.finalAmount >= 50000 && (
        <div className="bg-white px-5 py-6 mb-2">
          <h3 className="font-semibold text-gray-900 mb-4">할부 선택</h3>
          <div className="grid grid-cols-4 gap-2">
            {PaymentHelper.INSTALLMENT_OPTIONS.filter((opt) =>
              opt.value === 0 || deal.finalAmount >= 50000
            ).slice(0, 8).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInstallment(opt.value)}
                className={cn(
                  'py-3 rounded-xl text-sm font-medium transition-colors',
                  installment === opt.value
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 결제 버튼 - Portal로 mobile-frame에 고정 */}
      {!showAddCard && portalTarget && createPortal(
        <div className="absolute bottom-[71px] left-0 right-0 px-5 z-20 pointer-events-none">
          <button
            onClick={handlePayment}
            disabled={!selectedCard || isLoading}
            className="
              w-full h-14
              bg-primary-400 hover:bg-primary-500
              disabled:bg-gray-200 disabled:text-gray-400
              text-white font-semibold text-lg
              rounded-xl transition-colors
              pointer-events-auto
            "
          >
            {isLoading ? '결제 중...' : `${deal.finalAmount.toLocaleString()}원 결제하기`}
          </button>
        </div>,
        portalTarget
      )}
    </div>
  );
}
