'use client';

import { IDeal } from '@/types';

interface RevisionAlertProps {
  deal: IDeal;
  onDocumentRevision: () => void;
  onRecipientRevision: () => void;
}

export function RevisionAlert({ deal, onDocumentRevision, onRecipientRevision }: RevisionAlertProps) {
  if (deal.status !== 'need_revision') return null;

  if (deal.revisionType === 'documents') {
    return (
      <div className="bg-white px-5 py-4 mb-2">
        <div className="p-4 bg-red-50 rounded-xl">
          <p className="text-red-700 font-medium mb-2">서류 보완이 필요합니다</p>
          <p className="text-sm text-red-600 mb-3">
            제출하신 서류에 문제가 있습니다. 서류를 다시 확인하고 수정해주세요.
          </p>
          {deal.revisionMemo && (
            <div className="mb-3 p-3 bg-white rounded-lg border border-red-100">
              <p className="text-xs text-gray-600 font-medium mb-1">운영팀 메모</p>
              <p className="text-sm text-gray-900">{deal.revisionMemo}</p>
            </div>
          )}
          <button
            onClick={onDocumentRevision}
            className="w-full h-12 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
          >
            서류 재첨부
          </button>
        </div>
      </div>
    );
  }

  if (deal.revisionType === 'recipient') {
    return (
      <div className="bg-white px-5 py-4 mb-2">
        <div className="p-4 bg-red-50 rounded-xl">
          <p className="text-red-700 font-medium mb-2">수취인 정보 보완이 필요합니다</p>
          <p className="text-sm text-red-600 mb-3">
            수취인 정보에 오류가 있습니다. 정보를 확인하고 수정해주세요.
          </p>
          {deal.revisionMemo && (
            <div className="mb-3 p-3 bg-white rounded-lg border border-red-100">
              <p className="text-xs text-gray-600 font-medium mb-1">운영팀 메모</p>
              <p className="text-sm text-gray-900">{deal.revisionMemo}</p>
            </div>
          )}
          <button
            onClick={onRecipientRevision}
            className="w-full h-12 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
          >
            수취인 정보 수정
          </button>
        </div>
      </div>
    );
  }

  return null;
}
