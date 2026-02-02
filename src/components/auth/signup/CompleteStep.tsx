'use client';

// src/components/auth/signup/CompleteStep.tsx
// Step 5: 가입 완료

import { Check, AlertCircle } from 'lucide-react';
import { CompleteStepProps } from './types';

export function CompleteStep({
  name,
  userType,
  onLogin,
}: CompleteStepProps) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-primary-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">가입 완료!</h2>
      <p className="text-gray-500 mb-4">
        {name}님, PLIC 가입을 환영합니다.
      </p>

      {userType === 'business' && (
        <div className="p-4 bg-blue-50 rounded-xl mb-6 text-left">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 font-medium">사업자 인증 진행 중</p>
              <p className="text-xs text-blue-600 mt-1">
                사업자등록증 확인 후 서비스 이용이 가능합니다.<br />
                인증 결과는 이메일과 알림으로 안내드립니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onLogin}
        className="w-full h-14 bg-primary-400 hover:bg-primary-500 text-white font-semibold text-lg rounded-xl transition-colors"
      >
        로그인하기
      </button>
    </div>
  );
}
