'use client';

import { useState, useEffect, use } from 'react';
import { Header } from '@/components/common';
import { contentAPI } from '@/lib/api';

const TERMS_TITLES: Record<string, string> = {
  service: '서비스 이용약관',
  privacy: '개인정보 처리방침',
  electronic: '전자금융거래 이용약관',
  marketing: '마케팅 정보 수신 동의',
};

export default function TermsDetailPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<{
    title: string;
    content: string;
    version: string;
    effectiveDate: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      if (!['service', 'privacy', 'electronic', 'marketing'].includes(type)) {
        setError('유효하지 않은 약관 타입입니다.');
        setLoading(false);
        return;
      }

      try {
        const response = await contentAPI.getTermsDetail(type as 'service' | 'privacy' | 'electronic' | 'marketing');
        setTerms(response.terms);
      } catch (err: any) {
        console.error('약관 로드 실패:', err);
        setError(err.message || '약관을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={TERMS_TITLES[type] || '약관'} showBack />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
        </div>
      </div>
    );
  }

  if (error || !terms) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="약관" showBack />
        <div className="p-5 text-center text-red-500">
          {error || '약관을 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={terms.title} showBack />
      <div className="p-5 bg-white">
        <div className="max-w-none">
          {/* 약관 내용을 줄바꿈 처리하여 렌더링 */}
          {terms.content.split('\n').map((paragraph, index) => {
            // 제목인지 확인 (제N조로 시작)
            const isHeading = /^제\d+조/.test(paragraph.trim());
            const isBullet = paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-');
            // 소제목인지 확인 (숫자.로 시작)
            const isSubHeading = /^[0-9]+\./.test(paragraph.trim());

            if (!paragraph.trim()) {
              return <br key={index} />;
            }

            if (isHeading) {
              return (
                <h2 key={index} className="text-base font-bold mt-6 mb-2 text-gray-900">
                  {paragraph}
                </h2>
              );
            }

            if (isSubHeading) {
              return (
                <p key={index} className="text-sm font-medium text-gray-800 mt-3 mb-1">
                  {paragraph}
                </p>
              );
            }

            if (isBullet) {
              return (
                <p key={index} className="text-sm font-normal text-gray-600 pl-4 my-1 leading-relaxed">
                  {paragraph}
                </p>
              );
            }

            return (
              <p key={index} className="text-sm font-normal text-gray-600 mb-2 leading-relaxed">
                {paragraph}
              </p>
            );
          })}

          <p className="text-gray-500 text-sm mt-8">
            시행일: {terms.effectiveDate}
          </p>

          {/* 사업자 정보 */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">사업자 정보</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>상호명: 주식회사 키스톤파트너스</p>
              <p>대표자: 방성민</p>
              <p>사업자등록번호: 583-88-01313</p>
              <p>주소: 경기도 안양시 동안구 흥안대로 457-27, 1동 지하 1층 비 117호(관양동)</p>
              <p>이메일: support@plic.kr</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
