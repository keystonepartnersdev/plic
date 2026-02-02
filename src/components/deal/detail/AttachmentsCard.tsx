'use client';

// src/components/deal/detail/AttachmentsCard.tsx
// 첨부 서류 섹션 컴포넌트

import { FileText, Eye } from 'lucide-react';
import { IDeal } from '@/types';
import { AttachmentPreview } from './types';

interface AttachmentsCardProps {
  deal: IDeal;
  onPreview: (preview: AttachmentPreview) => void;
}

export function AttachmentsCard({ deal, onPreview }: AttachmentsCardProps) {
  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">첨부 서류</h3>
      <div className="space-y-2">
        {(deal.attachments || []).map((attachment, index) => {
          const isImage = attachment.startsWith('data:image/') || attachment.startsWith('blob:');
          const fileName = `첨부파일 ${index + 1}`;

          return (
            <button
              key={index}
              onClick={() => onPreview({ url: attachment, name: fileName, index })}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {isImage ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  <img src={attachment} alt={fileName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500">
                  {isImage ? '이미지' : 'PDF'}
                </p>
              </div>
              <Eye className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}

        {(!deal.attachments || deal.attachments.length === 0) && (
          <p className="text-gray-500 text-sm">첨부된 서류가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
