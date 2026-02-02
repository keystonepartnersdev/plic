'use client';

// src/components/deal/detail/RevisionConfirmModal.tsx
// 보완 요청 저장 확인 모달

import { RevisionType } from './constants';

interface RevisionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  revisionType: RevisionType;
}

export function RevisionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  revisionType,
}: RevisionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-3">거래신청 확인</h3>
        <p className="text-gray-600 mb-6">
          {revisionType === 'documents'
            ? '수정된 서류로 거래신청 하시겠습니까?'
            : '수정된 정보로 거래신청 하시겠습니까?'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
