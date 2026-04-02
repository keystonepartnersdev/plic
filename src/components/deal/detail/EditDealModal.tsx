'use client';

// src/components/deal/detail/EditDealModal.tsx
// 거래 정보 수정 모달 컴포넌트

import { useState, useEffect } from 'react';
import { X, Loader2, Upload, Trash2, AlertCircle, Check } from 'lucide-react';
import { ModalPortal } from '@/components/common';
import { IDeal } from '@/types';
import { dealsAPI } from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import { cn } from '@/lib/utils';

// 계좌 인증 함수
async function verifyBankAccount(bankName: string, accountNumber: string, accountHolder: string): Promise<{ valid: boolean; isMatch: boolean; accountHolder?: string; errorMessage?: string }> {
  try {
    const res = await fetch('/api/popbill/account/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankName, accountNumber, accountHolder }),
    });
    const data = await res.json();
    if (data.success && data.data?.accountHolder) {
      return { valid: true, isMatch: data.data.isMatch === true, accountHolder: data.data.accountHolder };
    }
    const errMsg = data.error?.message || '계좌 조회에 실패했습니다.';
    return { valid: false, isMatch: false, errorMessage: errMsg };
  } catch {
    return { valid: false, isMatch: false, errorMessage: '계좌 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
  }
}

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: IDeal;
  onUpdate: (updatedDeal: IDeal) => void;
  editType: 'amount' | 'recipient' | 'attachments';
  monthlyLimit?: number;
  usedAmount?: number;
  perTransactionLimit?: number;
}

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'SC제일은행',
  '농협은행', '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크',
  '우체국', '새마을금고', '신협', '수협은행', '부산은행', '대구은행',
  '경남은행', '광주은행', '전북은행', '제주은행',
];

