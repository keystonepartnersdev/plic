'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { CreditCard, AlertCircle, Clock, Shield, CheckCircle } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useDealStore } from '@/stores';
import { IDeal } from '@/types';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const did = params.did as string;

  const { currentUser, isLoggedIn } = useUserStore();
  const { deals } = useDealStore();

  const [mounted, setMounted] = useState(false);
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
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
  }, [mounted, isLoggedIn, deals, did, router]);

  if (!mounted || !isLoggedIn || !deal || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // 사업자 인증 대기 상태 체크
  if (currentUser.status === 'pending_verification') {
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
              사업자등록증 검토가 완료되면<br />
              결제 및 송금이 가능합니다.
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

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // Softpayment API를 통해 결제창 URL 받기
      const response = await fetch('/api/payments/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: deal.finalAmount,
          goodsName: `송금 ${deal.amount.toLocaleString()}원 + 수수료`,
          payerName: currentUser.name || '',
          payerEmail: currentUser.email || '',
          payerTel: currentUser.phone || '',
          device: 'mobile',
          dealId: deal.did,
          userId: currentUser.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || '결제 생성에 실패했습니다.');
        setIsLoading(false);
        return;
      }

      // 결제창으로 이동
      if (data.authPageUrl) {
        window.location.href = data.authPageUrl;
      } else {
        alert('결제창 URL을 받지 못했습니다.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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

      {/* 송금 정보 */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="font-semibold text-gray-900 mb-4">송금 정보</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">받는 분</span>
            <span className="font-medium text-gray-900">{deal.recipient.accountHolder}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">입금 계좌</span>
            <span className="font-medium text-gray-900">
              {deal.recipient.bank} {deal.recipient.accountNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">송금 금액</span>
            <span className="font-medium text-gray-900">{deal.amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 방법 안내 */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="font-semibold text-gray-900 mb-4">결제 방법</h3>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">신용/체크카드</p>
            <p className="text-sm text-gray-500">결제창에서 카드 정보를 입력해 주세요</p>
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
        <div className="absolute bottom-[71px] left-0 right-0 px-5 z-20 pointer-events-none">
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
            {isLoading ? '결제창 이동 중...' : `${deal.finalAmount.toLocaleString()}원 결제하기`}
          </button>
        </div>,
        portalTarget
      )}
    </div>
  );
}
