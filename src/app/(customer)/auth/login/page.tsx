'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Phone } from 'lucide-react';
import { Header, Modal } from '@/components/common';
import { useUserStore } from '@/stores';
import { UserHelper } from '@/classes';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, users } = useUserStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWithdrawnModal, setShowWithdrawnModal] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspendedUserName, setSuspendedUserName] = useState('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanPhone = phone.replace(/-/g, '');
    if (cleanPhone.length !== 11) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('비밀번호를 4자리 이상 입력해주세요.');
      setIsLoading(false);
      return;
    }

    const existingUser = users.find((u) => u.phone === cleanPhone);

    if (existingUser && existingUser.status === 'withdrawn') {
      setIsLoading(false);
      setShowWithdrawnModal(true);
      return;
    }

    if (existingUser) {
      setUser({
        ...existingUser,
        lastLoginAt: new Date().toISOString(),
      });

      if (existingUser.status === 'suspended') {
        setSuspendedUserName(existingUser.name);
        setShowSuspendedModal(true);
        setIsLoading(false);
        return;
      }
    } else {
      const gradeConfig = UserHelper.GRADE_CONFIG['basic'];
      const now = new Date().toISOString();

      const mockUser = {
        uid: UserHelper.generateUID(),
        name: '테스트 사용자',
        phone: cleanPhone,
        authType: 'direct' as const,
        socialProvider: null,
        isVerified: true,
        verifiedAt: now,
        status: 'active' as const,
        grade: 'basic' as const,
        feeRate: gradeConfig.feeRate,
        monthlyLimit: gradeConfig.monthlyLimit,
        usedAmount: 0,
        agreements: {
          service: true,
          privacy: true,
          thirdParty: true,
          marketing: false,
        },
        totalPaymentAmount: 0,
        totalDealCount: 0,
        lastMonthPaymentAmount: 0,
        isGradeManual: false,
        history: [],
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      setUser(mockUser);
    }

    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="로그인" showBack />

      <div className="px-5 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary-400 mb-2">PLIC</h1>
          <p className="text-gray-500">카드로 결제, 계좌로 송금</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              휴대폰 번호
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000"
                maxLength={13}
                className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full h-14 pl-4 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !phone || !password}
            className="w-full h-14 mt-4 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-sm text-gray-400">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="space-y-3">
          <button className="w-full h-14 bg-[#FEE500] text-gray-900 font-medium rounded-xl flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.035 5.906l-.857 3.179c-.058.215.189.39.379.27l3.746-2.357c.883.142 1.79.218 2.697.218 5.523 0 10-3.477 10-7.716S17.523 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </button>
          <button className="w-full h-14 bg-[#03C75A] text-white font-medium rounded-xl flex items-center justify-center gap-2">
            <span className="text-lg font-bold">N</span>
            네이버로 시작하기
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            아직 회원이 아니신가요?{' '}
            <Link href="/auth/signup" className="text-primary-400 font-medium">
              회원가입
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-500">
            테스트: 아무 번호(11자리) + 비밀번호(4자리 이상) 입력
          </p>
        </div>
      </div>

      <Modal isOpen={showWithdrawnModal} onClose={() => setShowWithdrawnModal(false)} title="로그인 불가">
        <p>탈퇴 회원입니다.</p>
      </Modal>

      <Modal
        isOpen={showSuspendedModal}
        onClose={() => {
          setShowSuspendedModal(false);
          router.replace('/');
        }}
        title="계정 상태 안내"
      >
        <p>
          죄송합니다. 현재 <strong className="text-gray-900">{suspendedUserName}</strong>님의 계정은{' '}
          <strong className="text-gray-900">정지</strong> 처리되었습니다. 원활한 서비스 이용을 위하여 고객센터로 문의주시면 친절하게 답변드리겠습니다.
        </p>
      </Modal>
    </div>
  );
}