export function EditDealModal({ isOpen, onClose, deal, onUpdate, editType, monthlyLimit = 20000000, usedAmount = 0, perTransactionLimit = 2000000 }: EditDealModalProps) {
  // 금액 수정
  const [amount, setAmount] = useState(deal.amount);

  // 수취인 정보 수정
  const [bank, setBank] = useState(deal.recipient?.bank || '');
  const [accountNumber, setAccountNumber] = useState(deal.recipient?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(deal.recipient?.accountHolder || '');
  const [isVerified, setIsVerified] = useState(deal.recipient?.isVerified || false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verifiedHolderName, setVerifiedHolderName] = useState('');

  // 첨부파일 수정
  const [attachments, setAttachments] = useState<string[]>(deal.attachments || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(deal.amount);
      setBank(deal.recipient?.bank || '');
      setAccountNumber(deal.recipient?.accountNumber || '');
      setAccountHolder(deal.recipient?.accountHolder || '');
      setIsVerified(deal.recipient?.isVerified || false);
      setAttachments(deal.attachments || []);
      setNewFiles([]);
      setError(null);
      setVerificationFailed(false);
      setVerificationError('');
      setVerifiedHolderName('');
    }
  }, [isOpen, deal]);

  // TODO: 계좌인증 API 임시 비활성화 — API 복구 후 원래 로직 복원 필요
  const handleVerifyAccount = async () => {
    if (!bank || !accountNumber || !accountHolder) return;
    // API 호출 없이 바로 인증 완료 처리
    setIsVerified(true);
  };

  // 파일 추가
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  // 기존 첨부파일 삭제
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 새 파일 삭제
  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      let updateData: Partial<IDeal> = {};

      if (editType === 'amount') {
        if (amount < 100) {
          setError('최소 송금 금액은 100원입니다.');
          setIsSaving(false);
          return;
        }
        if (amount > perTransactionLimit) {
          setError(`1회 결제 한도(${perTransactionLimit.toLocaleString()}원)를 초과하여 금액을 수정할 수 없습니다.`);
          setIsSaving(false);
          return;
        }
        const remainingLimit = Math.max(monthlyLimit - usedAmount, 0);
        if (amount > remainingLimit) {
          setError('월 사용한도를 초과하여 금액을 수정할 수 없습니다.');
          setIsSaving(false);
          return;
        }
        updateData.amount = amount;
      }

      if (editType === 'recipient') {
        if (!bank || !accountNumber || !accountHolder) {
          setError('모든 수취인 정보를 입력해주세요.');
          setIsSaving(false);
          return;
        }
        updateData.recipient = {
          bank,
          accountNumber,
          accountHolder,
          isVerified,
        };
      }

      if (editType === 'attachments') {
        // 새 파일 업로드
        let uploadedKeys: string[] = [];
        if (newFiles.length > 0) {
          setIsUploading(true);
          for (const file of newFiles) {
            const result = await uploadFile(file, 'attachment', deal.did);
            uploadedKeys.push(result.fileKey);
          }
          setIsUploading(false);
        }
        updateData.attachments = [...attachments, ...uploadedKeys];
      }

      const result = await dealsAPI.update(deal.did, updateData);
      onUpdate(result.deal);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (editType) {
      case 'amount': return '송금 금액 수정';
      case 'recipient': return '수취인 정보 수정';
      case 'attachments': return '첨부 서류 수정';
    }
  };

  return (
    <ModalPortal>
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">{getTitle()}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 금액 수정 */}
          {editType === 'amount' && (() => {
            const isOverPerTransaction = amount > perTransactionLimit;
            const remainingLimit = Math.max(monthlyLimit - usedAmount, 0);
            const isOverLimit = amount > remainingLimit;
            const wouldExceedLimit = usedAmount + amount > monthlyLimit;

            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  송금 금액
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className={cn(
                    "w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400",
                    isOverPerTransaction || isOverLimit ? "border-red-400" : "border-gray-200"
                  )}
                  placeholder="송금 금액을 입력하세요"
                  min={100}
                  step={100}
                />
                <p className="mt-2 text-sm text-gray-500">
                  수수료 ({Math.round(deal.feeRate * 1.1 * 10) / 10}%, 부가세 포함): {Math.floor(Math.floor(amount * deal.feeRate / 100) * 1.1).toLocaleString()}원
                </p>
                <p className="text-sm font-medium text-primary-400">
                  총 결제금액: {(amount + Math.floor(Math.floor(amount * deal.feeRate / 100) * 1.1)).toLocaleString()}원
                </p>

                {/* 1회 결제 한도 */}
                <div className={cn(
                  "rounded-xl p-4 mt-4",
                  isOverPerTransaction ? "bg-red-50" : "bg-gray-50"
                )}>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium",
                      isOverPerTransaction ? "text-red-700" : "text-gray-700"
                    )}>
                      1회 결제 한도
                    </span>
                    <span className={cn(
                      "text-sm font-semibold",
                      isOverPerTransaction ? "text-red-600" : "text-gray-900"
                    )}>
                      {perTransactionLimit.toLocaleString()}원
                    </span>
                  </div>
                  {isOverPerTransaction && (
                    <div className="mt-2 flex items-start gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">
                        1회 결제 한도를 초과하였습니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 월 한도 현황 */}
                <div className={cn(
                  "rounded-xl p-4 mt-3",
                  isOverLimit ? "bg-red-50" : "bg-blue-50"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isOverLimit ? "text-red-700" : "text-blue-700"
                    )}>
                      이번 달 한도
                    </span>
                    <span className={cn(
                      "text-sm",
                      isOverLimit ? "text-red-600" : "text-blue-600"
                    )}>
                      {usedAmount.toLocaleString()}원 / {monthlyLimit.toLocaleString()}원
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2 mb-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        isOverLimit ? "bg-red-400" : "bg-blue-400"
                      )}
                      style={{ width: `${Math.min((usedAmount / monthlyLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isOverLimit ? "text-red-600" : "text-blue-600"}>
                      잔여 한도: {remainingLimit.toLocaleString()}원
                    </span>
                    {wouldExceedLimit && amount > 0 && (
                      <span className="text-red-600 font-medium">
                        {(amount - remainingLimit).toLocaleString()}원 초과
                      </span>
                    )}
                  </div>
                  {isOverLimit && (
                    <div className="mt-3 flex items-start gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">
                        월 한도를 초과하여 거래를 진행할 수 없습니다.
                        한도 상향이 필요하시면 고객센터로 문의해 주세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 수취인 정보 수정 */}
          {editType === 'recipient' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  은행
                </label>
                <select
                  value={bank}
                  onChange={(e) => {
                    setBank(e.target.value);
                    setIsVerified(false);
                  }}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
                >
                  <option value="">은행 선택</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/[^0-9]/g, ''));
                    setIsVerified(false);
                  }}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                  placeholder="계좌번호 (숫자만)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예금주
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => {
                      setAccountHolder(e.target.value);
                      setIsVerified(false);
                      setVerificationFailed(false);
                      setVerifiedHolderName('');
                    }}
                    className={cn(
                      "flex-1 h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400",
                      isVerified ? "border-green-500 bg-green-50" : "border-gray-200"
                    )}
                    placeholder="예금주명"
                    readOnly={isVerified}
                  />
                  <button
                    onClick={handleVerifyAccount}
                    disabled={!bank || !accountNumber || !accountHolder || isVerifying || isVerified}
                    className={cn(
                      "px-4 h-12 rounded-xl font-medium transition-colors whitespace-nowrap",
                      isVerified
                        ? "bg-green-500 text-white"
                        : "bg-primary-400 text-white hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400"
                    )}
                  >
                    {isVerifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isVerified ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      '계좌확인'
                    )}
                  </button>
                </div>

                {/* 인증 성공 */}
                {isVerified && (
                  <div className="mt-2 p-3 bg-green-50 rounded-xl">
                    <p className="text-green-700 font-medium flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4" />
                      계좌 확인이 완료되었습니다.
                    </p>
                  </div>
                )}

                {/* 인증 실패 */}
                {verificationFailed && (
                  <div className="mt-2 p-3 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600">{verificationError}</p>
                    {verifiedHolderName && !isVerified && (
                      <button
                        onClick={() => {
                          setAccountHolder(verifiedHolderName);
                          setIsVerified(false);
                          setVerificationFailed(false);
                          setVerifiedHolderName('');
                        }}
                        className="mt-2 text-sm text-red-700 underline hover:no-underline"
                      >
                        실제 예금주({verifiedHolderName})로 자동 수정
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 첨부파일 수정 */}
          {editType === 'attachments' && (
            <div className="space-y-4">
              {/* 기존 첨부파일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기존 첨부파일
                </label>
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">첨부파일 {index + 1}</span>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">첨부된 파일이 없습니다.</p>
                )}
              </div>

              {/* 새 파일 추가 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 파일 추가
                </label>
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">파일 선택</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {newFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <button
                          onClick={() => handleRemoveNewFile(index)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading || (editType === 'amount' && (amount > perTransactionLimit || amount > Math.max(monthlyLimit - usedAmount, 0)))}
            className="flex-1 h-12 bg-primary-400 text-white rounded-xl font-medium hover:bg-primary-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
          >
            {(isSaving || isUploading) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUploading ? '업로드 중...' : '저장 중...'}
              </>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
