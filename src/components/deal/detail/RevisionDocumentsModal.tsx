'use client';

// src/components/deal/detail/RevisionDocumentsModal.tsx
// 서류 보완 모달

import { X, FileText, Plus, Eye, Trash2 } from 'lucide-react';
import { IDeal } from '@/types';
import { AttachmentPreview } from './types';

interface RevisionDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: IDeal;
  revisionAttachments: File[];
  onRevisionAttachmentsChange: (files: File[]) => void;
  onPreviewAttachment: (preview: AttachmentPreview) => void;
  onDeleteExistingAttachment: (index: number) => void;
  onSubmit: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

export function RevisionDocumentsModal({
  isOpen,
  onClose,
  deal,
  revisionAttachments,
  onRevisionAttachmentsChange,
  onPreviewAttachment,
  onDeleteExistingAttachment,
  onSubmit,
}: RevisionDocumentsModalProps) {
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const currentAttachments = deal.attachments || [];

    // 개수 검증
    if (currentAttachments.length + revisionAttachments.length + newFiles.length > MAX_FILES) {
      alert(`최대 ${MAX_FILES}개까지만 첨부할 수 있습니다. (현재: 기존 ${currentAttachments.length}개 + 추가 예정 ${revisionAttachments.length}개)`);
      return;
    }

    // 크기 검증
    const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`파일 크기가 50MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    onRevisionAttachmentsChange([...revisionAttachments, ...newFiles]);
  };

  const handlePreviewNewFile = (file: File, index: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onPreviewAttachment({
        url: e.target?.result as string,
        name: file.name,
        index,
        isNew: true
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveNewFile = (index: number) => {
    onRevisionAttachmentsChange(revisionAttachments.filter((_, i) => i !== index));
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">서류 재첨부</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* 기존 첨부 파일 미리보기 */}
        {(deal.attachments || []).length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-900 mb-4">기존 첨부 파일</p>
            <div className="space-y-4">
              {(deal.attachments || []).map((attachment, index) => (
                <div key={index} className="flex items-center gap-4 p-5 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 flex-1 truncate">파일 {index + 1}</span>
                  <button
                    onClick={() => onPreviewAttachment({ url: attachment, name: `파일 ${index + 1}`, index })}
                    className="p-3 text-primary-400 hover:text-primary-500 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-7 h-7" />
                  </button>
                  <button
                    onClick={() => onDeleteExistingAttachment(index)}
                    className="p-3 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-7 h-7" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 신규 파일 업로드 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">추가 업로드</p>
          <label className="block w-full h-24 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-sm text-gray-600">파일을 클릭하거나 드래그하세요</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-gray-400 mt-1 block">최대 10개, 개별 파일 50MB 이하</span>

          {revisionAttachments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 mb-4">추가 파일</p>
              <div className="space-y-4">
                {revisionAttachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-4 p-5 bg-green-50 rounded-lg">
                    <FileText className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600 flex-1 truncate">{file.name}</span>
                    <button
                      onClick={() => handlePreviewNewFile(file, index)}
                      className="p-3 text-primary-400 hover:text-primary-500 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-7 h-7" />
                    </button>
                    <button
                      onClick={() => handleRemoveNewFile(index)}
                      className="p-3 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-7 h-7" />
                    </button>
                  </div>
                ))}
              </div>
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
            className="flex-1 h-12 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors"
          >
            재첨부
          </button>
        </div>
      </div>
    </div>
  );
}
