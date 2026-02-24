'use client';

// 어드민용 거래 정보 수정 모달

import { useState, useEffect } from 'react';
import { X, Loader2, Upload, Trash2, AlertCircle, Check } from 'lucide-react';
import { IDeal } from '@/types';
import { adminAPI } from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import { cn } from '@/lib/utils';

// 계좌 인증 함수
async function verifyBankAccount(bankName: string, accountNumber: string, accountHolder: string): Promise<{ valid: boolean; accountHolder?: string }> {
  try {
    const res = await fetch('/api/popbill/account/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankName, accountNumber, accountHolder }),
    });
    const data = await res.json();
    if (data.success && data.data?.accountHolder) {
      return { valid: true, accountHolder: data.data.accountHolder };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

interface AdminEditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: IDeal;
  onUpdate: () => void;
  editType: 'amount' | 'recipient' | 'attachments';
}

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'SC제일은행',
  '농협은행', '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크',
  '우체국', '새마을금고', '신협', '수협은행', '부산은행', '대구은행',
  '경남은행', '광주은행', '전북은행', '제주은행',
];

export function AdminEditDealModal({ isOpen, onClose, deal, onUpdate, editType }: AdminEditDealModalProps) {
  // 금액 수정
  const [amount, setAmount] = useState(deal.amount);

  // 수취인 정보 수정
  const [bank, setBank] = useState(deal.recipient?.bank || '');
  const [accountNumber, setAccountNumber] = useState(deal.recipient?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(deal.recipient?.accountHolder || '');
  const [isVerified, setIsVerified] = useState(deal.recipient?.isVerified || false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);

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
    }
  }, [isOpen, deal]);

  // 계좌 검증
  const handleVerifyAccount = async () => {
    if (!bank || !accountNumber) return;

    setIsVerifying(true);
    setVerificationFailed(false);

    try {
      const result = await verifyBankAccount(bank, accountNumber, accountHolder);

      if (result.valid) {
        setAccountHolder(result.accountHolder || accountHolder);
        setIsVerified(true);
      } else {
        setVerificationFailed(true);
      }
    } catch {
      setVerificationFailed(true);
    } finally {
      setIsVerifying(false);
    }
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

      // 어드민 API로 거래 수정
      await adminAPI.updateDeal(deal.did, updateData);
      onUpdate();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
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
          {editType === 'amount' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                송금 금액
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                placeholder="송금 금액을 입력하세요"
                min={100}
                step={100}
              />
              <p className="mt-2 text-sm text-gray-500">
                수수료 ({deal.feeRate}%): {Math.ceil(amount * deal.feeRate / 100).toLocaleString()}원
              </p>
              <p className="text-sm font-medium text-primary-400">
                총 결제금액: {(amount + Math.ceil(amount * deal.feeRate / 100)).toLocaleString()}원
              </p>
            </div>
          )}

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
                    disabled={!bank || !accountNumber || isVerifying || isVerified}
                    className={cn(
                      "px-4 h-12 rounded-xl font-medium transition-colors",
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
                      '확인'
                    )}
                  </button>
                </div>
                {verificationFailed && (
                  <p className="mt-2 text-sm text-red-500">
                    계좌 정보가 일치하지 않습니다. 다시 확인해주세요.
                  </p>
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
            disabled={isSaving || isUploading}
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
  );
}
