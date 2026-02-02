'use client';

// src/components/deal/detail/StatusCard.tsx
// 거래 상태 카드 컴포넌트

import Link from 'next/link';
import { Check, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { IDeal, TDealStatus } from '@/types';
import { DealHelper } from '@/classes';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from './constants';

interface StatusCardProps {
  deal: IDeal;
}

export function StatusCard({ deal }: StatusCardProps) {
  const statusConfig = DealHelper.getStatusConfig(deal.status);
  const typeConfig = DealHelper.getDealTypeConfig(deal.dealType);

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
