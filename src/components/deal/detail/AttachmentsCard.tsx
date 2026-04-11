'use client';

// src/components/deal/detail/AttachmentsCard.tsx
// 첨부 서류 섹션 컴포넌트

import { useState } from 'react';
import { FileText, Eye, Loader2 } from 'lucide-react';
import { IDeal } from '@/types';
import { AttachmentPreview } from './types';

interface AttachmentsCardProps {
  deal: IDeal;
  onPreview: (preview: AttachmentPreview) => void;
}

/**
 * S3 fileKey인지 판별 (data: 또는 blob:이 아닌 경우)
 */
function isS3Key(attachment: string): boolean {
  return !attachment.startsWith('data:') && !attachment.startsWith('blob:');
}

/**
 * S3 fileKey로 presigned URL을 가져옴
 */
async function getPresignedUrl(fileKey: string): Promise<string | null> {
  try {
    const res = await fetch('/api/uploads/download-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey }),
    });
    const result = await res.json();
    if (result.success) {
      return result.data.downloadUrl;
    }
    console.error('[AttachmentsCard] presigned URL 생성 실패:', result.error);
    return null;
  } catch (error) {
    console.error('[AttachmentsCard] presigned URL 요청 오류:', error);
    return null;
  }
}

export function AttachmentsCard({ deal, onPreview }: AttachmentsCardProps) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handlePreview = async (attachment: string, index: number) => {
    const fileName = `첨부파일 ${index + 1}`;

    if (isS3Key(attachment)) {
      // S3 fileKey → presigned URL 변환
      setLoadingIndex(index);
      const url = await getPresignedUrl(attachment);
      setLoadingIndex(null);

      if (url) {
        onPreview({ url, name: fileName, index });
      } else {
        alert('파일을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    } else {
      // data: 또는 blob: URL은 그대로 사용
      onPreview({ url: attachment, name: fileName, index });
    }
  };

  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-3">첨부 서류</h3>
      <div className="space-y-2">
        {(deal.attachments || []).map((attachment, index) => {
          const isImage = attachment.startsWith('data:image/') || attachment.startsWith('blob:');
          const fileName = `첨부파일 ${index + 1}`;
          const isLoading = loadingIndex === index;

          return (
            <button
              key={index}
              onClick={() => handlePreview(attachment, index)}
              disabled={isLoading}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-60"
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
                  {isImage ? '이미지' : isS3Key(attachment) ? '파일' : 'PDF'}
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
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
