'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, Check, Building, Upload, AlertCircle, Clock, FileText } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { usersAPI, uploadsAPI } from '@/lib/api';
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

  // 변경사항 있는지 확인
  const hasChanges = formData.name !== originalData.name || formData.phone !== originalData.phone;

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

    try {
      const response = await usersAPI.updateMe({
        name: formData.name,
        phone: formData.phone,
      });

      updateUser({
        name: formData.name,
        phone: formData.phone,
      });

      // 저장 후 원본 데이터 업데이트
      setOriginalData({
        name: formData.name,
        phone: formData.phone,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setResubmitError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 확인
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
      // 1. Presigned URL 요청
      setIsUploadingLicense(true);
      const presigned = await uploadsAPI.getPresignedUrl({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        uploadType: 'business-license',
      });

      // 2. S3 업로드
      await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });
      setIsUploadingLicense(false);

      // 3. 사업자등록증 재제출 API 호출
      await usersAPI.resubmitBusinessVerification(presigned.fileKey);

      // 4. 로컬 상태 업데이트
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
    <div className="min-h-screen bg-gray-50">
      <Header title="개인정보 수정" showBack />

      <div className="p-5 space-y-4">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이름</p>
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
            <div>
              <p className="text-sm text-gray-500">전화번호</p>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="font-medium text-gray-900 bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>
        </div>

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

            {/* 거절 시 사유 표시 + 재제출 UI */}
            {verificationStatus === 'rejected' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {/* 거절 사유 */}
                {businessInfo.verificationMemo && (
                  <div className="bg-red-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-red-700 mb-1">거절 사유</p>
                    <p className="text-sm text-red-600">{businessInfo.verificationMemo}</p>
                  </div>
                )}

                {/* 재업로드 UI */}
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

            {/* 심사중 안내 */}
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
