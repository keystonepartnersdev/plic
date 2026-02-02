'use client';

// src/components/deal/new/RecipientStep.tsx
// Step 3: 수취인 정보 입력

import { useState } from 'react';
import { History, Check, X } from 'lucide-react';
import { IRecipientAccount } from '@/types';
import { BANKS } from './constants';
import { PreviousAccount } from './types';

interface RecipientStepProps {
  recipient: IRecipientAccount;
  onRecipientChange: (recipient: IRecipientAccount) => void;
  senderName: string;
  onSenderNameChange: (name: string) => void;
  userName?: string;
  isLoading: boolean;
  onVerifyAccount: () => Promise<void>;
  verificationFailed: boolean;
  verificationError: string;
  verifiedHolderName: string;
  onLoadPreviousAccounts: () => void;
  onNext: () => void;
}

export function RecipientStep({
  recipient,
  onRecipientChange,
  senderName,
  onSenderNameChange,
  userName,
  isLoading,
  onVerifyAccount,
  verificationFailed,
  verificationError,
  verifiedHolderName,
  onLoadPreviousAccounts,
  onNext,
}: RecipientStepProps) {
  const canProceed =
    recipient.bank &&
    recipient.accountNumber.length >= 10 &&
    recipient.accountHolder &&
    recipient.isVerified;

  const handleBankChange = (bank: string) => {
    onRecipientChange({
      ...recipient,
      bank,
      isVerified: false,
    });
  };

  const handleAccountNumberChange = (value: string) => {
    onRecipientChange({
      ...recipient,
      accountNumber: value.replace(/\D/g, ''),
      isVerified: false,
    });
  };

  const handleAccountHolderChange = (value: string) => {
    onRecipientChange({
      ...recipient,
      accountHolder: value,
      isVerified: false,
    });
  };

  const handleAutoFixHolder = () => {
    onRecipientChange({
      ...recipient,
      accountHolder: verifiedHolderName,
      isVerified: false,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        누구에게 송금하시나요?
      </h2>
      <p className="text-gray-500 mb-6">
        송금받을 분의 계좌 정보를 입력해주세요.
      </p>

      {/* 기존 거래 내역 조회 버튼 */}
      <button
        onClick={onLoadPreviousAccounts}
        className="w-full mb-6 h-14 bg-primary-400 hover:bg-primary-500 rounded-xl flex items-center justify-center gap-2 transition-colors text-white font-semibold"
      >
        <History className="w-5 h-5" />
        기존 거래 내역 조회
      </button>

      {/* 은행 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          은행 선택
        </label>
        <select
          value={recipient.bank}
          onChange={(e) => handleBankChange(e.target.value)}
          className="
            w-full h-14 px-4
            border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
            bg-white
          "
        >
          <option value="">은행을 선택하세요</option>
          {BANKS.map((bank) => (
            <option key={bank} value={bank}>{bank}</option>
          ))}
        </select>
      </div>

      {/* 계좌번호 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          계좌번호
        </label>
        <input
          type="text"
          value={recipient.accountNumber}
          onChange={(e) => handleAccountNumberChange(e.target.value)}
          placeholder="- 없이 숫자만 입력"
          className="
            w-full h-14 px-4
            border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
          "
        />
      </div>

      {/* 예금주 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          예금주
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={recipient.accountHolder}
            onChange={(e) => handleAccountHolderChange(e.target.value)}
            placeholder="예금주명 입력"
            className="
              flex-1 h-14 px-4
              border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
            "
          />
          <button
            onClick={onVerifyAccount}
            disabled={
              !recipient.bank ||
              recipient.accountNumber.length < 10 ||
              !recipient.accountHolder ||
              recipient.isVerified ||
              isLoading
            }
            className="
              h-14 px-5
              bg-primary-400 hover:bg-primary-500
              text-white font-semibold
              rounded-xl transition-colors
              disabled:bg-gray-200 disabled:text-gray-400
              whitespace-nowrap
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중...
              </>
            ) : recipient.isVerified ? '인증완료' : '계좌확인'}
          </button>
        </div>
      </div>

      {/* 인증 성공 */}
      {recipient.isVerified && (
        <div className="p-4 bg-green-50 rounded-xl mb-6">
          <p className="text-green-700 font-medium flex items-center gap-2">
            <Check className="w-5 h-5" />
            계좌 확인이 완료되었습니다.
          </p>
        </div>
      )}

      {/* 인증 실패 */}
      {verificationFailed && (
        <div className="p-4 bg-red-50 rounded-xl mb-6">
          <div className="flex items-start gap-2">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">계좌 확인 실패</p>
              {verificationError && (
                <p className="text-sm text-red-600 mt-1">{verificationError}</p>
              )}
              {verifiedHolderName && !recipient.isVerified && (
                <button
                  onClick={handleAutoFixHolder}
                  className="mt-2 text-sm text-red-700 underline hover:no-underline"
                >
                  실제 예금주({verifiedHolderName})로 자동 수정
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 보내는 분 이름 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          보내는 분 이름 (선택)
        </label>
        <input
          type="text"
          value={senderName}
          onChange={(e) => onSenderNameChange(e.target.value)}
          placeholder={userName || ''}
          className="
            w-full h-14 px-4
            border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
          "
        />
        <p className="text-xs text-gray-400 mt-1">
          입금자명으로 표시됩니다. 비워두면 회원명이 사용됩니다.
        </p>
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="
          w-full h-14
          bg-primary-400 hover:bg-primary-500
          disabled:bg-gray-200 disabled:text-gray-400
          text-white font-semibold text-lg
          rounded-xl transition-colors
        "
      >
        다음
      </button>
    </div>
  );
}
