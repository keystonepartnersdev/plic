'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminStore } from '@/stores';

type VerifyStatus = 'loading' | 'success' | 'error';

function TedosAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAdminFromResponse } = useAdminStore();

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('토큰이 제공되지 않았습니다.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('https://tedos.keystonepartners.co.kr/api/admin/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setStatus('error');
          setErrorMessage(data.error || '토큰 검증에 실패했습니다.');
          return;
        }

        // 인증 성공 - localStorage + 세션 쿠키 설정
        localStorage.setItem('plic_admin_token', data.token);
        document.cookie = 'plic_admin_session=true; path=/; max-age=86400; SameSite=Lax';
        setAdminFromResponse(data.admin, data.token);

        setStatus('success');
        router.replace('/admin');
      } catch {
        setStatus('error');
        setErrorMessage('TEDOS Cloud 서버에 연결할 수 없습니다.');
      }
    };

    verifyToken();
  }, [searchParams, setAdminFromResponse, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gradient mb-2">PLIC Admin</h1>
          <p className="text-gray-500 font-medium">TEDOS Cloud 인증</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* 로딩 */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
              <p className="text-gray-500 font-medium">인증 확인 중...</p>
            </div>
          )}

          {/* 성공 (리다이렉트 대기) */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
              <p className="text-gray-500 font-medium">로그인 완료. 이동 중...</p>
            </div>
          )}

          {/* 에러 */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 mb-1">유효하지 않은 접근입니다</p>
                <p className="text-sm text-gray-500">{errorMessage}</p>
              </div>
              <a
                href="https://tedos.keystonepartners.co.kr"
                className="
                  w-full h-12 flex items-center justify-center
                  bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/30
                  text-white font-semibold
                  rounded-full
                  transition-all duration-300
                "
              >
                TEDOS Cloud로 이동
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TedosAuthPage() {
  return (
    <Suspense>
      <TedosAuthContent />
    </Suspense>
  );
}
