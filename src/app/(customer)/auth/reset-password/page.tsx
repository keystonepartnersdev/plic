'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/common';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // 토큰이 있으면 새 비밀번호 입력 화면, 없으면 이메일 입력 화면
  if (token) {
    return <NewPasswordForm token={token} />;
  }
  return <EmailRequestForm />;
}

// Step 1: 이메일 입력 → 인증 링크 요청
function EmailRequestForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '비밀번호 재설정에 실패했습니다.');
        return;
      }

      setIsSent(true);
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="비밀번호 찾기" showBack />
        <div className="px-5 py-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">이메일을 확인해주세요</h2>
          <p className="text-gray-500 mb-2">
            입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            이메일이 도착하지 않으면 스팸함을 확인해주세요.<br />
            링크는 30분간 유효합니다.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full h-14 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold text-lg rounded-full"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="비밀번호 찾기" showBack />

      <div className="px-5 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">비밀번호를 잊으셨나요?</h2>
          <p className="text-gray-500">
            가입 시 사용한 이메일을 입력하시면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] text-lg transition-all duration-300"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full h-14 mt-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/30 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-full transition-all duration-300"
          >
            {isLoading ? '발송 중...' : '재설정 링크 발송'}
          </button>
        </form>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 mx-auto mt-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">로그인으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
}

// Step 2: 이메일 링크 클릭 후 → 새 비밀번호 입력
function NewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // 비밀번호 유효성 체크
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;
  const isConfirmMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('비밀번호 조건을 모두 충족해주세요.');
      return;
    }

    if (!isConfirmMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '비밀번호 변경에 실패했습니다.');
        return;
      }

      setIsComplete(true);
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="비밀번호 재설정" />
        <div className="px-5 py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">비밀번호 변경 완료</h2>
          <p className="text-gray-500 mb-8">
            새 비밀번호로 로그인해주세요.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full h-14 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold text-lg rounded-full"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="비밀번호 재설정" />

      <div className="px-5 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">새 비밀번호 설정</h2>
          <p className="text-gray-500">
            사용할 새 비밀번호를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력"
                className="w-full h-14 pl-12 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] text-lg transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* 비밀번호 조건 표시 */}
            {newPassword.length > 0 && (
              <div className="mt-3 space-y-1">
                <PasswordRule ok={hasMinLength} text="8자 이상" />
                <PasswordRule ok={hasUpper} text="대문자 포함" />
                <PasswordRule ok={hasLower} text="소문자 포함" />
                <PasswordRule ok={hasDigit} text="숫자 포함" />
                <PasswordRule ok={hasSpecial} text="특수문자 포함 (!@#$%^&*)" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호 확인</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 다시 입력"
                className="w-full h-14 pl-12 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] text-lg transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !isConfirmMatch && (
              <p className="text-sm text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
            {isConfirmMatch && (
              <p className="text-sm text-green-600 mt-1">비밀번호가 일치합니다.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !isConfirmMatch}
            className="w-full h-14 mt-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/30 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-full transition-all duration-300"
          >
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 비밀번호 조건 체크 컴포넌트
function PasswordRule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-green-100' : 'bg-gray-100'}`}>
        {ok ? (
          <CheckCircle className="w-3 h-3 text-green-600" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        )}
      </div>
      <span className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>{text}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
