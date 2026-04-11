'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle, XCircle, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ResultContent() {
  const params = useSearchParams();

  const success = params.get('success') === 'true';
  const error = params.get('error');
  const trxId = params.get('trxId');
  const trackId = params.get('trackId');
  const amount = params.get('amount');
  const authCd = params.get('authCd');
  const cardNo = params.get('cardNo');
  const issuer = params.get('issuer');
  const cardType = params.get('cardType');
  const installment = params.get('installment');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className={`rounded-2xl p-8 shadow-lg border-2 ${
          success ? 'bg-white border-green-200' : 'bg-white border-red-200'
        }`}>
          {/* 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {success ? (
                <CheckCircle size={40} className="text-green-600" />
              ) : (
                <XCircle size={40} className="text-red-600" />
              )}
            </div>
          </div>

          {/* 제목 */}
          <h1 className={`text-2xl font-bold text-center mb-2 ${
            success ? 'text-green-800' : 'text-red-800'
          }`}>
            {success ? '결제 테스트 성공!' : '결제 실패'}
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            {success ? '소프트먼트 인증결제가 정상 처리되었습니다.' : error || '알 수 없는 오류'}
          </p>

          {/* 결제 정보 */}
          {success && (
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-gray-700">결제 상세</span>
              </div>

              {[
                { label: '거래번호', value: trxId },
                { label: '주문번호', value: trackId },
                { label: '결제금액', value: amount ? `${Number(amount).toLocaleString()}원` : '-' },
                { label: '승인번호', value: authCd },
                { label: '카드번호', value: cardNo },
                { label: '발급사', value: issuer },
                { label: '카드구분', value: cardType },
                { label: '할부', value: installment === '00' ? '일시불' : installment ? `${installment}개월` : '-' },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}

          {success && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 mb-6">
              ⚠️ 테스트 결제입니다. 어드민에서 해당 거래를 취소 처리해주세요.
            </div>
          )}

          <Link
            href="/admin/payment-test"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            테스트 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentTestResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}
