'use client';

import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

interface DealDeleteModalProps {
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DealDeleteModal({ isDeleting, onConfirm, onCancel }: DealDeleteModalProps) {
  return createPortal(
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">거래 삭제</h3>
        <p className="text-gray-600 mb-6 text-center">
          이 거래를 삭제하시겠습니까?<br />
          <span className="text-red-500 text-sm">삭제된 거래는 복구할 수 없습니다.</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('mobile-frame')!
  );
}
