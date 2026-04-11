'use client';

// src/components/deal/detail/RecipientCard.tsx
// 수취인 정보 카드 컴포넌트

import { Check } from 'lucide-react';
import { IDeal } from '@/types';

interface RecipientCardProps {
  deal: IDeal;
  senderName?: string;
}

export function RecipientCard({ deal, senderName }: RecipientCardProps) {
  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">수취인 정보</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">은행</span>
          <span className="font-medium">{deal.recipient?.bank || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">계좌번호</span>
          <span className="font-medium">{deal.recipient?.accountNumber || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">예금주</span>
          <span className="font-medium">{deal.recipient?.accountHolder || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">보내는 분</span>
          <span className="font-medium">{deal.senderName || senderName || '-'}</span>
        </div>
      </div>

      {/* 송금완료 표시는 StatusCard에서 통합 관리 */}
    </div>
  );
}
