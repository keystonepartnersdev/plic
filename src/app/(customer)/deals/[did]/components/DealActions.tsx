'use client';

import { Trash2 } from 'lucide-react';
import { IDeal } from '@/types';

interface DealActionsProps {
  deal: IDeal;
  onDelete: () => void;
  onCancel: () => void;
}

export function DealActions({ deal, onDelete, onCancel }: DealActionsProps) {
  // 거래 삭제 버튼 - draft/awaiting_payment 상태이면서 미결제일 때
  const showDeleteButton = deal.status && (deal.status === 'draft' || deal.status === 'awaiting_payment') && !deal.isPaid;

  // 거래 취소 버튼 - 결제 후 진행중인 거래
  const showCancelButton = deal.status && ['pending', 'reviewing', 'hold', 'need_revision'].includes(deal.status) && deal.isPaid;

  if (!showDeleteButton && !showCancelButton) return null;

  return (
    <>
      {showDeleteButton && (
        <div className="px-5 mt-4">
          <button
            onClick={onDelete}
            className="w-full h-12 text-red-500 hover:text-red-700 font-medium flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            거래 삭제
          </button>
        </div>
      )}

      {showCancelButton && (
        <div className="px-5 mt-4">
          <button
            onClick={onCancel}
            className="w-full h-12 text-gray-500 hover:text-gray-700 font-medium"
          >
            거래 취소
          </button>
        </div>
      )}
    </>
  );
}
