'use client';

// src/components/auth/signup/AgreementStep.tsx
// Step 1: 약관 동의

import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgreementStepProps } from './types';

export function AgreementStep({
  agreements,
  onToggleAll,
  onToggleOne,
  onNext,
  allChecked,
  allRequiredChecked,
}: AgreementStepProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">약관에 동의해주세요</h2>
      <p className="text-gray-500 mb-6">서비스 이용을 위해 약관 동의가 필요합니다.</p>

      {/* 전체 동의 */}
      <button
        onClick={onToggleAll}
        className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4"
      >
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          allChecked ? 'bg-primary-400' : 'border-2 border-gray-300'
        )}>
          {allChecked && <Check className="w-4 h-4 text-white" />}
        </div>
        <span className="font-semibold text-gray-900">전체 동의</span>
      </button>

      {/* 개별 약관 */}
      <div className="space-y-2">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="flex items-center justify-between p-3">
            <button
              onClick={() => onToggleOne(agreement.id)}
              className="flex items-center gap-3 flex-1"
            >
              <div className={cn(
                'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                agreement.checked ? 'bg-primary-400' : 'border-2 border-gray-300'
              )}>
                {agreement.checked && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={cn(
                'text-sm text-left',
                agreement.required ? 'text-gray-900' : 'text-gray-500'
              )}>
                {agreement.label}
              </span>
            </button>
            {agreement.link && (
              <Link
                href={agreement.link}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        disabled={!allRequiredChecked}
        className="w-full h-14 mt-8 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
      >
        다음
      </button>
    </div>
  );
}
