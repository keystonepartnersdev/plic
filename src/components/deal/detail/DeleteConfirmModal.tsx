'use client';

// src/components/deal/detail/DeleteConfirmModal.tsx
// 삭제 확인 모달 (범용)

import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warning?: string;
  confirmText?: string;
  isLoading?: boolean;
  showIcon?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmText = '삭제',
  isLoading = false,
  showIcon = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        {showIcon && (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
        )}
        <h3 className={`text-lg font-bold text-gray-900 mb-3 ${showIcon ? 'text-center' : ''}`}>
          {title}
        </h3>
        <p className={`text-gray-600 mb-6 ${showIcon ? 'text-center' : ''}`}>
          {message}
          {warning && (
            <>
              <br />
              <span className="text-red-500 text-sm">{warning}</span>
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-11 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
