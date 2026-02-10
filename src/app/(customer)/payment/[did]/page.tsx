'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { CreditCard, AlertCircle, Clock, Shield, CheckCircle, ChevronRight, Check, XCircle } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { dealsAPI } from '@/lib/api';
import { IDeal, IRegisteredCard } from '@/types';

type PaymentMethod = 'new' | 'registered';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const did = params.did as string;

  const { currentUser, isLoggedIn, fetchCurrentUser, registeredCards, _hasHydrated } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [userRefreshed, setUserRefreshed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('new');
  const [selectedCard, setSelectedCard] = useState<IRegisteredCard | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPortalTarget(document.getElementById('mobile-frame'));
  }, []);

  // RevisionBanner 높이 감지
  useEffect(() => {
    const updateBannerHeight = () => {
      const banner = document.getElementById('revision-banner');
      setBannerHeight(banner ? banner.offsetHeight : 0);
    };
    updateBannerHeight();
    const observer = new MutationObserver(updateBannerHeight);
    const frame = document.getElementById('mobile-frame');
    if (frame) {
      observer.observe(frame, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [mounted]);

  // 등록된 카드가 있으면 기본 결제 방법으로 설정
  useEffect(() => {
    if (registeredCards.length > 0 && !selectedCard) {
      // 기본 카드 또는 첫 번째 카드 선택
      const defaultCard = registeredCards.find(c => c.isDefault) || registeredCards[0];
      setSelectedCard(defaultCard);
      setPaymentMethod('registered');
    }
  }, [registeredCards, selectedCard]);

  // 결제 페이지 진입 시 최신 사용자 정보 가져오기 (어드민에서 상태 변경된 경우 반영)
  useEffect(() => {
    if (mounted && isLoggedIn && !userRefreshed) {
      fetchCurrentUser().finally(() => {
        setUserRefreshed(true);
      });
    }
  }, [mounted, isLoggedIn, userRefreshed, fetchCurrentUser]);

  useEffect(() => {
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
      return;
    }

    if (mounted && _hasHydrated && isLoggedIn && userRefreshed) {
      // API에서 거래 정보 가져오기
      dealsAPI.get(did).then(response => {
        if (response.deal && !response.deal.isPaid) {
          setDeal(response.deal);
        } else {
          router.replace('/deals');
        }
      }).catch(() => {
        router.replace('/deals');
      });
    }
  }, [mounted, _hasHydrated, isLoggedIn, userRefreshed, did, router]);

  if (!mounted || !_hasHydrated || !isLoggedIn || !userRefreshed || !deal || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // 사업자 인증 대기/거절 상태 체크 (businessInfo.verificationStatus 기준)
  const isBusinessUser = currentUser.userType === 'business';
  const verificationStatus = currentUser.businessInfo?.verificationStatus;
  if (isBusinessUser && verificationStatus !== 'verified') {
    const isRejected = verificationStatus === 'rejected';

    if (isRejected) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header title="결제하기" showBack />
          <div className="px-5 py-12">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                사업자 인증 거절
              </h2>
              <p className="text-gray-500 mb-6">
                사업자 인증이 거절되어<br />
                결제 및 송금이 불가합니다.<br /><br />
                사업자 등록증을 다시 첨부하여<br />
                재심사를 요청해주세요.
              </p>
              {currentUser.businessInfo?.verificationMemo && (
                <div className="bg-red-50 rounded-xl p-4 text-left mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">거절 사유</p>
                      <p className="text-red-700">
                        {currentUser.businessInfo.verificationMemo}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => router.push('/mypage/edit')}
                className="w-full h-12 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl mb-3"
              >
                사업자 등록증 재첨부
              </button>
              <button
                onClick={() => router.back()}
                className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-xl"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="결제하기" showBack />
        <div className="px-5 py-12">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              사업자 인증 대기 중
            </h2>
            <p className="text-gray-500 mb-6">
              사업자 정보 검토가 완료되면<br />
              결제 및 송금이 가능합니다.<br /><br />
              하단의 [거래내역]에서 등록하신<br />
              거래 정보를 확인하실 수 있습니다.
            </p>
            <div className="bg-yellow-50 rounded-xl p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">검토 진행 중</p>
                  <p className="text-yellow-700">
                    영업일 기준 당일 내에 검토가 완료됩니다.
                    승인 완료 시 알림을 보내드립니다.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-6 w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-xl"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 새 카드로 결제 (기존 방식 - 결제창 열기)
  const handleNewCardPayment = async () => {
    setIsLoading(true);

    try {
      // 결제 전 데이터 검증
      console.log('[Payment] Deal data:', {
        did: deal.did,
        amount: deal.amount,
        finalAmount: deal.finalAmount,
        feeAmount: deal.feeAmount,
      });

      if (!deal.finalAmount || deal.finalAmount <= 0) {
        alert('결제 금액 정보가 올바르지 않습니다. 거래를 다시 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // Softpayment API를 통해 결제창 URL 받기
      const requestBody = {
        amount: deal.finalAmount,
        goodsName: `송금 ${(deal.amount || 0).toLocaleString()}원 + 수수료`,
        payerName: currentUser.name || '',
        payerEmail: currentUser.email || '',
        payerTel: currentUser.phone || '',
        device: 'mobile',
        dealId: deal.did,
        userId: currentUser.uid,
      };

      console.log('[Payment] Request body:', requestBody);

      const response = await fetch('/api/payments/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('[Payment] API response:', data);

      if (!response.ok || !data.success) {
        alert(data.error || '결제 생성에 실패했습니다.');
        setIsLoading(false);
        return;
      }

      // 결제창으로 이동
      const authPageUrl = data.data?.authPageUrl || data.authPageUrl;
      if (authPageUrl) {
        window.location.href = authPageUrl;
      } else {
        console.error('[Payment] Missing authPageUrl in response:', data);
        alert('결제창 URL을 받지 못했습니다.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 등록된 카드로 결제 (빌링키 결제)
  const handleBillingKeyPayment = async () => {
    if (!selectedCard) {
      alert('결제할 카드를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[BillingKey Payment] Starting with card:', selectedCard.cardId);

      if (!deal.finalAmount || deal.finalAmount <= 0) {
        alert('결제 금액 정보가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      const requestBody = {
        billingKey: selectedCard.billingKey,
        amount: deal.finalAmount,
        goodsName: `송금 ${(deal.amount || 0).toLocaleString()}원 + 수수료`,
        payerName: currentUser.name || '',
        payerEmail: currentUser.email || '',
        payerTel: currentUser.phone || '',
        dealId: deal.did,
        userId: currentUser.uid,
      };

      console.log('[BillingKey Payment] Request body:', requestBody);

      const response = await fetch('/api/payments/billing-key/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('[BillingKey Payment] API response:', data);

      if (!response.ok || !data.success) {
        const errorMsg = data.error || '결제에 실패했습니다.';
        alert(errorMsg);
        setIsLoading(false);
        return;
      }

      // API를 통해 거래 상태 업데이트
      try {
        await dealsAPI.update(deal.did, {
          isPaid: true,
          paidAt: new Date().toISOString(),
          status: 'reviewing',
          pgTransactionId: data.trxId,
        });
      } catch (updateError) {
        console.error('[BillingKey Payment] Failed to update deal status:', updateError);
        // 결제는 성공했지만 상태 업데이트 실패 - 계속 진행
      }

      // 결제 완료 페이지로 이동
      const params = new URLSearchParams({
        success: 'true',
        trxId: data.trxId || '',
        trackId: data.trackId || '',
        amount: String(data.amount || deal.finalAmount),
        authCd: data.authCd || '',
        cardNo: data.cardNo || '',
        issuer: data.issuer || '',
        dealId: deal.did,
      });
      router.push(`/payment/result?${params.toString()}`);
    } catch (error) {
      console.error('BillingKey Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 결제 핸들러 - 결제 수단에 따라 분기
  const handlePayment = async () => {
    if (paymentMethod === 'registered' && selectedCard) {
      await handleBillingKeyPayment();
    } else {
      await handleNewCardPayment();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="결제하기" showBack />

      {/* 결제 금액 */}
      <div className="bg-white px-5 py-6 mb-2">
        <p className="text-sm text-gray-500 mb-1">결제 금액</p>
        <p className="text-3xl font-bold text-gray-900">
          {(deal.finalAmount ?? 0).toLocaleString()}
          <span className="text-lg font-normal text-gray-500">원</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          송금 {(deal.amount ?? 0).toLocaleString()}원 + 수수료 {(deal.feeAmount ?? 0).toLocaleString()}원
        </p>
      </div>

      {/* 송금 정보 */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="font-semibold text-gray-900 mb-4">송금 정보</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">받는 분</span>
            <span className="font-medium text-gray-900">{deal.recipient?.accountHolder ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">입금 계좌</span>
            <span className="font-medium text-gray-900">
              {deal.recipient?.bank ?? '-'} {deal.recipient?.accountNumber ?? '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">송금 금액</span>
            <span className="font-medium text-gray-900">{(deal.amount ?? 0).toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 방법 - 일반 카드결제만 지원 (빌링키 API 미지원) */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="font-semibold text-gray-900 mb-4">결제 방법</h3>
        <div className="space-y-3">
          {/* 카드 결제 */}
          <div className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary-400 bg-primary-50">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-100">
              <CreditCard className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">카드 결제</p>
              <p className="text-sm text-gray-500">결제창에서 카드 정보 입력</p>
            </div>
            <Check className="w-5 h-5 text-primary-500" />
          </div>
        </div>
      </div>

      {/* 안내 사항 */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="font-semibold text-gray-900 mb-4">안내 사항</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              결제 완료 후 서류 검토가 진행됩니다
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              검토 완료 후 지정 계좌로 송금이 진행됩니다
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              모든 결제 정보는 안전하게 암호화됩니다
            </p>
          </div>
        </div>
      </div>

      {/* 결제 버튼 - Portal로 mobile-frame에 고정 */}
      {portalTarget && createPortal(
        <div className="absolute left-0 right-0 px-5 z-20 pointer-events-none" style={{ bottom: 71 + bannerHeight }}>
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="
              w-full h-14
              bg-primary-400 hover:bg-primary-500
              disabled:bg-gray-300 disabled:text-gray-500
              text-white font-semibold text-lg
              rounded-xl transition-colors
              pointer-events-auto
            "
          >
            {isLoading
              ? '결제창 이동 중...'
              : `${(deal.finalAmount ?? 0).toLocaleString()}원 결제하기`
            }
          </button>
        </div>,
        portalTarget
      )}
    </div>
  );
}
