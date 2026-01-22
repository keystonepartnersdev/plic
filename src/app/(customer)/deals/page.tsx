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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
      </div>
    );
  }

  const userDrafts = drafts.filter((d) => d.uid === currentUser?.uid && d.status && d.status === 'draft');
  const awaitingPaymentDeals = deals.filter((d) => d.status && d.status === 'awaiting_payment');
  const activeTabConfig = tabs.find((t) => t.id === activeTab) || tabs[0];
  const filteredDeals = deals.filter((d) => d.status && activeTabConfig.statuses.includes(d.status) && d.status !== 'awaiting_payment');

  const getTabCount = (tab: TabType) => {
    const tabConfig = tabs.find((t) => t.id === tab) || tabs[0];
    const dealCount = deals.filter((d) => d.status && tabConfig.statuses.includes(d.status)).length;
    if (tab === 'progress') {
      return dealCount + userDrafts.length;
    }
    return dealCount;
  };

  const handleDraftClick = (draftId: string) => {
    // pending_verification 상태에서도 드래프트 수정 허용 (결제 단계에서 체크)
    const canAccessDraft = currentUser?.status === 'active' || currentUser?.status === 'pending_verification';
    if (!canAccessDraft) {
      setShowStatusModal(true);
      return;
    }
    loadDraft(draftId);
    router.push(`/deals/new?draft=${draftId}`);
  };

  return (
    <div className="relative bg-gray-50 pb-24">
      <Header title="거래내역" />

      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 sticky top-14 z-10">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-4 text-center font-bold transition-all duration-300 relative',
                activeTab === tab.id ? 'text-[#2563EB]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
              {getTabCount(tab.id) > 0 && (
                <span className={cn(
                  'ml-1 text-sm font-semibold',
                  activeTab === tab.id ? 'text-[#2563EB]' : 'text-gray-400'
                )}>
                  {getTabCount(tab.id)}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
          </div>
        ) : (
          <>
            {activeTab === 'progress' && (userDrafts.length > 0 || awaitingPaymentDeals.length > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 mb-4">작성중</h3>
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
                  <h3 className="text-sm font-bold text-gray-500 mb-4">진행중</h3>
                )}
                {filteredDeals.map((deal) => (
                  <DealCard key={deal.did} deal={deal} />
                ))}
              </div>
            ) : (
              (activeTab !== 'progress' || (userDrafts.length === 0 && awaitingPaymentDeals.length === 0)) && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500 font-medium">
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
        title={currentUser?.status === 'pending_verification' ? '사업자 인증 안내' : '계정 상태 안내'}
      >
        {currentUser?.status === 'pending_verification' ? (
          <p>
            안녕하세요, <strong className="text-gray-900">{currentUser?.name}</strong>님!
            <br /><br />
            현재 회원님의 계정은 <strong className="text-[#2563EB]">가승인</strong> 상태로,
            사업자등록증 검수가 진행 중입니다.
            <br /><br />
            검수는 영업일 기준 당일 내에 완료되며, 승인 완료 시 바로 서비스 이용이 가능합니다.
            빠르게 처리해 드리겠습니다. 감사합니다.
          </p>
        ) : (
          <p>
            죄송합니다. 현재 <strong className="text-gray-900">{currentUser?.name}</strong>님의 계정은{' '}
            <strong className="text-gray-900">
              {currentUser?.status === 'pending' ? '대기' : '정지'}
            </strong>
            {' '}처리되었습니다. 원활한 서비스 이용을 위하여 고객센터로 문의주시면 친절하게 답변드리겠습니다. 감사합니다.
          </p>
        )}
      </Modal>

      {portalTarget && createPortal(
        <div className="absolute bottom-[71px] left-0 right-0 px-5 z-20 pointer-events-none">
          <button
            onClick={() => {
              // pending_verification 상태에서도 거래 생성 허용 (결제 단계에서 체크)
              const canCreateDeal = currentUser?.status === 'active' || currentUser?.status === 'pending_verification';
              if (!canCreateDeal) {
                setShowStatusModal(true);
                return;
              }
              router.push('/deals/new');
            }}
            className="
              w-full h-14
              bg-gradient-to-r from-[#2563EB] to-[#3B82F6]
              hover:shadow-xl hover:shadow-blue-500/30
              text-white font-semibold text-lg
              rounded-full
              flex items-center justify-center gap-2
              transition-all duration-300
              shadow-lg
              pointer-events-auto
              group
            "
          >
            송금 신청하기
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
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
        "block rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border group",
        deal.status === 'awaiting_payment' && !deal.isPaid
          ? "bg-blue-50/50 border-blue-100 hover:border-blue-200"
          : "bg-white border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {deal.status === 'awaiting_payment' && !deal.isPaid ? (
              <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white">
                결제대기
              </span>
            ) : (
              <span className={cn(
                'inline-flex px-3 py-1 text-xs font-bold rounded-full',
                statusColors[statusConfig.color]
              )}>
                {statusConfig.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">{deal.did}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all duration-300" strokeWidth={2} />
      </div>

      <h3 className="font-bold text-gray-900 mb-1">{deal.dealName}</h3>
      <p className="text-sm text-gray-500 mb-3 font-medium">{typeConfig.name}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400 font-medium">송금 금액</p>
          <p className="font-black text-[#2563EB]">{deal.amount.toLocaleString()}원</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-medium">받는 분</p>
          <p className="text-sm text-gray-700 font-semibold">{deal.recipient.accountHolder}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 font-medium">
        {new Date(deal.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </Link>
  );
}
