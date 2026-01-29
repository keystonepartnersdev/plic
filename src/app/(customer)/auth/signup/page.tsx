'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronRight, Eye, EyeOff, Phone, User, Mail, Building2, Upload, X, AlertCircle, FileText, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/common';
import { authAPI } from '@/lib/api';
import { uploadFile, validateFile } from '@/lib/upload';
import { TUserType } from '@/types';
import { cn } from '@/lib/utils';

type Step = 'agreement' | 'phoneVerify' | 'info' | 'businessInfo' | 'complete';

interface Agreement {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

interface KakaoVerificationResult {
  kakaoId: number;
  nickname?: string;
  email?: string;
  verifiedAt: string;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>('agreement');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 약관 동의
  const [agreements, setAgreements] = useState<Agreement[]>([
    { id: 'service', label: '서비스 이용약관 (필수)', required: true, checked: false },
    { id: 'privacy', label: '개인정보 처리방침 (필수)', required: true, checked: false },
    { id: 'thirdParty', label: '제3자 정보제공 동의 (필수)', required: true, checked: false },
    { id: 'marketing', label: '마케팅 정보 수신 동의 (선택)', required: false, checked: false },
  ]);

  // 회원 유형 (사업자 회원만 가입 가능)
  const userType: TUserType = 'business';

  // 카카오 인증 결과
  const [isKakaoVerified, setIsKakaoVerified] = useState(false);
  const [kakaoVerification, setKakaoVerification] = useState<KakaoVerificationResult | null>(null);

  // 회원 정보
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 사업자 정보
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [businessLicenseKey, setBusinessLicenseKey] = useState<string>('');
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string>('');
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // 사업자 인증 상태 (팝빌)
  const [businessVerifying, setBusinessVerifying] = useState(false);
  const [businessVerified, setBusinessVerified] = useState(false);
  const [businessState, setBusinessState] = useState<'01' | '02' | '03' | null>(null); // 01: 사업중, 02: 휴업, 03: 폐업
  const [businessStateName, setBusinessStateName] = useState<string>('');

  // 카카오 인증 결과 처리
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verificationKey = searchParams.get('verificationKey');
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    if (errorParam) {
      setError(errorMessage || '카카오 인증에 실패했습니다.');
      setStep('phoneVerify');
      // URL 파라미터 정리
      router.replace('/auth/signup', { scroll: false });
      return;
    }

