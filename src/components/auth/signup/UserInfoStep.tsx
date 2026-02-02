'use client';

// src/components/auth/signup/UserInfoStep.tsx
// Step 3: 회원 정보 입력

import { User, Phone, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UserInfoStepProps } from './types';
import { formatPhone, isValidEmail, isValidPassword } from './utils';

export function UserInfoStep({
  userInfo,
  onUserInfoChange,
  isKakaoVerified,
  kakaoVerification,
  error,
  isLoading,
  canProceed,
  onNext,
}: UserInfoStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">회원 정보 입력</h2>
      <p className="text-gray-500 mb-6">서비스 이용에 필요한 정보를 입력해주세요.</p>

      {/* 카카오 인증 완료 표시 */}
      {isKakaoVerified && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-xl mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">카카오 인증 완료</span>
        </div>
      )}

      {/* 이름 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={userInfo.name}
            onChange={(e) => onUserInfoChange('name', e.target.value)}
            placeholder="실명 입력"
            className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
          />
        </div>
      </div>

      {/* 휴대폰 번호 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => onUserInfoChange('phone', formatPhone(e.target.value))}
            placeholder="010-0000-0000"
            maxLength={13}
            className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
          />
        </div>
      </div>

      {/* 이메일 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => onUserInfoChange('email', e.target.value)}
            placeholder="example@email.com"
            readOnly={isKakaoVerified && !!kakaoVerification?.email}
            className={cn(
              "w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400",
              isKakaoVerified && kakaoVerification?.email && "bg-gray-50 text-gray-600"
            )}
          />
        </div>
        {isKakaoVerified && kakaoVerification?.email && (
          <p className="text-xs text-gray-400 mt-1">카카오 계정 이메일입니다.</p>
        )}
        {userInfo.email && !isValidEmail(userInfo.email) && (
          <p className="text-sm text-red-500 mt-1">올바른 이메일 형식이 아닙니다.</p>
        )}
      </div>

      {/* 비밀번호 - 카카오 인증 시 자동 생성 */}
      {kakaoVerification?.kakaoId ? (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-700 font-medium">
            카카오 계정으로 로그인하시면 별도 비밀번호가 필요 없습니다.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            카카오 인증으로 자동 로그인됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={userInfo.password}
                onChange={(e) => onUserInfoChange('password', e.target.value)}
                placeholder="8자리 이상"
                className="w-full h-14 pl-4 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {userInfo.password && !isValidPassword(userInfo.password) && (
              <p className="text-sm text-red-500 mt-1">비밀번호는 8자 이상, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
            <input
              type="password"
              value={userInfo.passwordConfirm}
              onChange={(e) => onUserInfoChange('passwordConfirm', e.target.value)}
              placeholder="비밀번호 재입력"
              className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
            {userInfo.passwordConfirm && userInfo.password !== userInfo.passwordConfirm && (
              <p className="text-sm text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="p-3 bg-red-50 rounded-xl mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed || isLoading}
        className="w-full h-14 mt-4 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
      >
        {isLoading ? '처리 중...' : '다음'}
      </button>
    </div>
  );
}
