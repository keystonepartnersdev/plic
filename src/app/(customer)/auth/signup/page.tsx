'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronRight, Eye, EyeOff, Phone, User, Mail } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { UserHelper } from '@/classes';
import { cn } from '@/lib/utils';

type Step = 'agreement' | 'phone' | 'info' | 'complete';

interface Agreement {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useUserStore();

  const [step, setStep] = useState<Step>('agreement');
  const [isLoading, setIsLoading] = useState(false);

  // 약관 동의
  const [agreements, setAgreements] = useState<Agreement[]>([
    { id: 'service', label: '서비스 이용약관 (필수)', required: true, checked: false },
    { id: 'privacy', label: '개인정보 처리방침 (필수)', required: true, checked: false },
    { id: 'thirdParty', label: '제3자 정보제공 동의 (필수)', required: true, checked: false },
    { id: 'marketing', label: '마케팅 정보 수신 동의 (선택)', required: false, checked: false },
  ]);

  // 본인인증
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // 회원 정보
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const allRequiredChecked = agreements.filter((a) => a.required).every((a) => a.checked);
  const allChecked = agreements.every((a) => a.checked);

  const toggleAll = () => {
    const newChecked = !allChecked;
    setAgreements(agreements.map((a) => ({ ...a, checked: newChecked })));
  };

  const toggleOne = (id: string) => {
    setAgreements(agreements.map((a) => (a.id === id ? { ...a, checked: !a.checked } : a)));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSendCode = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsCodeSent(true);
    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Mock: 아무 코드나 입력하면 인증됨
    if (verificationCode.length === 6) {
      setIsVerified(true);
    }
    setIsLoading(false);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const gradeConfig = UserHelper.GRADE_CONFIG['basic'];
    const now = new Date().toISOString();
    const cleanPhone = phone.replace(/-/g, '');

    const newUser = {
      uid: UserHelper.generateUID(),
      email,
      name,
      phone: cleanPhone,
      password,
      authType: 'direct' as const,
      socialProvider: null,
      isVerified: true,
      verifiedAt: now,
      status: 'active' as const,
      grade: 'basic' as const,
      feeRate: gradeConfig.feeRate,
      monthlyLimit: gradeConfig.monthlyLimit,
      usedAmount: 0,
      lastMonthPaymentAmount: 0,
      isGradeManual: false,
      agreements: {
        service: agreements.find((a) => a.id === 'service')?.checked || false,
        privacy: agreements.find((a) => a.id === 'privacy')?.checked || false,
        thirdParty: agreements.find((a) => a.id === 'thirdParty')?.checked || false,
        marketing: agreements.find((a) => a.id === 'marketing')?.checked || false,
      },
      totalPaymentAmount: 0,
      totalDealCount: 0,
      history: [],
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    setUser(newUser);
    setStep('complete');
    setIsLoading(false);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canProceedInfo =
    name.length >= 2 &&
    email.length > 0 &&
    isValidEmail(email) &&
    password.length >= 6 &&
    password === passwordConfirm;

  return (
    <div className="min-h-screen bg-white">
      <Header
        title="회원가입"
        showBack
        onBack={() => {
          if (step === 'phone') setStep('agreement');
          else if (step === 'info') setStep('phone');
          else router.back();
        }}
      />

      <div className="px-5 py-6">
        {/* Step 1: 약관 동의 */}
        {step === 'agreement' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">약관에 동의해주세요</h2>
            <p className="text-gray-500 mb-6">서비스 이용을 위해 약관 동의가 필요합니다.</p>

            {/* 전체 동의 */}
            <button
              onClick={toggleAll}
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

            {/* 개별 동의 */}
            <div className="space-y-2">
              {agreements.map((agreement) => (
                <div key={agreement.id} className="flex items-center justify-between p-3">
                  <button
                    onClick={() => toggleOne(agreement.id)}
                    className="flex items-center gap-3"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded flex items-center justify-center',
                      agreement.checked ? 'bg-primary-400' : 'border-2 border-gray-300'
                    )}>
                      {agreement.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn(
                      'text-sm',
                      agreement.required ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {agreement.label}
                    </span>
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('phone')}
              disabled={!allRequiredChecked}
              className="
                w-full h-14 mt-8
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              다음
            </button>
          </div>
        )}

        {/* Step 2: 본인인증 */}
        {step === 'phone' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">본인인증</h2>
            <p className="text-gray-500 mb-6">휴대폰 번호로 본인인증을 진행합니다.</p>

            {/* 휴대폰 번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                휴대폰 번호
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    disabled={isCodeSent}
                    className="
                      w-full h-14 pl-12 pr-4
                      border border-gray-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                      disabled:bg-gray-50
                    "
                  />
                </div>
                <button
                  onClick={handleSendCode}
                  disabled={phone.replace(/-/g, '').length !== 11 || isCodeSent || isLoading}
                  className="
                    h-14 px-4
                    bg-gray-900 text-white font-medium
                    rounded-xl
                    disabled:bg-gray-200 disabled:text-gray-400
                    whitespace-nowrap
                  "
                >
                  {isCodeSent ? '재전송' : '인증요청'}
                </button>
              </div>
            </div>

            {/* 인증번호 */}
            {isCodeSent && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  인증번호
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6자리 입력"
                    maxLength={6}
                    disabled={isVerified}
                    className="
                      flex-1 h-14 px-4
                      border border-gray-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                      disabled:bg-gray-50
                      text-center text-xl tracking-widest
                    "
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || isVerified || isLoading}
                    className="
                      h-14 px-4
                      bg-gray-900 text-white font-medium
                      rounded-xl
                      disabled:bg-gray-200 disabled:text-gray-400
                    "
                  >
                    {isVerified ? '인증완료' : '확인'}
                  </button>
                </div>
                {!isVerified && (
                  <p className="text-sm text-gray-500 mt-2">
                    테스트: 아무 6자리 숫자 입력
                  </p>
                )}
              </div>
            )}

            {isVerified && (
              <div className="p-4 bg-green-50 rounded-xl mb-6">
                <p className="text-green-700 font-medium flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  본인인증이 완료되었습니다.
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('info')}
              disabled={!isVerified}
              className="
                w-full h-14 mt-4
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              다음
            </button>
          </div>
        )}

        {/* Step 3: 회원 정보 */}
        {step === 'info' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">회원 정보 입력</h2>
            <p className="text-gray-500 mb-6">서비스 이용에 필요한 정보를 입력해주세요.</p>

            {/* 이름 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명 입력"
                  className="
                    w-full h-14 pl-12 pr-4
                    border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  "
                />
              </div>
            </div>

            {/* 이메일 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="
                    w-full h-14 pl-12 pr-4
                    border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  "
                />
              </div>
              {email && !isValidEmail(email) && (
                <p className="text-sm text-red-500 mt-1">올바른 이메일 형식이 아닙니다.</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자리 이상"
                  className="
                    w-full h-14 pl-4 pr-12
                    border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  "
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

            {/* 비밀번호 확인 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                className="
                  w-full h-14 px-4
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                "
              />
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-sm text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <button
              onClick={handleComplete}
              disabled={!canProceedInfo || isLoading}
              className="
                w-full h-14 mt-4
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              {isLoading ? '가입 중...' : '가입 완료'}
            </button>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">가입 완료!</h2>
            <p className="text-gray-500 mb-8">
              {name}님, PLIC 가입을 환영합니다.<br />
              지금 바로 서비스를 이용해보세요.
            </p>
            <button
              onClick={() => router.replace('/')}
              className="
                w-full h-14
                bg-primary-400 hover:bg-primary-500
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
