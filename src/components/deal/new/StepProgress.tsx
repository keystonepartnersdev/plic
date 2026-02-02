'use client';

// src/components/deal/new/StepProgress.tsx
// 거래 생성 위저드 진행 상태 표시 컴포넌트

import { cn } from '@/lib/utils';
import { DealStep, STEP_ORDER } from './constants';

interface StepProgressProps {
  currentStep: DealStep;
}

export function StepProgress({ currentStep }: StepProgressProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="px-5 py-4">
      <div className="flex gap-1">
        {STEP_ORDER.map((step, index) => (
          <div
            key={step}
            className={cn(
              'flex-1 h-1 rounded-full',
              currentIndex >= index ? 'bg-primary-400' : 'bg-gray-200'
            )}
          />
        ))}
      </div>
    </div>
  );
}
