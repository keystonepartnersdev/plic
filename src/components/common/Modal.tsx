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
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = '확인',
  onConfirm,
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
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

      {/* 모달 컨텐츠 - 모바일 프레임 기준 중앙 배치 */}
      <div className="relative bg-white rounded-2xl w-[calc(100%-2rem)] max-w-sm p-6 shadow-xl">
        {/* 닫기 버튼 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 제목 */}
        <h2 className="text-lg font-bold text-gray-900 mb-4 pr-6">{title}</h2>

        {/* 내용 */}
        <div className="text-gray-600 text-sm leading-relaxed mb-6">
          {children}
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handleConfirm}
          className="w-full h-12 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
