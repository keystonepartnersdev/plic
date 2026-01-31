'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { Header } from '@/components/common';
import { authAPI, tokenManager } from '@/lib/api';
import { useUserStore } from '@/stores';

// 카카오 ID로부터 결정적 비밀번호 생성 (회원가입과 동일한 로직)
const generateKakaoPassword = (kakaoId: number): string => {
  const idStr = kakaoId.toString(16).padStart(12, '0');
  return `Kk${idStr.substring(0, 10)}Px1!`;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kakaoAutoLoginStatus, setKakaoAutoLoginStatus] = useState<string>('');

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
      handleKakaoAutoLogin(verificationKey);
    }
  }, [searchParams]);

  // 카카오 자동 로그인 처리
  const handleKakaoAutoLogin = async (key: string) => {
    setKakaoAutoLoginStatus('카카오 인증 확인 중...');
    setError('');

    try {
      // DynamoDB에서 카카오 인증 결과 조회
      const resultRes = await fetch(`/api/kakao/result?key=${key}`);
      const resultData = await resultRes.json();

      if (!resultData.success || !resultData.data?.email || !resultData.data?.kakaoId) {
        setError('카카오 인증 정보를 가져올 수 없습니다.');
        router.replace('/auth/login', { scroll: false });
        return;
      }

      const kakaoEmail = resultData.data.email;
      const kakaoId = resultData.data.kakaoId;

      setKakaoAutoLoginStatus('회원 정보 확인 중...');

      // 회원 존재 여부 및 완전 가입 여부 확인
      const checkRes = await fetch('/api/auth/kakao-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: kakaoEmail, kakaoId }),
      });
      const checkData = await checkRes.json();

      if (!checkData.success) {
        setError(checkData.error || '회원 확인에 실패했습니다.');
        router.replace('/auth/login', { scroll: false });
        return;
      }

      // 회원이 존재하고 완전히 가입된 경우 - 자동 로그인
      if (checkData.exists && !checkData.incomplete) {
        setKakaoAutoLoginStatus('자동 로그인 중...');

        // 결정적 비밀번호 생성
        const kakaoPassword = generateKakaoPassword(kakaoId);

        try {
          // 일반 로그인 API 호출
          const loginResult = await authAPI.login({
            email: kakaoEmail,
            password: kakaoPassword,
          });

          // 사용자 정보 저장
          setUser(loginResult.user);

          setKakaoAutoLoginStatus('로그인 성공! 이동 중...');

          // 홈으로 이동
          router.replace('/');
          return;
        } catch (loginErr: any) {
          console.error('카카오 자동 로그인 실패:', loginErr);
          // 비밀번호가 맞지 않는 경우 (기존 회원이 일반 가입한 경우)
          setError('카카오 계정으로 가입된 회원이 아닙니다. 이메일/비밀번호로 로그인해주세요.');
          setEmail(kakaoEmail);
          router.replace('/auth/login', { scroll: false });
          return;
        }
      }

      // 가입이 완료되지 않은 경우 (이메일 미인증) - 카카오 사용자는 로그인 시도
      if (checkData.incomplete) {
        setKakaoAutoLoginStatus('카카오 인증 사용자 로그인 시도 중...');

        // 카카오 인증 사용자이므로 결정적 비밀번호로 로그인 시도
        const kakaoPassword = generateKakaoPassword(kakaoId);

        try {
          const loginResult = await authAPI.login({
            email: kakaoEmail,
            password: kakaoPassword,
          });

          setUser(loginResult.user);
          setKakaoAutoLoginStatus('로그인 성공! 이동 중...');
          router.replace('/');
          return;
        } catch (incompleteLoginErr: any) {
          console.error('미인증 사용자 로그인 실패:', incompleteLoginErr);
          setKakaoAutoLoginStatus('');
          // 이메일 인증이 필요한 경우
          setError('이메일 인증이 필요합니다. 가입 시 입력한 이메일의 인증 링크를 확인해주세요. (인증 메일 발송까지 최대 5분 소요)');
          setEmail(kakaoEmail);
          router.replace('/auth/login', { scroll: false });
          return;
        }
      }

      // 회원이 없는 경우 - 회원가입 페이지로 카카오 인증 데이터와 함께 이동
      // verificationKey를 그대로 전달하여 회원가입에서 다시 인증하지 않아도 됨
      setKakaoAutoLoginStatus('신규 회원입니다. 회원가입 페이지로 이동...');
      router.replace(`/auth/signup?verified=true&verificationKey=${key}&fromLogin=true`);
      return;
    } catch (err) {
      console.error('카카오 로그인 처리 실패:', err);
      setError('카카오 로그인 처리 중 오류가 발생했습니다.');
      router.replace('/auth/login', { scroll: false });
    } finally {
      setKakaoAutoLoginStatus('');
    }
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

  // 카카오 자동 로그인 중 로딩 화면
  if (kakaoAutoLoginStatus) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mb-4" />
        <p className="text-gray-600 font-medium">{kakaoAutoLoginStatus}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="로그인" showBack />

      <div className="px-5 py-8">
        {/* 로고 - PLIC 디자인 시스템 적용 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gradient mb-2">PLIC</h1>
          <p className="text-gray-500 font-medium">카드로 송금하다</p>
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

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
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
