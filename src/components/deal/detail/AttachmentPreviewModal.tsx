'use client';

// src/components/deal/detail/AttachmentPreviewModal.tsx
// 첨부파일 미리보기 모달

import { X, Download, ChevronRight, FileText } from 'lucide-react';
import { AttachmentPreview } from './types';

interface AttachmentPreviewModalProps {
  preview: AttachmentPreview | null;
  totalCount: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function AttachmentPreviewModal({
  preview,
  totalCount,
  onClose,
  onNavigate,
}: AttachmentPreviewModalProps) {
  if (!preview) return null;

  const isImage = preview.url.startsWith('data:image/') || preview.url.startsWith('blob:');
  const canNavigatePrev = preview.index > 0;
  const canNavigateNext = preview.index < totalCount - 1;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-medium">{preview.name}</span>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 컨텐츠 */}
      <div
        className="flex-1 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          <img
            src={preview.url}
            alt={preview.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-2">PDF 파일</p>
            <p className="text-gray-500 text-sm mb-6">{preview.name}</p>
            <a
              href={preview.url}
              download={preview.name}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              다운로드
            </a>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="flex items-center justify-center gap-4 p-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canNavigatePrev) onNavigate(preview.index - 1);
          }}
          disabled={!canNavigatePrev}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6 text-white rotate-180" />
        </button>
        <span className="text-white text-sm">
          {preview.index + 1} / {totalCount}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canNavigateNext) onNavigate(preview.index + 1);
          }}
          disabled={!canNavigateNext}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
