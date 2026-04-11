'use client';

// src/components/deal/detail/DealHistory.tsx
// 거래 이력 컴포넌트 — statusHistory + paidAt + createdAt 통합 표시

import { IDeal, IDealStatusHistory } from '@/types';
import { DealHelper } from '@/classes';
import { cn } from '@/lib/utils';

interface DealHistoryProps {
  deal: IDeal;
}

interface TimelineItem {
  timestamp: string;
  label: string;
  sub?: string;
  isLatest?: boolean;
}

function statusLabel(status: IDealStatusHistory['newStatus'], isPaid?: boolean): string {
  return DealHelper.getStatusConfig(status, isPaid).name;
}

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function DealHistory({ deal }: DealHistoryProps) {
  const items: TimelineItem[] = [];

  // 1. 거래 생성
  if (deal.createdAt) {
    items.push({ timestamp: deal.createdAt, label: '거래 신청' });
  }

  // 2. statusHistory (상태 변경 이력) — 오래된 순 정렬
  const statusHistoryAsc = [...(deal.statusHistory || [])].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  for (const h of statusHistoryAsc) {
    const label = statusLabel(h.newStatus, deal.isPaid);
    const sub = h.reason ? `사유: ${h.reason}` : undefined;
    items.push({ timestamp: h.changedAt, label, sub });
  }

  // 3. 결제 완료 (paidAt이 있고 statusHistory에 없는 경우 보완)
  if (deal.isPaid && deal.paidAt) {
    const alreadyHas = items.some(i => i.label === '결제완료' || (i.timestamp === deal.paidAt));
    if (!alreadyHas) {
      items.push({ timestamp: deal.paidAt, label: '결제완료' });
    }
  }

  // 4. 송금 완료
  if (deal.isTransferred && deal.transferredAt) {
    items.push({ timestamp: deal.transferredAt, label: '송금완료' });
  }

  // 5. deal.history (보완 요청 등 사용자 액션)
  for (const h of (deal.history || [])) {
    items.push({ timestamp: h.timestamp, label: h.action, sub: h.description });
  }

  // 시간순 정렬 후 최신 항목 표시
  items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (items.length > 0) items[items.length - 1].isLatest = true;

  if (items.length === 0) {
    return (
      <div className="bg-white px-5 py-4 mb-2">
        <h3 className="font-semibold text-gray-900 mb-3">거래 이력</h3>
        <p className="text-gray-500 text-sm">거래 이력이 없습니다.</p>
      </div>
    );
  }

  // 최신순으로 뒤집어서 표시
  const displayItems = [...items].reverse();

  return (
    <div className="bg-white px-5 py-4 mb-2">
      <h3 className="font-semibold text-gray-900 mb-4">거래 이력</h3>
      <div className="space-y-0">
        {displayItems.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1',
                index === 0 ? 'bg-primary-400' : 'bg-gray-300'
              )} />
              {index < displayItems.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[16px]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className={cn(
                'font-medium',
                index === 0 ? 'text-gray-900' : 'text-gray-500'
              )}>
                {item.label}
              </p>
              {item.sub && (
                <p className="text-sm text-gray-400 mt-0.5">{item.sub}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{formatTs(item.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
