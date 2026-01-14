'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { Header, Modal } from '@/components/common';
import { DraftDealCard } from '@/components/deal';
import { useUserStore, useDealStore, useDealDraftStore } from '@/stores';
import { dealsAPI } from '@/lib/api';
import { DealHelper } from '@/classes';
import { IDeal, TDealStatus } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'progress' | 'revision' | 'completed';

const tabs: { id: TabType; label: string; statuses: TDealStatus[] }[] = [
  { id: 'progress', label: '진행중', statuses: ['pending', 'reviewing', 'hold', 'awaiting_payment'] },
  { id: 'revision', label: '보완필요', statuses: ['need_revision'] },
  { id: 'completed', label: '거래완료', statuses: ['completed', 'cancelled'] },
];

export default function DealsPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUserStore();
  const { setDeals } = useDealStore();
  const { drafts, loadDraft, deleteDraft, clearCurrentDraft } = useDealDraftStore();

  const [deals, setLocalDeals] = useState<IDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [mounted, setMounted] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    clearCurrentDraft();
    setPortalTarget(document.getElementById('mobile-frame'));
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  useEffect(() => {
    const fetchDeals = async () => {
      if (!isLoggedIn) return;
      try {
        const response = await dealsAPI.list();
        setLocalDeals(response.deals || []);
        setDeals(response.deals || []);
      } catch (error) {
        console.error('거래 목록 로드 실패:', error);
        setLocalDeals([]);
      } finally {
        setLoading(false);
      }
    };
    if (mounted && isLoggedIn) {
      fetchDeals();
    }
  }, [mounted, isLoggedIn, setDeals]);

  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const userDrafts = drafts.filter((d) => d.uid === currentUser?.uid && d.status === 'draft');
  const awaitingPaymentDeals = deals.filter((d) => d.status === 'awaiting_payment');
  const activeTabConfig = tabs.find((t) => t.id === activeTab)!;
  const filteredDeals = deals.filter((d) => activeTabConfig.statuses.includes(d.status) && d.status !== 'awaiting_payment');

  const getTabCount = (tab: TabType) => {
    const tabConfig = tabs.find((t) => t.id === tab)!;
    const dealCount = deals.filter((d) => tabConfig.statuses.includes(d.status)).length;
    if (tab === 'progress') {
      return dealCount + userDrafts.length;
    }
    return dealCount;
  };

  const handleDraftClick = (draftId: string) => {
    if (currentUser?.status !== 'active') {
      setShowStatusModal(true);
      return;
    }
    loadDraft(draftId);
    router.push(`/deals/new?draft=${draftId}`);
  };

  return (
    <div className="relative bg-gray-50 pb-24">
      <Header title="거래내역" />

      <div className="bg-white border-b border-gray-100 px-5 sticky top-14 z-10">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-4 text-center font-medium transition-colors relative',
                activeTab === tab.id ? 'text-primary-400' : 'text-gray-400'
              )}
            >
              {tab.label}
              {getTabCount(tab.id) > 0 && (
                <span className={cn(
                  'ml-1 text-sm',
                  activeTab === tab.id ? 'text-primary-400' : 'text-gray-400'
                )}>
                  {getTabCount(tab.id)}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          </div>
        ) : (
          <>
            {activeTab === 'progress' && (userDrafts.length > 0 || awaitingPaymentDeals.length > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">작성중</h3>
                <div className="space-y-3">
                  {awaitingPaymentDeals.map((deal) => (
                    <DealCard key={deal.did} deal={deal} />
                  ))}
                  {userDrafts.map((draft) => (
                    <DraftDealCard
                      key={draft.id}
                      draft={draft}
                      onClick={() => handleDraftClick(draft.id)}
                      onDelete={() => deleteDraft(draft.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredDeals.length > 0 ? (
              <div className="space-y-3">
                {activeTab === 'progress' && (userDrafts.length > 0 || awaitingPaymentDeals.length > 0) && (
                  <h3 className="text-sm font-medium text-gray-500 mb-3">진행중</h3>
                )}
                {filteredDeals.map((deal) => (
                  <DealCard key={deal.did} deal={deal} />
                ))}
              </div>
            ) : (
              (activeTab !== 'progress' || (userDrafts.length === 0 && awaitingPaymentDeals.length === 0)) && (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {activeTab === 'progress' && '진행중인 거래가 없습니다.'}
                    {activeTab === 'revision' && '보완이 필요한 거래가 없습니다.'}
                    {activeTab === 'completed' && '완료된 거래가 없습니다.'}
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="계정 상태 안내"
      >
        <p>
          죄송합니다. 현재 <strong className="text-gray-900">{currentUser?.name}</strong>님의 계정은{' '}
          <strong className="text-gray-900">
            {currentUser?.status === 'pending' ? '대기' : '정지'}
          </strong>
          {' '}처리되었습니다. 원활한 서비스 이용을 위하여 고객센터로 문의주시면 친절하게 답변드리겠습니다. 감사합니다.
        </p>
      </Modal>

      {portalTarget && createPortal(
        <div className="absolute bottom-[71px] left-0 right-0 px-5 z-20 pointer-events-none">
          <button
            onClick={() => {
              if (currentUser?.status !== 'active') {
                setShowStatusModal(true);
                return;
              }
              router.push('/deals/new');
            }}
            className="
              w-full h-14
              bg-primary-400 hover:bg-primary-500
              text-white font-semibold text-lg
              rounded-xl
              flex items-center justify-center gap-2
              transition-colors
              shadow-lg
              pointer-events-auto
            "
          >
            송금 신청하기
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>,
        portalTarget
      )}
    </div>
  );
}

function DealCard({ deal }: { deal: IDeal }) {
  const statusConfig = DealHelper.getStatusConfig(deal.status);
  const typeConfig = DealHelper.getDealTypeConfig(deal.dealType);

  const statusColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <Link
      href={`/deals/${deal.did}`}
      className={cn(
        "block rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow",
        deal.status === 'awaiting_payment' && !deal.isPaid
          ? "bg-blue-50 border border-blue-200"
          : "bg-white"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {deal.status === 'awaiting_payment' && !deal.isPaid ? (
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                결제대기
              </span>
            ) : (
              <span className={cn(
                'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                statusColors[statusConfig.color]
              )}>
                {statusConfig.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{deal.did}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{deal.dealName}</h3>
      <p className="text-sm text-gray-500 mb-3">{typeConfig.name}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400">송금 금액</p>
          <p className="font-bold text-gray-900">{deal.amount.toLocaleString()}원</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">받는 분</p>
          <p className="text-sm text-gray-600">{deal.recipient.accountHolder}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {new Date(deal.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </Link>
  );
}
