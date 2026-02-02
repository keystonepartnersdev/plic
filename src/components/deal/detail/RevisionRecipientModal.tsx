'use client';

// src/components/deal/detail/RevisionRecipientModal.tsx
// 수취인 정보 보완 모달

import { X, Check } from 'lucide-react';
import { BANKS } from './constants';
import { RevisionRecipient } from './types';

interface RevisionRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionRecipient: RevisionRecipient;
  onRecipientChange: (recipient: RevisionRecipient) => void;
  onVerifyAccount: () => void;
  onSubmit: () => void;
  isVerifying: boolean;
  verificationFailed: boolean;
  defaultSenderName?: string;
}

export function RevisionRecipientModal({
  isOpen,
  onClose,
  revisionRecipient,
  onRecipientChange,
  onVerifyAccount,
  onSubmit,
  isVerifying,
  verificationFailed,
  defaultSenderName,
}: RevisionRecipientModalProps) {
  if (!isOpen) return null;

  const canVerify =
    revisionRecipient.bank &&
    revisionRecipient.accountNumber.length >= 10 &&
    revisionRecipient.accountHolder &&
    !revisionRecipient.isVerified &&
    !isVerifying;

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">수취인 정보 수정</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {/* 은행 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
            <select
              value={revisionRecipient.bank}
              onChange={(e) => onRecipientChange({ ...revisionRecipient, bank: e.target.value, isVerified: false })}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
            >
              <option value="">은행을 선택하세요</option>
              {BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* 예금주 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
            <input
              type="text"
              value={revisionRecipient.accountHolder}
              onChange={(e) => onRecipientChange({ ...revisionRecipient, accountHolder: e.target.value, isVerified: false })}
              placeholder="예금주명 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
            />
          </div>

          {/* 계좌번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
            <input
              type="text"
              value={revisionRecipient.accountNumber}
              onChange={(e) => onRecipientChange({ ...revisionRecipient, accountNumber: e.target.value.replace(/\D/g, ''), isVerified: false })}
              placeholder="계좌번호 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
            />
          </div>

          {/* 보내는 분 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보내는 분</label>
            <input
              type="text"
              value={revisionRecipient.senderName}
              onChange={(e) => onRecipientChange({ ...revisionRecipient, senderName: e.target.value })}
              placeholder={defaultSenderName || '이름 입력'}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
            />
          </div>

          {/* 계좌 인증 버튼 */}
          <div className="flex gap-2 items-end">
            <button
              onClick={onVerifyAccount}
              disabled={!canVerify}
              className="h-11 px-4 bg-gray-900 text-white font-medium rounded-lg disabled:bg-gray-200 disabled:text-gray-400 whitespace-nowrap"
            >
              {revisionRecipient.isVerified ? '인증완료' : isVerifying ? '확인 중...' : '계좌확인'}
            </button>
          </div>

          {revisionRecipient.isVerified && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium flex items-center gap-2 text-sm">
                <Check className="w-4 h-4" />
                계좌 확인이 완료되었습니다.
              </p>
            </div>
          )}

          {verificationFailed && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-red-700 font-medium flex items-center gap-2 text-sm">
                <X className="w-4 h-4" />
                계좌 정보가 올바르지 않습니다.
              </p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!revisionRecipient.isVerified}
            className="flex-1 h-12 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
