'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Pin } from 'lucide-react';
import { Header } from '@/components/common';
import { contentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface INotice {
  noticeId: string;
  title: string;
  content: string;
  isVisible: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<INotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await contentAPI.getNotices();
        setNotices(response.notices || []);
      } catch (error) {
        console.error('공지사항 로드 실패:', error);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  // 고정된 공지 먼저, 그 다음 최신순 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="공지사항" showBack />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="공지사항" showBack />

      <div className="divide-y divide-gray-100 bg-white">
        {sortedNotices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          sortedNotices.map((notice) => (
            <div key={notice.noticeId} className="bg-white">
              <button
                onClick={() =>
                  setExpandedNotice(
                    expandedNotice === notice.noticeId ? null : notice.noticeId
                  )
                }
                className="w-full p-4 text-left flex items-start gap-3"
              >
                {notice.isPinned && (
                  <Pin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'font-medium',
                      notice.isPinned && 'text-blue-600'
                    )}
                  >
                    {notice.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(notice.createdAt)}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-gray-400 flex-shrink-0 transition-transform',
                    expandedNotice === notice.noticeId && 'rotate-180'
                  )}
                />
              </button>

              {expandedNotice === notice.noticeId && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {notice.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
