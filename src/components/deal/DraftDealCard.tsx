'use client';

import { Trash2, ChevronRight } from 'lucide-react';
import { IDealDraft, TDealStep } from '@/types';

interface DraftDealCardProps {
  draft: IDealDraft;
  onClick: () => void;
  onDelete: () => void;
}

const stepLabels: Record<TDealStep, string> = {
  type: '거래유형 선택',
  amount: '금액 입력',
  recipient: '수취인 정보',
  docs: '서류 첨부',
  confirm: '최종 확인',
};

const getProgress = (step: TDealStep): number => {
  const steps: TDealStep[] = ['type', 'amount', 'recipient', 'docs', 'confirm'];
  return ((steps.indexOf(step) + 1) / steps.length) * 100;
};

export function DraftDealCard({ draft, onClick, onDelete }: DraftDealCardProps) {
  return (
    <div
      className="p-4 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-600">
            작성중
          </span>
          <p className="mt-2 font-medium text-gray-900">
            {draft.dealTypeLabel || '새 송금'}
          </p>
          {draft.amount && (
            <p className="text-lg font-bold text-orange-600 mt-1">
              {draft.amount.toLocaleString()}원
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('작성중인 송금을 삭제하시겠습니까?')) {
                onDelete();
              }
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{stepLabels[draft.currentStep]}</span>
          <span>{Math.round(getProgress(draft.currentStep))}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${getProgress(draft.currentStep)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        마지막 수정: {new Date(draft.lastUpdatedAt).toLocaleString('ko-KR')}
      </p>
    </div>
  );
}
