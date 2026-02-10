'use client';

// src/components/deal/detail/StatusCard.tsx
// 거래 상태 카드 컴포넌트

import Link from 'next/link';
import { Check, Clock, AlertCircle, CreditCard, XCircle } from 'lucide-react';
import { IDeal, TDealStatus } from '@/types';
import { DealHelper } from '@/classes';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores';
import { STATUS_COLORS } from './constants';

interface StatusCardProps {
  deal: IDeal;
}

export function StatusCard({ deal }: StatusCardProps) {
  const { currentUser } = useUserStore();
  const statusConfig = DealHelper.getStatusConfig(deal.status);
  const typeConfig = DealHelper.getDealTypeConfig(deal.dealType);

  // 사업자 인증 상태 확인 (businessInfo.verificationStatus 기준)
  const verificationStatus = currentUser?.businessInfo?.verificationStatus;
  const isBusinessUser = currentUser?.userType === 'business';
  const isRejected = isBusinessUser && verificationStatus === 'rejected';
  const isPendingVerification = isBusinessUser && verificationStatus === 'pending';
  const isPaymentBlocked = isBusinessUser && verificationStatus !== 'verified';

  // 상태별 아이콘
  const StatusIcon = () => {
    switch (deal.status) {
      case 'completed':
        return <Check className="w-6 h-6" />;
      case 'need_revision':
      case 'cancelled':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  return (
    <div className="bg-white px-5 py-6 mb-2">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          STATUS_COLORS[statusConfig.color]
        )}>
          <StatusIcon />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {deal.isPaid && (
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                결제완료
              </span>
            )}
            <span className={cn(
              'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
              STATUS_COLORS[statusConfig.color]
            )}>
              {statusConfig.name}
            </span>
          </div>
          <p className="text-sm text-gray-500">{deal.did}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">{deal.dealName}</h2>
      <p className="text-gray-500">{typeConfig.name}</p>

      {/* 결제 버튼 - draft 또는 awaiting_payment 상태이면서 미결제일 때 */}
      {(deal.status === 'draft' || deal.status === 'awaiting_payment') && !deal.isPaid && (
        isPaymentBlocked ? (
          <div className="mt-4">
            <button
              disabled
              className="
                w-full h-14
                bg-gray-300
                text-gray-500 font-semibold
                rounded-xl
                flex items-center justify-center gap-2
                cursor-not-allowed
              "
            >
              <CreditCard className="w-5 h-5" />
              결제하기
            </button>
            {isRejected ? (
              <div className="mt-3 p-4 bg-red-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">사업자 인증이 거절되었습니다.</p>
                    {currentUser?.businessInfo?.verificationMemo && (
                      <p className="text-sm text-red-600 mb-2">{currentUser.businessInfo.verificationMemo}</p>
                    )}
                    <p className="text-sm text-red-600">사업자 등록증을 다시 첨부해주세요.</p>
                    <Link
                      href="/mypage/edit"
                      className="inline-block mt-2 text-sm font-semibold text-red-700 underline"
                    >
                      사업자 등록증 재첨부 →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700">사업자 인증 진행중입니다.</p>
                    <p className="text-sm text-yellow-600 mt-1">영업일 기준 당일 내에 검토가 완료됩니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href={`/payment/${deal.did}`}
            className="
              mt-4 w-full h-14
              bg-primary-600 hover:bg-primary-700
              text-white font-semibold
              rounded-xl
              flex items-center justify-center gap-2
              transition-colors
            "
          >
            <CreditCard className="w-5 h-5" />
            결제하기
          </Link>
        )
      )}

      {/* 결제완료 상태 */}
      {deal.isPaid && (
        <div className="mt-4">
          <button
            disabled
            className="
              w-full h-14
              bg-gray-900
              text-white font-semibold
              rounded-xl
              flex items-center justify-center gap-2
              cursor-not-allowed
            "
          >
            <Check className="w-5 h-5" />
            결제완료
          </button>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700 leading-relaxed">
              본 거래는 운영팀에서 검수중입니다.<br />
              검수가 완료되면 하단에 기재하신 수취인 정보로 송금이 진행됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
