'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, Check, Building, Upload, AlertCircle, Clock, FileText, Lock, Eye, EyeOff, KeyRound, ChevronDown } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { usersAPI, uploadsAPI } from '@/lib/api';
import { secureAuth } from '@/lib/auth';
import { cn, getErrorMessage } from '@/lib/utils';

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, updateUser, _hasHydrated } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [originalData, setOriginalData] = useState({
    name: '',
    phone: '',
  });

  // 비밀번호 변경 상태
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 사업자등록증 재제출 상태
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email || '',
        phone: currentUser.phone,
      });
      setOriginalData({
        name: currentUser.name,
        phone: currentUser.phone,
      });
    }
  }, [currentUser]);

  // 비밀번호 유효성 검사
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordFormValid = currentPassword.length > 0 && hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;
  const isKakaoUser = currentUser?.socialProvider === 'kakao';

  // 변경사항 있는지 확인 (개인정보 또는 비밀번호)
  const isPhoneLocked = isKakaoUser || !!currentUser?.kakaoNickname;
  const hasProfileChanges = formData.name !== originalData.name || (!isPhoneLocked && formData.phone !== originalData.phone);
  const hasPasswordInput = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;
  const hasChanges = hasProfileChanges || (hasPasswordInput && isPasswordFormValid);

  useEffect(() => {
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, _hasHydrated, isLoggedIn, router]);

  if (!mounted || !_hasHydrated || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setPasswordError(null);

    try {
      // 1) 개인정보 변경사항이 있으면 저장
      if (hasProfileChanges) {
        await usersAPI.updateMe({
          name: formData.name,
          phone: formData.phone,
        });

        updateUser({
          name: formData.name,
          phone: formData.phone,
        });

        setOriginalData({
          name: formData.name,
          phone: formData.phone,
        });
      }

      // 2) 비밀번호 입력이 있고 유효하면 변경
      if (hasPasswordInput && isPasswordFormValid) {
        if (currentPassword === newPassword) {
          setPasswordError('새 비밀번호가 현재 비밀번호와 같습니다.');
          setIsSaving(false);
          return;
        }

        await secureAuth.changePassword(currentPassword, newPassword);
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordSection(false);
        }, 2000);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      const message = getErrorMessage(err) || '저장 중 오류가 발생했습니다.';
      // 비밀번호 관련 에러는 비밀번호 섹션에 표시
      if (hasPasswordInput && message.includes('비밀번호')) {
        setPasswordError(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setResubmitError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setResubmitError('JPG, PNG, GIF, PDF 파일만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);
    setResubmitError(null);
  };

  // 사업자등록증 재제출
  const handleResubmitBusiness = async () => {
    if (!selectedFile) {
      setResubmitError('사업자등록증 파일을 선택해주세요.');
      return;
    }

    setIsResubmitting(true);
    setResubmitError(null);

    try {
      setIsUploadingLicense(true);
      const presigned = await uploadsAPI.getPresignedUrl({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        uploadType: 'business-license',
      });

      await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });
      setIsUploadingLicense(false);

      await usersAPI.resubmitBusinessVerification(presigned.fileKey);

      updateUser({
        businessInfo: {
          ...currentUser.businessInfo!,
          businessLicenseKey: presigned.fileKey,
          verificationStatus: 'pending',
          verificationMemo: undefined,
        },
        status: 'pending_verification',
      });

      setSelectedFile(null);
      setResubmitSuccess(true);
      setTimeout(() => setResubmitSuccess(false), 3000);
    } catch (err: unknown) {
      setResubmitError(getErrorMessage(err) || '재제출 중 오류가 발생했습니다.');
    } finally {
      setIsResubmitting(false);
      setIsUploadingLicense(false);
    }
  };

  const businessInfo = currentUser.businessInfo;
  const verificationStatus = businessInfo?.verificationStatus;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header title="개인정보 수정" showBack />

      <div className="p-5 space-y-4">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl p-4">
          {/* 카카오 이름 (수정 불가) */}
          {currentUser.kakaoNickname && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">카카오 이름</p>
                <p className="font-medium text-gray-900">{currentUser.kakaoNickname}</p>
                <p className="text-xs text-gray-400">카카오 인증 정보로 변경할 수 없습니다</p>
              </div>
            </div>
          )}

          <div className={cn("flex items-center gap-3 mb-4", currentUser.kakaoNickname && "pt-4 border-t border-gray-100")}>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">실명</p>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="font-medium text-gray-900 bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="font-medium text-gray-900">{formData.email}</p>
              <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            {isKakaoUser || currentUser.kakaoNickname ? (
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="font-medium text-gray-900">{formData.phone}</p>
                <p className="text-xs text-gray-400">카카오 인증 정보로 변경할 수 없습니다</p>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-sm text-gray-500">전화번호</p>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="font-medium text-gray-900 bg-transparent border-none outline-none w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* 비밀번호 변경 섹션 - 카카오 로그인 사용자는 숨김 */}
        {!isKakaoUser && (
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-500">비밀번호</p>
                  <p className="font-medium text-gray-900">비밀번호 변경</p>
                </div>
              </div>
              <ChevronDown className={cn(
                'w-5 h-5 text-gray-400 transition-transform duration-300',
                showPasswordSection && 'rotate-180'
              )} />
            </button>

            {showPasswordSection && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                {/* 현재 비밀번호 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">현재 비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                      placeholder="현재 비밀번호"
                      className="w-full h-11 pl-9 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 새 비밀번호 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                      placeholder="새 비밀번호"
                      className="w-full h-11 pl-9 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      <PwReq met={hasMinLength} text="8자 이상" />
                      <PwReq met={hasUppercase} text="대문자" />
                      <PwReq met={hasLowercase} text="소문자" />
                      <PwReq met={hasNumber} text="숫자" />
                    </div>
                  )}
                </div>

                {/* 새 비밀번호 확인 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호 확인</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                      placeholder="새 비밀번호 확인"
                      className={cn(
                        'w-full h-11 pl-9 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all',
                        confirmPassword.length > 0 && !passwordsMatch
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500/20 focus:border-[#2563EB]'
                      )}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
                  )}
                  {passwordsMatch && (
                    <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> 일치합니다
                    </p>
                  )}
                </div>

                {passwordError && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-600 p-2.5 rounded-lg text-xs">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-600 p-2.5 rounded-lg text-xs">
                    <Check className="w-3.5 h-3.5" />
                    비밀번호가 변경되었습니다
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 인증 상태 */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">인증 상태</p>
              <p className="font-medium text-gray-900">
                {currentUser.isVerified ? '인증완료' : '미인증'}
              </p>
            </div>
          </div>
        </div>

        {/* 사업자 인증 섹션 */}
        {currentUser.userType === 'business' && businessInfo && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">사업자 인증</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {businessInfo.businessName}
                  </p>
                  {verificationStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      <Check className="w-3 h-3" />
                      승인
                    </span>
                  )}
                  {verificationStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                      <Clock className="w-3 h-3" />
                      심사중
                    </span>
                  )}
                  {verificationStatus === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      <AlertCircle className="w-3 h-3" />
                      거절
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1 mb-3 pl-[52px]">
              <p>사업자등록번호: {businessInfo.businessNumber}</p>
              <p>대표자: {businessInfo.representativeName}</p>
            </div>

            {verificationStatus === 'rejected' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {businessInfo.verificationMemo && (
                  <div className="bg-red-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-red-700 mb-1">거절 사유</p>
                    <p className="text-sm text-red-600">{businessInfo.verificationMemo}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    사업자등록증을 다시 첨부해주세요
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isResubmitting}
                    className="w-full flex items-center justify-center gap-2 h-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-400 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-5 h-5" />
                    {selectedFile ? selectedFile.name : '파일 선택'}
                  </button>

                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{selectedFile.name}</span>
                      <span className="text-gray-400 flex-shrink-0">
                        ({(selectedFile.size / 1024).toFixed(0)}KB)
                      </span>
                    </div>
                  )}

                  {resubmitError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {resubmitError}
                    </div>
                  )}

                  {resubmitSuccess && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      재제출이 완료되었습니다. 심사 후 결과를 알려드리겠습니다.
                    </div>
                  )}

                  <button
                    onClick={handleResubmitBusiness}
                    disabled={!selectedFile || isResubmitting}
                    className={cn(
                      'w-full h-12 rounded-xl font-semibold transition-colors',
                      !selectedFile || isResubmitting
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-400 text-white hover:bg-primary-500'
                    )}
                  >
                    {isUploadingLicense
                      ? '파일 업로드 중...'
                      : isResubmitting
                        ? '재심사 요청 중...'
                        : '재심사 요청'}
                  </button>
                </div>
              </div>
            )}

            {verificationStatus === 'pending' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    사업자 인증 심사가 진행중입니다. 심사 완료 시 알려드리겠습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            저장되었습니다.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={cn(
            'w-full py-4 rounded-xl font-semibold transition-colors',
            isSaving || !hasChanges
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-primary-400 text-white hover:bg-primary-500'
          )}
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}

function PwReq({ met, text }: { met: boolean; text: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', met ? 'text-green-500' : 'text-gray-400')}>
      {met ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" />}
      {text}
    </span>
  );
}
