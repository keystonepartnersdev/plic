'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Home, FileText } from 'lucide-react';
import { Header } from '@/components/common';

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // URL 파라미터에서 결제 결과 추출
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');
  const trxId = searchParams.get('trxId');
  const trackId = searchParams.get('trackId');
  const amount = searchParams.get('amount');
  const authCd = searchParams.get('authCd');
  const cardNo = searchParams.get('cardNo');
  const issuer = searchParams.get('issuer');

  // 성공 화면
  if (success && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="결제 완료" />

        <div className="px-5 py-12">
          {/* 성공 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* 메시지 */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            결제가 완료되었습니다
          </h1>
          <p className="text-gray-500 text-center mb-8">
            거래가 정상적으로 접수되었습니다.
          </p>

          {/* 결제 정보 */}
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">결제 정보</h2>
            <div className="space-y-3">
              {amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">결제 금액</span>
                  <span className="font-semibold text-gray-900">
                    {Number(amount).toLocaleString()}원
                  </span>
                </div>
              )}
              {authCd && (
                <div className="flex justify-between">
                  <span className="text-gray-500">승인 번호</span>
                  <span className="font-medium text-gray-900">{authCd}</span>
                </div>
              )}
              {cardNo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">결제 카드</span>
                  <span className="font-medium text-gray-900">
                    {issuer ? `${issuer} ` : ''}{cardNo}
                  </span>
                </div>
              )}
              {trackId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">주문 번호</span>
                  <span className="font-medium text-gray-900 text-sm">{trackId}</span>
                </div>
              )}
              {trxId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">거래 번호</span>
                  <span className="font-medium text-gray-900 text-sm">{trxId}</span>
                </div>
              )}
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-700">
              서류 검토 후 송금이 진행됩니다. 진행 상황은 거래내역에서 확인하실 수 있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <Link
              href="/deals"
              className="w-full h-14 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-5 h-5" />
              거래내역 확인
            </Link>
            <Link
              href="/"
              className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Home className="w-5 h-5" />
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 실패 화면
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="결제 실패" />

      <div className="px-5 py-12">
        {/* 실패 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* 메시지 */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          결제에 실패했습니다
        </h1>
        <p className="text-gray-500 text-center mb-8">
          {error || '결제 처리 중 오류가 발생했습니다.'}
        </p>

        {/* 안내 메시지 */}
        <div className="bg-red-50 rounded-xl p-4 mb-8">
          <p className="text-sm text-red-700">
            결제가 완료되지 않았습니다. 다시 시도하시거나, 문제가 계속되면 고객센터로 문의해 주세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full h-14 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            다시 시도하기
          </button>
          <Link
            href="/"
            className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
