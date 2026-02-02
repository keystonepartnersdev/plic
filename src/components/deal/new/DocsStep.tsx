'use client';

// src/components/deal/new/DocsStep.tsx
// Step 4: 서류 첨부

import { Upload, X, FileText, AlertCircle, Eye, Download } from 'lucide-react';
import { TDealType } from '@/types';
import { DealHelper } from '@/classes';
import { AttachmentFile } from './types';

interface DocsStepProps {
  dealType: TDealType;
  attachments: AttachmentFile[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (id: string) => void;
  uploadingCount: number;
  previewFile: AttachmentFile | null;
  onPreviewFile: (file: AttachmentFile | null) => void;
  onNext: () => void;
}

export function DocsStep({
  dealType,
  attachments,
  onFileSelect,
  onRemoveAttachment,
  uploadingCount,
  previewFile,
  onPreviewFile,
  onNext,
}: DocsStepProps) {
  const typeConfig = DealHelper.getDealTypeConfig(dealType);
  const canProceed = attachments.length > 0 &&
    attachments.every((a) => a.uploadStatus === 'completed') &&
    uploadingCount === 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        증빙 서류를 첨부해주세요
      </h2>
      <p className="text-gray-500 mb-6">
        {typeConfig.description}
      </p>

      {/* 필수 서류 안내 */}
      <div className="bg-primary-50 rounded-xl p-4 mb-6">
        <p className="font-medium text-primary-700 mb-2">필수 서류</p>
        <ul className="text-sm text-primary-600 space-y-1">
          {typeConfig.requiredDocs.map((doc, i) => (
            <li key={i}>• {doc}</li>
          ))}
        </ul>
        {typeConfig.optionalDocs.length > 0 && (
          <>
            <p className="font-medium text-primary-700 mt-3 mb-2">선택 서류</p>
            <ul className="text-sm text-primary-600 space-y-1">
              {typeConfig.optionalDocs.map((doc, i) => (
                <li key={i}>• {doc}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* 파일 업로드 */}
      <label className="
        flex flex-col items-center justify-center
        w-full h-32
        border-2 border-dashed border-gray-200 rounded-xl
        cursor-pointer hover:border-primary-400 transition-colors
        mb-4
      ">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">탭하여 파일 선택</span>
        <span className="text-xs text-gray-400 mt-1">개별 파일 50MB 이하</span>
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif,.pdf"
          onChange={onFileSelect}
          className="hidden"
        />
      </label>

      {/* 파일 미리보기 */}
      {attachments.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 lg:mx-0 lg:px-0 scrollbar-hide">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 cursor-pointer group"
                onClick={() => onPreviewFile(file)}
              >
                {/* 이미지 미리보기 */}
                {file.type.startsWith('image/') && file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <span className="text-xs text-gray-500 mt-0.5">
                      {file.type === 'application/pdf'
                        ? 'PDF'
                        : file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                )}

                {/* 업로드 진행률 오버레이 */}
                {(file.uploadStatus === 'uploading' || file.uploadStatus === 'pending') && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {file.uploadProgress !== undefined && (
                      <span className="text-white text-xs mt-1">{file.uploadProgress}%</span>
                    )}
                  </div>
                )}

                {/* 업로드 에러 오버레이 */}
                {file.uploadStatus === 'error' && (
                  <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center z-20">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAttachment(file.id);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-primary-400 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors z-30"
                >
                  <X className="w-3 h-3 text-white" />
                </button>

                {/* 미리보기 아이콘 오버레이 */}
                {file.uploadStatus === 'completed' && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors z-5">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 파일 개수 및 업로드 상태 안내 */}
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              {attachments.length}/10
            </p>
            {uploadingCount > 0 && (
              <p className="text-xs text-primary-500">
                {uploadingCount}개 파일 업로드 중...
              </p>
            )}
            {uploadingCount === 0 && attachments.some((a) => a.uploadStatus === 'error') && (
              <p className="text-xs text-red-500">
                업로드 실패한 파일이 있습니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* 미리보기 팝업 */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => onPreviewFile(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {previewFile.name}
              </h3>
              <button
                onClick={() => onPreviewFile(null)}
                className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 팝업 컨텐츠 */}
            <div className="p-4">
              {previewFile.type.startsWith('image/') && previewFile.preview ? (
                <img
                  src={previewFile.preview}
                  alt={previewFile.name}
                  className="w-full rounded-lg"
                />
              ) : previewFile.type === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-16 h-16 text-blue-500 mb-4" />
                  <p className="text-gray-900 font-semibold mb-2">PDF 파일</p>
                  <p className="text-gray-500 text-sm mb-6 text-center">
                    {previewFile.name}
                  </p>
                  <a
                    href={URL.createObjectURL(previewFile.file)}
                    download={previewFile.name}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600">{previewFile.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
