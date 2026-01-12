'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { useContentStore } from '@/stores';
import { ContentHelper } from '@/classes';
import { INotice } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminNoticesPage() {
  const { notices, addNotice, updateNotice, deleteNotice } = useContentStore();
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<INotice | null>(null);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Mock 공지사항 데이터
  const displayNotices = notices;

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPinned(false);
    setEditingNotice(null);
    setShowForm(false);
  };

  const handleEdit = (notice: INotice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setIsPinned(notice.isPinned);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    if (editingNotice) {
      updateNotice(editingNotice.noticeId, {
        title,
        content,
        isPinned,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newNotice = ContentHelper.createNewNotice(title, content, 'admin', { isPinned });
      addNotice(newNotice);
    }
    resetForm();
  };

  const handleDelete = (noticeId: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteNotice(noticeId);
    }
  };

  const handleToggleVisibility = (notice: INotice) => {
    updateNotice(notice.noticeId, { isVisible: !notice.isVisible });
  };

  const handleTogglePinned = (notice: INotice) => {
    updateNotice(notice.noticeId, { isPinned: !notice.isPinned });
  };

  // 고정된 공지 먼저, 그 다음 최신순 정렬
  const sortedNotices = [...displayNotices].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-gray-500 mt-1">공지사항을 등록하고 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          공지 등록
        </button>
      </div>

      {/* 공지사항 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingNotice ? '공지사항 수정' : '새 공지사항 등록'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공지사항 제목"
                className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="공지사항 내용을 입력하세요"
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 resize-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-primary-400 border-gray-300 rounded focus:ring-primary-400"
                />
                <span className="text-sm text-gray-600">상단 고정</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={resetForm}
              className="flex-1 h-10 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim()}
              className="flex-1 h-10 bg-gray-900 text-white rounded-lg font-medium disabled:bg-gray-200 disabled:text-gray-400"
            >
              {editingNotice ? '수정' : '등록'}
            </button>
          </div>
        </div>
      )}

      {/* 공지사항 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sortedNotices.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {sortedNotices.map((notice) => (
              <div key={notice.noticeId} className="hover:bg-gray-50">
                <div className="flex items-center justify-between p-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedNotice(expandedNotice === notice.noticeId ? null : notice.noticeId)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                          <Pin className="w-3 h-3" />
                          고정
                        </span>
                      )}
                      {!notice.isVisible && (
                        <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                          숨김
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{notice.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePinned(notice)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        notice.isPinned
                          ? 'text-primary-400 bg-primary-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(notice)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        notice.isVisible
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {notice.isVisible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(notice)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.noticeId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedNotice(expandedNotice === notice.noticeId ? null : notice.noticeId)}
                      className="p-2 text-gray-400"
                    >
                      {expandedNotice === notice.noticeId ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {expandedNotice === notice.noticeId && (
                  <div className="px-4 pb-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm whitespace-pre-line">{notice.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
