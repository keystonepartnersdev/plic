'use client';

// src/components/deal/new/TypeStep.tsx
// Step 1: 거래 유형 선택

import { TDealType } from '@/types';
import { DealHelper } from '@/classes';
import { cn } from '@/lib/utils';
import { DEAL_TYPE_ORDER } from './constants';

interface TypeStepProps {
  selectedType: TDealType | null;
  onSelect: (type: TDealType) => void;
}

export function TypeStep({ selectedType, onSelect }: TypeStepProps) {
  const dealTypes = DEAL_TYPE_ORDER.map((type) => ({
    type,
    ...DealHelper.getDealTypeConfig(type),
  }));

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        어떤 거래인가요?
      </h2>
      <p className="text-gray-500 mb-6">
        거래 유형에 따라 필요한 서류가 달라집니다.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {dealTypes.filter(item => item && item.name).map((item) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-colors',
              selectedType === item.type
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-100 hover:border-gray-200'
            )}
          >
            <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
