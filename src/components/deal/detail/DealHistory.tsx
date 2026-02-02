'use client';

// src/components/deal/detail/DealHistory.tsx
// 거래 이력 컴포넌트

import { IDeal } from '@/types';
import { cn } from '@/lib/utils';

interface DealHistoryProps {
  deal: IDeal;
}

export function DealHistory({ deal }: DealHistoryProps) {
  const history = deal.history || [];

  if (history.length === 0) {
    return (
      <div className="bg-white px-5 py-4">
        <h3 className="font-semibold text-gray-900 mb-3">거래 이력</h3>
        <p className="text-gray-500 text-sm">거래 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white px-5 py-4">
      <h3 className="font-semibold text-gray-900 mb-3">거래 이력</h3>
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-2 h-2 rounded-full',
                index === 0 ? 'bg-primary-400' : 'bg-gray-300'
              )} />
              {index < history.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-gray-900">{item.action}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(item.timestamp).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
