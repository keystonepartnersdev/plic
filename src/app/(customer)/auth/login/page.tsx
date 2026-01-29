'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { Header } from '@/components/common';
import { authAPI, tokenManager } from '@/lib/api';
import { useUserStore } from '@/stores';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKakaoUser, setIsKakaoUser] = useState(false);

  // 카카오 인증 결과 처리
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verificationKey = searchParams.get('verificationKey');
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    if (errorParam) {
      setError(errorMessage || '카카오 인증에 실패했습니다.');
      router.replace('/auth/login', { scroll: false });
      return;
    }

    if (verified === 'true' && verificationKey) {
      checkKakaoUser(verificationKey);
    }
  }, [searchParams]);

  // 카카오 인증 후 회원 확인
  const checkKakaoUser = async (key: string) => {
    try {
      // 카카오 인증 결과 조회
      const resultRes = await fetch(`/api/kakao/result?key=${key}`);
      const resultData = await resultRes.json();

      if (!resultData.success || !resultData.data?.email) {
        // 이메일 정보가 없으면 회원가입으로
        router.replace('/auth/signup');
        return;
      }

      const kakaoEmail = resultData.data.email;

      // 회원 존재 여부 확인
      const loginRes = await fetch('/api/auth/kakao-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: kakaoEmail }),
      });
      const loginData = await loginRes.json();

      if (loginData.success && loginData.exists) {
        // 회원이 존재함 - 비밀번호 입력 요청
        setEmail(kakaoEmail);
        setIsKakaoUser(true);
        setError('');
      } else {
        // 회원이 없음 - 회원가입 페이지로 이동 (카카오 인증 정보 유지)
        // 카카오 인증 정보를 sessionStorage에 저장
        sessionStorage.setItem('signup_kakao_verified', 'true');
        sessionStorage.setItem('signup_kakao_data', JSON.stringify(resultData.data));
        sessionStorage.setItem('signup_agreements', JSON.stringify([
          { id: 'service', label: '서비스 이용약관 (필수)', required: true, checked: false },
          { id: 'privacy', label: '개인정보 처리방침 (필수)', required: true, checked: false },
          { id: 'thirdParty', label: '제3자 정보제공 동의 (필수)', required: true, checked: false },
          { id: 'marketing', label: '마케팅 정보 수신 동의 (선택)', required: false, checked: false },
        ]));
        router.replace('/auth/signup');
        return;
      }
    } catch (err) {
      console.error('카카오 로그인 처리 실패:', err);
      setError('카카오 로그인 처리 중 오류가 발생했습니다.');
    }
    router.replace('/auth/login', { scroll: false });
  };

  // 카카오 인증 시작
  const handleKakaoLogin = () => {
    window.location.href = '/api/kakao/auth?returnTo=/auth/login';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('이메일을 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 8자리 이상 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authAPI.login({ email, password });

      // 토큰 저장
      if (result.tokens?.accessToken && result.tokens?.refreshToken) {
        tokenManager.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      }

      // 사용자 정보 저장
      setUser(result.user);

      router.replace('/');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="로그인" showBack />

      <div className="px-5 py-8">
        {/* 로고 - PLIC 디자인 시스템 적용 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gradient mb-2">PLIC</h1>
          <p className="text-gray-500 font-medium">카드로 결제, 계좌로 송금</p>
        </div>

        {/* 카카오 회원 안내 */}
        {isKakaoUser && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <p className="text-sm text-yellow-800 font-medium">
              카카오 계정({email})으로 가입된 회원입니다.<br />
              비밀번호를 입력해주세요.
            </p>
          </div>
        )}

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
                readOnly={isKakaoUser}
                className={`w-full h-14 pl-12 pr-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] text-lg transition-all duration-300 ${isKakaoUser ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus={isKakaoUser}
                className="w-full h-14 pl-4 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] text-lg transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-14 mt-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/30 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-full transition-all duration-300"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-sm text-gray-400 font-medium">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full h-14 bg-[#FEE500] text-gray-900 font-semibold rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.035 5.906l-.857 3.179c-.058.215.189.39.379.27l3.746-2.357c.883.142 1.79.218 2.697.218 5.523 0 10-3.477 10-7.716S17.523 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </button>
          <button
            type="button"
            disabled
            className="w-full h-14 bg-[#03C75A] text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 opacity-50 cursor-not-allowed"
          >
            <span className="text-lg font-bold">N</span>
            네이버로 시작하기 (준비중)
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-medium">
            아직 회원이 아니신가요?{' '}
            <Link href="/auth/signup" className="text-[#2563EB] font-semibold hover:text-[#1d4ed8] transition-colors duration-300">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
