'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Image, Bell, HelpCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { contentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AdminContentsPage() {
  const [bannerCount, setBannerCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [faqCount, setFaqCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const [bannersRes, noticesRes, faqsRes] = await Promise.all([
        contentAPI.getBanners(),
        contentAPI.getNotices(),
        contentAPI.getFaqs(),
      ]);
      setBannerCount(bannersRes.banners?.length || 0);
      setNoticeCount(noticesRes.notices?.length || 0);
      setFaqCount(faqsRes.faqs?.length || 0);
    } catch (err) {
      console.error('콘텐츠 카운트 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const contentItems = [
    {
      href: '/admin/contents/banners',
      icon: Image,
      label: '배너관리',
      description: '홈 화면에 표시되는 배너를 관리합니다.',
      count: bannerCount,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      href: '/admin/contents/notices',
      icon: Bell,
      label: '공지사항',
      description: '서비스 공지사항을 등록하고 관리합니다.',
      count: noticeCount,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      href: '/admin/contents/faqs',
      icon: HelpCircle,
      label: 'FAQ 관리',
      description: '자주 묻는 질문을 관리합니다.',
      count: faqCount,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-gray-500 mt-1">서비스 콘텐츠를 관리합니다.</p>
        </div>
        <button
          onClick={fetchCounts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          새로고침
        </button>
      </div>

      {/* 콘텐츠 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
              <p className="text-sm text-gray-500 mb-3">{item.description}</p>
              <p className="text-sm">
                <span className="font-semibold text-primary-400">
                  {loading ? '-' : item.count}
                </span>
                <span className="text-gray-400">개 등록됨</span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
