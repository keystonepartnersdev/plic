'use client';

import Link from 'next/link';
import { Image, Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useContentStore } from '@/stores';

export default function AdminContentsPage() {
  const { banners, notices, faqs } = useContentStore();

  const contentItems = [
    {
      href: '/admin/contents/banners',
      icon: Image,
      label: '배너관리',
      description: '홈 화면에 표시되는 배너를 관리합니다.',
      count: banners.length || 2,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      href: '/admin/contents/notices',
      icon: Bell,
      label: '공지사항',
      description: '서비스 공지사항을 등록하고 관리합니다.',
      count: notices.length || 3,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      href: '/admin/contents/faqs',
      icon: HelpCircle,
      label: 'FAQ 관리',
      description: '자주 묻는 질문을 관리합니다.',
      count: faqs.length || 5,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
        <p className="text-gray-500 mt-1">서비스 콘텐츠를 관리합니다.</p>
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
                <span className="font-semibold text-primary-400">{item.count}</span>
                <span className="text-gray-400">개 등록됨</span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
