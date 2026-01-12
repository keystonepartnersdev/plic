'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Phone, MessageCircle, Mail } from 'lucide-react';
import { Header } from '@/components/common';
import { useContentStore } from '@/stores';
import { ContentHelper } from '@/classes';
import { cn } from '@/lib/utils';

// Mock FAQs 데이터
const mockFaqs = [
  {
    faqId: 'faq1',
    question: 'PLIC은 어떤 서비스인가요?',
    answer: 'PLIC은 카드 매입대금 정산대행 서비스입니다. 고객님이 신용카드로 결제하시면, 해당 금액을 지정하신 계좌로 송금해드립니다. 카드 포인트와 마일리지 적립 혜택은 그대로 받으실 수 있습니다.',
    category: 'service',
    isVisible: true,
    priority: 1,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
  },
  {
    faqId: 'faq2',
    question: '수수료는 어떻게 되나요?',
    answer: '기본 수수료율은 4.0%입니다. 등급이 올라갈수록 수수료율이 낮아지며, 플래티넘 3.5%, B2B 3.0%, 임직원 1.0%의 수수료율이 적용됩니다.',
    category: 'payment',
    isVisible: true,
    priority: 2,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
  },
  {
    faqId: 'faq3',
    question: '송금은 얼마나 걸리나요?',
    answer: '서류 검토 완료 및 결제 확인 후 영업일 기준 1~2일 내에 송금이 완료됩니다. 서류에 문제가 없는 경우 대부분 당일 처리됩니다.',
    category: 'transfer',
    isVisible: true,
    priority: 3,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
  },
  {
    faqId: 'faq4',
    question: '분할결제도 가능한가요?',
    answer: '네, 최대 3개의 카드로 분할결제가 가능합니다. 각 카드별로 금액과 할부 개월 수를 다르게 설정할 수 있습니다.',
    category: 'payment',
    isVisible: true,
    priority: 4,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
  },
  {
    faqId: 'faq5',
    question: '어떤 서류가 필요한가요?',
    answer: '거래 유형에 따라 필요한 서류가 다릅니다. 일반적으로 세금계산서, 계약서, 거래명세서 등 거래를 증빙할 수 있는 서류가 필요합니다. 거래 신청 시 상세 안내를 확인해주세요.',
    category: 'service',
    isVisible: true,
    priority: 5,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
  },
  {
    faqId: 'faq6',
    question: '계정 정보는 어떻게 변경하나요?',
    answer: '마이페이지에서 개인정보를 수정할 수 있습니다. 본인인증이 필요한 정보(이름, 연락처 등)는 고객센터를 통해 변경 가능합니다.',
    category: 'account',
    isVisible: true,
    priority: 6,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
  },
];

export default function GuidePage() {
  const { getVisibleFAQs } = useContentStore();
  const storeFaqs = getVisibleFAQs();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = ContentHelper.FAQ_CATEGORIES;

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId?: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId || '기타';
  };

  // 카테고리 색상 가져오기
  const getCategoryColor = (categoryId?: string): string => {
    const colors: Record<string, string> = {
      service: 'bg-blue-100 text-blue-700',
      payment: 'bg-green-100 text-green-700',
      transfer: 'bg-purple-100 text-purple-700',
      account: 'bg-orange-100 text-orange-700',
    };
    return colors[categoryId || ''] || 'bg-gray-100 text-gray-700';
  };

  // 스토어에 데이터가 있으면 사용, 없으면 mock 데이터 사용
  const allFaqs = storeFaqs.length > 0 ? storeFaqs : mockFaqs;

  // 카테고리 필터링 적용
  const displayFaqs = activeCategory
    ? allFaqs.filter((f) => f.category === activeCategory)
    : allFaqs;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="이용안내" />

      {/* 고객센터 */}
      <div className="bg-white px-5 py-6 mb-2">
        <h2 className="text-lg font-bold text-gray-900 mb-4">고객센터</h2>
        <div className="grid grid-cols-3 gap-3">
          <a
            href="tel:1588-0000"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-6 h-6 text-primary-400 mb-2" />
            <span className="text-sm text-gray-600">전화문의</span>
          </a>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <MessageCircle className="w-6 h-6 text-primary-400 mb-2" />
            <span className="text-sm text-gray-600">1:1 채팅</span>
          </button>
          <a
            href="mailto:help@plic.co.kr"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-6 h-6 text-primary-400 mb-2" />
            <span className="text-sm text-gray-600">이메일</span>
          </a>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          운영시간: 평일 09:00 - 18:00
        </p>
      </div>

      {/* FAQ */}
      <div className="bg-white px-5 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">자주 묻는 질문</h2>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === null
                ? 'bg-primary-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ 목록 */}
        <div className="space-y-2">
          {displayFaqs.map((faq) => (
            <div key={faq.faqId} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.faqId ? null : faq.faqId)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 pr-4">
                  <span className={cn(
                    'inline-flex px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap flex-shrink-0',
                    getCategoryColor(faq.category)
                  )}>
                    {getCategoryName(faq.category)}
                  </span>
                  <span className="font-medium text-gray-900 truncate">{faq.question.length > 14 ? faq.question.substring(0, 14) + '...' : faq.question}</span>
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-gray-400 transition-transform flex-shrink-0',
                    expandedFaq === faq.faqId && 'rotate-180'
                  )}
                />
              </button>
              {expandedFaq === faq.faqId && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 이용약관 링크 */}
      <div className="bg-white mt-2">
        <Link
          href="/terms/service"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-900">서비스 이용약관</span>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </Link>
        <Link
          href="/terms/privacy"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
        >
          <span className="text-gray-900">개인정보 처리방침</span>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </Link>
      </div>
    </div>
  );
}
