'use client';

// src/components/auth/signup/BusinessInfoStep.tsx
// Step 4: 사업자 정보 입력

import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessInfoStepProps } from './types';
import { formatBusinessNumber, isValidBusinessNumber, isBusinessActive } from './utils';

export function BusinessInfoStep({
  businessInfo,
  onBusinessInfoChange,
  verification,
  onVerifyBusiness,
  onFileSelect,
  onFileRemove,
  uploadingLicense,
  error,
  isLoading,
  canProceed,
  onSubmit,
}: BusinessInfoStepProps) {
  const handleBusinessNumberChange = (value: string) => {
    const formatted = formatBusinessNumber(value);
    onBusinessInfoChange('businessNumber', formatted);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">사업자 정보 입력</h2>
      <p className="text-gray-500 mb-6">사업자등록증 기준으로 정보를 입력해주세요.</p>

      {/* 상호명 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">상호명</label>
        <input
          type="text"
          value={businessInfo.businessName}
          onChange={(e) => onBusinessInfoChange('businessName', e.target.value)}
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
            value={businessInfo.businessNumber}
            onChange={(e) => handleBusinessNumberChange(e.target.value)}
            placeholder="000-00-00000"
            maxLength={12}
            className={cn(
              "flex-1 h-14 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400",
              verification.isVerified && isBusinessActive(verification.state)
                ? "border-green-300 bg-green-50"
                : verification.isVerified && !isBusinessActive(verification.state)
                ? "border-red-300 bg-red-50"
                : "border-gray-200"
            )}
          />
          <button
            type="button"
            onClick={onVerifyBusiness}
            disabled={
              !isValidBusinessNumber(businessInfo.businessNumber) ||
              verification.isVerifying ||
              (verification.isVerified && isBusinessActive(verification.state))
            }
            className={cn(
              "h-14 px-4 font-medium rounded-xl transition-colors whitespace-nowrap",
              verification.isVerified && isBusinessActive(verification.state)
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white"
            )}
          >
            {verification.isVerifying
              ? '확인 중...'
              : verification.isVerified && isBusinessActive(verification.state)
              ? '확인완료'
              : '사업자 확인'}
          </button>
        </div>
        {businessInfo.businessNumber && !isValidBusinessNumber(businessInfo.businessNumber) && (
          <p className="text-sm text-red-500 mt-1">사업자등록번호 10자리를 입력해주세요.</p>
        )}

        {/* 사업자 상태 표시 */}
        {verification.isVerified && (
          <div className={cn(
            "mt-2 p-3 rounded-lg flex items-center gap-2",
            isBusinessActive(verification.state) ? "bg-green-50" : "bg-red-50"
          )}>
            {isBusinessActive(verification.state) ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  사업자 상태: {verification.stateName}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 font-medium">
                  사업자 상태: {verification.stateName} - 가입 불가
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
          value={businessInfo.representativeName}
          onChange={(e) => onBusinessInfoChange('representativeName', e.target.value)}
          placeholder="대표자 성명"
          className="w-full h-14 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
        />
      </div>

      {/* 사업자등록증 업로드 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록증</label>

        {!businessInfo.businessLicenseFile ? (
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
              onChange={onFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-4">
              {businessInfo.businessLicensePreview ? (
                <img
                  src={businessInfo.businessLicensePreview}
                  alt="사업자등록증"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{businessInfo.businessLicenseFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(businessInfo.businessLicenseFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {uploadingLicense && (
                  <p className="text-sm text-primary-500">업로드 중...</p>
                )}
                {businessInfo.businessLicenseKey && !uploadingLicense && (
                  <p className="text-sm text-green-500">업로드 완료</p>
                )}
              </div>
              <button
                onClick={onFileRemove}
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
        onClick={onSubmit}
        disabled={!canProceed || isLoading || uploadingLicense}
        className="w-full h-14 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-lg rounded-xl transition-colors"
      >
        {isLoading ? '처리 중...' : '가입하기'}
      </button>
    </div>
  );
}
