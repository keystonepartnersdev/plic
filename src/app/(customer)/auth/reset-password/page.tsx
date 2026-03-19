'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Header } from '@/components/common';

export default function ResetPasswordPage() {
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">임시 비밀번호 발송 완료</h2>
          <p className="text-gray-500 mb-2">
            입력하신 이메일로 임시 비밀번호를 발송했습니다.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            이메일이 도착하지 않으면 스팸함을 확인해주세요.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-1">보안 안내</p>
            <p className="text-sm text-amber-700">로그인 후 반드시 비밀번호를 변경해주세요.</p>
          </div>
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
      <Header title="비밀번호 찾기" showBack />

      <div className="px-5 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">비밀번호를 잊으셨나요?</h2>
          <p className="text-gray-500">
            가입 시 사용한 이메일을 입력하시면<br />
            임시 비밀번호를 보내드립니다.
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
            {isLoading ? '발송 중...' : '임시 비밀번호 발송'}
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
