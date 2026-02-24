'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, MessageCircle, Mail } from 'lucide-react';
import { Header } from '@/components/common';
import { contentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { IFAQ } from '@/types';
import { DEFAULT_FAQS } from '@/lib/defaultFaqs';

export default function GuidePage() {
  const [faqs, setFaqs] = useState<IFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('서비스 이용');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // 카테고리 정의 (백엔드 API 응답과 일치하도록 한글 사용)
  const categories = [
    { id: '서비스 이용', name: '서비스 이용' },
    { id: '결제/수수료', name: '결제/수수료' },
    { id: '계정/회원', name: '계정/회원' },
    { id: '송금/입금', name: '송금/입금' },
    { id: '기타', name: '기타' },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchFaqs = async () => {
      try {
        const response = await contentAPI.getFaqs();
        // API에서 FAQ가 있으면 사용, 없으면 기본 데이터 사용
        const apiFaqs = response.faqs || [];
        if (isMounted) setFaqs(apiFaqs.length > 0 ? apiFaqs : DEFAULT_FAQS);
      } catch (error) {
        console.error('FAQ 로드 실패:', error);
        // API 실패 시 기본 데이터 사용
        if (isMounted) setFaqs(DEFAULT_FAQS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  // 선택된 카테고리의 FAQ만 표시
  // 백엔드 API는 isVisible 필드가 없고, category는 한글/영문 혼용
  const displayFaqs = faqs.filter((f) => {
    const isVisible = f.isVisible !== false; // undefined면 true로 간주
    const categoryMatch = f.category === activeCategory ||
      (activeCategory === '서비스 이용' && f.category === 'service') ||
      (activeCategory === '결제/수수료' && f.category === 'payment') ||
      (activeCategory === '계정/회원' && f.category === 'account') ||
      (activeCategory === '송금/입금' && f.category === 'transfer') ||
      (activeCategory === '기타' && (f.category === 'other' || f.category === 'etc'));
    return categoryMatch && isVisible;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="이용안내" />

      <div className="bg-white px-5 py-6 mb-2">
        <h2 className="text-lg font-bold mb-4">고객센터</h2>
        <div className="space-y-3">
          <a href="http://pf.kakao.com/_xnQKhX" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">카카오톡 상담</p>
                <p className="text-sm text-gray-500">평일 09:00~18:00</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </a>

          <a href="mailto:support@plic.kr" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">이메일 문의</p>
                <p className="text-sm text-gray-500">support@plic.kr</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </a>
        </div>
      </div>

      <div className="bg-white px-5 py-6 mb-2">
        <h2 className="text-lg font-bold mb-4">자주 묻는 질문</h2>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setExpandedFaq(null); // 카테고리 변경 시 펼쳐진 FAQ 닫기
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : displayFaqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {displayFaqs.map((faq) => {
              // 백엔드 API는 id를, 로컬 데이터는 faqId를 사용
              const faqKey = (faq as { id?: string }).id || faq.faqId;
              return (
              <div
                key={faqKey}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === faqKey ? null : faqKey)
                  }
                  className="w-full p-4 text-left flex items-start gap-3"
                >
                  <span className="text-blue-500 font-medium">Q.</span>
                  <p className="flex-1 font-medium">{faq.question}</p>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-gray-400 transition-transform flex-shrink-0',
                      expandedFaq === faqKey && 'rotate-180'
                    )}
                  />
                </button>

                {expandedFaq === faqKey && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="bg-gray-50 rounded-lg p-4 flex gap-3">
                      <span className="text-green-500 font-medium">A.</span>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      <div className="bg-white px-5 py-4">
        <h2 className="text-lg font-bold mb-3">약관 및 정책</h2>
        <div className="space-y-1">
          <Link
            href="/terms/service"
            className="flex items-center justify-between py-3 border-b border-gray-100"
          >
            <span className="text-gray-700">서비스 이용약관</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link
            href="/terms/privacy"
            className="flex items-center justify-between py-3 border-b border-gray-100"
          >
            <span className="text-gray-700">개인정보 처리방침</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link
            href="/terms/electronic"
            className="flex items-center justify-between py-3"
          >
            <span className="text-gray-700">전자금융거래 이용약관</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
