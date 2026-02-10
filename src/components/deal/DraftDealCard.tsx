'use client';

import { memo, useCallback, useMemo } from 'react';
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

// React.memo로 불필요한 리렌더링 방지
export const DraftDealCard = memo(function DraftDealCard({ draft, onClick, onDelete }: DraftDealCardProps) {
  // useMemo로 진행률 계산 최적화
  const progress = useMemo(() => getProgress(draft.currentStep), [draft.currentStep]);

  // useCallback으로 삭제 핸들러 최적화
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('작성중인 송금을 삭제하시겠습니까?')) {
      onDelete();
    }
  }, [onDelete]);

  return (
    <div
      className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white">
            작성중
          </span>
          <p className="mt-3 font-bold text-gray-900">
            {draft.dealTypeLabel || '새 송금'}
          </p>
          {draft.amount && (
            <p className="text-lg font-black text-[#2563EB] mt-1">
              {draft.amount.toLocaleString()}원
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all duration-300" strokeWidth={2} />
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span className="font-medium">{stepLabels[draft.currentStep]}</span>
          <span className="font-semibold text-[#2563EB]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 font-medium">
        마지막 수정: {new Date(draft.lastUpdatedAt).toLocaleString('ko-KR')}
      </p>
    </div>
  );
});