    if (verified === 'true' && verificationKey) {
      // 인증 결과 조회
      fetchVerificationResult(verificationKey);
    }
  }, [searchParams]);

  const fetchVerificationResult = async (key: string) => {
    try {
      const response = await fetch(`/api/kakao/result?key=${key}`);
      const data = await response.json();

      if (data.success && data.data) {
        setKakaoVerification(data.data);
        setIsKakaoVerified(true);

        // 카카오에서 가져온 이메일로 자동 채우기
        if (data.data.email) setEmail(data.data.email);

        // info 단계로 이동
        setStep('info');
      }
    } catch (err) {
      console.error('인증 결과 조회 실패:', err);
    }

    // URL 파라미터 정리
    router.replace('/auth/signup', { scroll: false });
  };

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

  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password: string) => {
    // Cognito 정책: 8자 이상, 대문자, 소문자, 숫자, 특수문자 포함
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  };

  const isValidBusinessNumber = (num: string) => {
    const digits = num.replace(/-/g, '');
    return digits.length === 10;
  };

  const canProceedInfo =
    name.length >= 2 &&
    phone.replace(/-/g, '').length === 11 &&
    email.length > 0 &&
    isValidEmail(email) &&
    isValidPassword(password) &&
    password === passwordConfirm &&
    isKakaoVerified;

  const canProceedBusinessInfo =
    businessName.length >= 2 &&
    isValidBusinessNumber(businessNumber) &&
    representativeName.length >= 2 &&
    (businessLicenseKey || businessLicenseFile) &&
    businessVerified &&
    businessState === '01'; // 사업중인 경우만 가입 가능

  // 카카오 본인인증 시작
  const handleKakaoVerification = () => {
    // 카카오 인증 페이지로 리다이렉트
    window.location.href = '/api/kakao/auth?returnTo=/auth/signup';
  };

  // 사업자등록증 파일 선택
  const handleLicenseFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, 10 * 1024 * 1024); // 10MB
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setBusinessLicenseFile(file);

    // 미리보기 생성
    if (file.type.startsWith('image/')) {
      setBusinessLicensePreview(URL.createObjectURL(file));
    } else {
      setBusinessLicensePreview('');
    }

    // S3 업로드
    setUploadingLicense(true);
    try {
      const result = await uploadFile(file, 'business-license');
      setBusinessLicenseKey(result.fileKey);
    } catch (err) {
      console.error('사업자등록증 업로드 실패:', err);
      alert('사업자등록증 업로드에 실패했습니다. 회원가입 시 다시 시도됩니다.');
    } finally {
      setUploadingLicense(false);
    }

    e.target.value = '';
  };

  const removeLicenseFile = () => {
    setBusinessLicenseFile(null);
    setBusinessLicenseKey('');
    if (businessLicensePreview) {
      URL.revokeObjectURL(businessLicensePreview);
      setBusinessLicensePreview('');
    }
  };

  // 사업자등록번호 변경 시 인증 상태 초기화
  const handleBusinessNumberChange = (value: string) => {
    const formatted = formatBusinessNumber(value);
    setBusinessNumber(formatted);
    // 번호 변경 시 인증 상태 초기화
    if (businessVerified) {
      setBusinessVerified(false);
      setBusinessState(null);
      setBusinessStateName('');
    }
  };

  // 사업자 상태 조회 (팝빌 API)
  const handleVerifyBusiness = async () => {
    if (!isValidBusinessNumber(businessNumber)) {
      setError('사업자등록번호 10자리를 입력해주세요.');
      return;
    }

    setBusinessVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/popbill/business/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber: businessNumber.replace(/-/g, '') }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || '사업자 조회에 실패했습니다.');
        setBusinessVerified(false);
        return;
      }

      // 조회 성공
      setBusinessVerified(true);
      setBusinessState(result.data.state);
      setBusinessStateName(result.data.stateName);

      // 휴업/폐업인 경우 에러 메시지 표시
      if (result.data.state === '02') {
        setError('휴업 상태의 사업자는 가입할 수 없습니다.');
      } else if (result.data.state === '03') {
        setError('폐업된 사업자는 가입할 수 없습니다.');
      }
    } catch (err) {
      console.error('사업자 조회 오류:', err);
      setError('사업자 조회 중 오류가 발생했습니다.');
      setBusinessVerified(false);
    } finally {
      setBusinessVerifying(false);
    }
  };

  // 회원가입 API 호출
  const handleSignup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/-/g, '');

      const signupData: Parameters<typeof authAPI.signup>[0] = {
        email,
        password,
        name,
        phone: cleanPhone,
        userType,
        agreements: {
          service: agreements.find((a) => a.id === 'service')?.checked || false,
          privacy: agreements.find((a) => a.id === 'privacy')?.checked || false,
          thirdParty: agreements.find((a) => a.id === 'thirdParty')?.checked || false,
          marketing: agreements.find((a) => a.id === 'marketing')?.checked || false,
        },
        // 카카오 인증 정보 추가
        kakaoVerified: isKakaoVerified,
        kakaoId: kakaoVerification?.kakaoId,
      };

      // 사업자인 경우 사업자 정보 추가
      if (userType === 'business') {
        signupData.businessInfo = {
          businessName,
          businessNumber: businessNumber.replace(/-/g, ''),
          representativeName,
          businessLicenseKey: businessLicenseKey || undefined,
        };
      }

      await authAPI.signup(signupData);

      // 휴대폰 인증 완료 시 이메일 인증 스킵하고 바로 완료
      setStep('complete');
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'phoneVerify') setStep('agreement');
    else if (step === 'info') setStep('phoneVerify');
    else if (step === 'businessInfo') setStep('info');
    else router.back();
  };

  const handleNextFromInfo = () => {
    setStep('businessInfo');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        title="회원가입"
        showBack
        onBack={handleBack}
      />

      <div className="px-5 py-6">
        {/* Step 1: 약관 동의 */}
        {step === 'agreement' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">약관에 동의해주세요</h2>
            <p className="text-gray-500 mb-6">서비스 이용을 위해 약관 동의가 필요합니다.</p>

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
              onClick={() => setStep('phoneVerify')}
              disabled={!allRequiredChecked}
              className="w-full h-14 mt-8 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
            >
              다음
            </button>
          </div>
        )}

        {/* Step 2: 카카오 인증 */}
        {step === 'phoneVerify' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">카카오 인증</h2>
            <p className="text-gray-500 mb-6">서비스 이용을 위해 카카오 계정 인증이 필요합니다.</p>

            {/* 인증 상태 표시 */}
            {isKakaoVerified ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">카카오 인증 완료</p>
                    <p className="text-sm text-green-600">
                      {kakaoVerification?.nickname && `${kakaoVerification.nickname} / `}{kakaoVerification?.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 카카오 인증 버튼 */}
                <button
                  onClick={handleKakaoVerification}
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

            {isKakaoVerified && (
              <button
                onClick={() => setStep('info')}
                className="w-full h-14 mt-6 bg-primary-400 hover:bg-primary-500 text-white font-semibold text-lg rounded-xl transition-colors"
              >
                다음
              </button>
            )}
          </div>
        )}

        {/* Step 3: 회원 정보 입력 */}
        {step === 'info' && (
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {email && !isValidEmail(email) && (
                <p className="text-sm text-red-500 mt-1">올바른 이메일 형식이 아닙니다.</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {password && !isValidPassword(password) && (
                <p className="text-sm text-red-500 mt-1">비밀번호는 8자 이상, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-sm text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-xl mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleNextFromInfo}
              disabled={!canProceedInfo || isLoading}
              className="w-full h-14 mt-4 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
            >
              {isLoading ? '처리 중...' : '다음'}
            </button>
          </div>
        )}

        {/* Step 4: 사업자 정보 입력 */}
        {step === 'businessInfo' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">사업자 정보 입력</h2>
            <p className="text-gray-500 mb-6">사업자등록증 기준으로 정보를 입력해주세요.</p>

            {/* 상호명 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">상호명</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="사업자등록증의 상호명"
                className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>

            {/* 사업자등록번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={businessNumber}
                  onChange={(e) => handleBusinessNumberChange(e.target.value)}
                  placeholder="000-00-00000"
                  maxLength={12}
                  className={cn(
                    "flex-1 h-14 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400",
                    businessVerified && businessState === '01'
                      ? "border-green-300 bg-green-50"
                      : businessVerified && businessState !== '01'
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  )}
                />
                <button
                  type="button"
                  onClick={handleVerifyBusiness}
                  disabled={!isValidBusinessNumber(businessNumber) || businessVerifying || (businessVerified && businessState === '01')}
                  className={cn(
                    "h-14 px-4 font-medium rounded-xl transition-colors whitespace-nowrap",
                    businessVerified && businessState === '01'
                      ? "bg-green-100 text-green-700 cursor-default"
                      : "bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white"
                  )}
                >
                  {businessVerifying ? '확인 중...' : businessVerified && businessState === '01' ? '확인완료' : '사업자 확인'}
                </button>
              </div>
              {businessNumber && !isValidBusinessNumber(businessNumber) && (
                <p className="text-sm text-red-500 mt-1">사업자등록번호 10자리를 입력해주세요.</p>
              )}
              {/* 사업자 상태 표시 */}
              {businessVerified && (
                <div className={cn(
                  "mt-2 p-3 rounded-lg flex items-center gap-2",
                  businessState === '01' ? "bg-green-50" : "bg-red-50"
                )}>
                  {businessState === '01' ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        사업자 상태: {businessStateName}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 font-medium">
                        사업자 상태: {businessStateName} - 가입 불가
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 대표자명 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
              <input
                type="text"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder="대표자 성명"
                className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>

            {/* 사업자등록증 업로드 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록증</label>

              {!businessLicenseFile ? (
                <label className="
                  flex flex-col items-center justify-center
                  w-full h-32
                  border-2 border-dashed border-gray-200 rounded-xl
                  cursor-pointer hover:border-primary-400 transition-colors
                ">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">사업자등록증 업로드</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (10MB 이하)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleLicenseFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-4">
                    {businessLicensePreview ? (
                      <img
                        src={businessLicensePreview}
                        alt="사업자등록증"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{businessLicenseFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(businessLicenseFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {uploadingLicense && (
                        <p className="text-sm text-primary-500">업로드 중...</p>
                      )}
                      {businessLicenseKey && !uploadingLicense && (
                        <p className="text-sm text-green-500">업로드 완료</p>
                      )}
                    </div>
                    <button
                      onClick={removeLicenseFile}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-xl mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleSignup}
              disabled={!canProceedBusinessInfo || isLoading || uploadingLicense}
              className="w-full h-14 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
            >
              {isLoading ? '처리 중...' : '가입하기'}
            </button>
          </div>
        )}

        {/* Step 5: 완료 */}
        {step === 'complete' && (
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
              onClick={() => router.replace('/auth/login')}
              className="w-full h-14 bg-primary-400 hover:bg-primary-500 text-white font-semibold text-lg rounded-xl transition-colors"
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Suspense 바운더리로 감싸서 export
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
