'use client';

// src/components/auth/signup/KakaoVerifyStep.tsx
// Step 2: 카카오 인증

import { ShieldCheck } from 'lucide-react';
import { KakaoVerifyStepProps } from './types';

export function KakaoVerifyStep({
  isVerified,
  verification,
  error,
  onVerify,
  onNext,
}: KakaoVerifyStepProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">카카오 인증</h2>
      <p className="text-gray-500 mb-6">서비스 이용을 위해 카카오 계정 인증이 필요합니다.</p>

      {/* 인증 상태 표시 */}
      {isVerified ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">카카오 인증 완료</p>
              <p className="text-sm text-green-600">
                {verification?.nickname && `${verification.nickname} / `}{verification?.email}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 카카오 인증 버튼 */}
          <button
            type="button"
            onClick={onVerify}
            className="w-full h-14 bg-[#FEE500] hover:bg-[#FDD835] text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.035 5.906l-.857 3.179c-.058.215.189.39.379.27l3.746-2.357c.883.142 1.79.218 2.697.218 5.523 0 10-3.477 10-7.716S17.523 3 12 3z"/>
            </svg>
            카카오로 인증하기
          </button>

          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              카카오 계정으로 간편하게 인증을 진행할 수 있습니다.
              인증 후 이메일이 자동으로 입력됩니다.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 rounded-xl mt-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isVerified && (
        <button
          onClick={onNext}
          className="w-full h-14 mt-6 bg-primary-400 hover:bg-primary-500 text-white font-semibold text-lg rounded-xl transition-colors"
        >
          다음
        </button>
      )}
    </div>
  );
}
