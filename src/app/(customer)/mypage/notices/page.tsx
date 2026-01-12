'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Pin, Bell } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useContentStore } from '@/stores';
import { cn } from '@/lib/utils';

export default function MyNoticesPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUserStore();
  const { getVisibleNotices } = useContentStore();
  const notices = getVisibleNotices();

  const [mounted, setMounted] = useState(false);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  if (!mounted || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // Mock 공지사항 데이터 (스토어에 데이터가 없을 경우)
  const displayNotices = notices.length > 0 ? notices : [
    {
      noticeId: 'NTC001',
      title: '서비스 이용약관 변경 안내',
      content: '안녕하세요, PLIC입니다.\n\n2024년 12월 1일부터 서비스 이용약관이 일부 변경됩니다.\n\n주요 변경 사항:\n1. 수수료 정책 변경\n2. 환불 규정 명확화\n3. 개인정보 처리방침 업데이트\n\n자세한 내용은 이용약관 페이지를 확인해주세요.',
      isVisible: true,
      isPinned: true,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString(),
    },
    {
      noticeId: 'NTC002',
      title: '12월 연말 이벤트 안내',
      content: '12월 한 달간 신규 거래 시 수수료 20% 할인 이벤트를 진행합니다.\n\n이벤트 기간: 2024.12.01 ~ 2024.12.31\n대상: 전 회원\n혜택: 수수료 20% 할인\n\n많은 참여 부탁드립니다.',
      isVisible: true,
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: 'admin',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      noticeId: 'NTC003',
      title: '시스템 점검 안내',
      content: '보다 나은 서비스 제공을 위해 시스템 점검을 실시합니다.\n\n점검 일시: 2024.12.15 02:00 ~ 06:00 (4시간)\n영향 범위: 전체 서비스 이용 불가\n\n점검 시간 동안에는 서비스 이용이 불가하오니 양해 부탁드립니다.',
      isVisible: true,
      isPinned: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      createdBy: 'admin',
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  // 고정된 공지 먼저, 그 다음 최신순 정렬
  const sortedNotices = [...displayNotices].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="공지사항" showBack />

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white">
          {sortedNotices.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {sortedNotices.map((notice) => (
                <div key={notice.noticeId}>
                  <button
                    onClick={() => setExpandedNotice(expandedNotice === notice.noticeId ? null : notice.noticeId)}
                    className="w-full flex items-start justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        {notice.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                            <Pin className="w-3 h-3" />
                            고정
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{notice.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-1',
                        expandedNotice === notice.noticeId && 'rotate-180'
                      )}
                    />
                  </button>
                  {expandedNotice === notice.noticeId && (
                    <div className="px-4 pb-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                          {notice.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
