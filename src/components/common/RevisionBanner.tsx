'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle, FileText, Users, Building, ChevronRight } from 'lucide-react';
import { dealsAPI } from '@/lib/api';
import { useUserStore } from '@/stores';
import { IDeal } from '@/types';

interface BannerItem {
  type: 'deal_documents' | 'deal_recipient' | 'deal_unknown' | 'business_rejected';
  label: string;
  description: string;
  href: string;
  icon: typeof FileText;
}

export function RevisionBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoggedIn, _hasHydrated } = useUserStore();
  const [revisionDeals, setRevisionDeals] = useState<IDeal[]>([]);

  useEffect(() => {
    if (!_hasHydrated || !isLoggedIn) return;

    const fetchRevisionDeals = async () => {
      try {
        const result = await dealsAPI.list({ status: 'need_revision' });
        setRevisionDeals(result.deals || []);
      } catch {
        // 조회 실패 시 무시
      }
    };

    fetchRevisionDeals();
  }, [_hasHydrated, isLoggedIn, pathname]);

  // 배너 항목 수집
  const bannerItems: BannerItem[] = [];

  // 1) 사업자 인증 거절
  if (
    currentUser?.userType === 'business' &&
    currentUser?.businessInfo?.verificationStatus === 'rejected'
  ) {
    // 마이페이지 편집 페이지에서는 이미 거절 UI가 있으므로 숨김
    if (pathname !== '/mypage/edit') {
      bannerItems.push({
        type: 'business_rejected',
        label: '사업자 인증이 거절되었습니다',
        description: '사업자등록증을 다시 제출해주세요',
        href: '/mypage/edit',
        icon: Building,
      });
    }
  }

  // 2) 거래 보완 요청
  const dealDetailMatch = pathname.match(/^\/deals\/([^/]+)$/);
  const filteredDeals = dealDetailMatch
    ? revisionDeals.filter(d => d.did !== dealDetailMatch[1])
    : revisionDeals;

  for (const deal of filteredDeals) {
    if (deal.revisionType === 'documents') {
      bannerItems.push({
        type: 'deal_documents',
        label: '서류 보완이 필요합니다',
        description: deal.dealName,
        href: `/deals/${deal.did}`,
        icon: FileText,
      });
    } else if (deal.revisionType === 'recipient') {
      bannerItems.push({
        type: 'deal_recipient',
        label: '수취인 정보 보완이 필요합니다',
        description: deal.dealName,
        href: `/deals/${deal.did}`,
        icon: Users,
      });
    } else {
      bannerItems.push({
        type: 'deal_unknown',
        label: '보완 요청이 있습니다',
        description: deal.dealName,
        href: `/deals/${deal.did}`,
        icon: AlertCircle,
      });
    }
  }

  if (bannerItems.length === 0) return null;

  // 첫 번째 항목만 표시 (여러 건이면 건수 안내)
  const first = bannerItems[0];
  const Icon = first.icon;
  const totalCount = bannerItems.length;

  const handleClick = () => {
    router.push(first.href);
  };

  return (
    <button
      id="revision-banner"
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border-t border-red-100 text-left"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
        <Icon className="w-4 h-4 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700 truncate">
          {first.label}
        </p>
        <p className="text-xs text-red-500 truncate">
          {first.description}
          {totalCount > 1 && ` 외 ${totalCount - 1}건`}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-red-400 flex-shrink-0" />
    </button>
  );
}
