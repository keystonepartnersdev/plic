// src/components/common/Modal.tsx
'use client';

import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  showCloseButton?: boolean;
  cancelText?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = '확인',
  onConfirm,
  showCloseButton = true,
  cancelText = '취소',
  onCancel,
  showCancel = false,
}: ModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 - PLIC 디자인 시스템 적용 */}
      <div className="relative bg-white rounded-3xl w-[calc(100%-2rem)] max-w-sm p-8 shadow-2xl border border-gray-100">
        {/* 닫기 버튼 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        )}

        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">{title}</h2>

        {/* 내용 */}
        <div className="text-gray-600 leading-relaxed mb-6">
          {children}
        </div>

        {/* 버튼 영역 */}
        <div className={`flex gap-3 ${showCancel ? 'flex-row' : 'justify-center'}`}>
          {showCancel && (
            <button
              onClick={handleCancel}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`h-12 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all duration-300 ${showCancel ? 'flex-1' : 'w-full max-w-[200px]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
