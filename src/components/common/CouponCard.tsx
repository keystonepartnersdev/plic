'use client';

import { Ticket, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CouponCardProps {
  couponId: string;       // plic-user-coupons id (쿠폰 코드 생성 기준)
  name: string;
  discountType: string;
  discountValue: number;
  issuedAt?: string;
  expiresAt: string;
  usedCount?: number;
  maxUsage?: number;
  isUsed?: boolean;
  // 모달 선택 모드
  canApply?: boolean;
  applyReason?: string;
  onSelect?: () => void;
}

function toShortCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function discountLabel(type: string, value: number): string {
  if (type === 'amount') return `${value.toLocaleString()}원 할인`;
  if (type === 'feePercent') return `수수료 ${value}% 할인`;
  if (type === 'feeOverride') return `수수료 ${value}%로 변경`;
  if (type === 'feeDiscount') return `수수료 ${value}%p 차감`;
  return '';
}

function usageLabel(usedCount: number, maxUsage: number): string {
  if (maxUsage >= 999999) return '무제한';
  if (maxUsage <= 1) return '1회 사용';
  return `${usedCount}/${maxUsage}회`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function CouponCard({
  couponId,
  name,
  discountType,
  discountValue,
  issuedAt,
  expiresAt,
  usedCount = 0,
  maxUsage = 1,
  isUsed = false,
  canApply,
  applyReason,
  onSelect,
}: CouponCardProps) {
  const isExpired = new Date(expiresAt) < new Date();
  const isSelectMode = onSelect !== undefined;
  const dimmed = isUsed || isExpired;

  return (
    <div
      onClick={() => isSelectMode && canApply && onSelect?.()}
      className={cn(
        'bg-white rounded-xl overflow-hidden border',
        isSelectMode && canApply && 'cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors border-2 border-gray-200',
        isSelectMode && !canApply && 'opacity-60 cursor-not-allowed border-2 border-gray-100',
        !isSelectMode && !dimmed && 'border border-primary-100',
        !isSelectMode && dimmed && 'opacity-60 border border-gray-100',
      )}
    >
      {/* 상단: 쿠폰명 + 할인 내용 */}
      <div className="px-4 pt-4 pb-3 border-b border-dashed border-gray-200">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <Ticket className={cn('w-4 h-4 flex-shrink-0', dimmed ? 'text-gray-300' : 'text-primary-400')} />
            <span className="font-semibold text-gray-900 text-sm">{name}</span>
          </div>
          {!isSelectMode && (
            isUsed ? (
              <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Check className="w-3 h-3" />사용완료
              </span>
            ) : isExpired ? (
              <span className="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
                <X className="w-3 h-3" />만료
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-primary-50 text-primary-500 text-xs font-bold rounded-full flex-shrink-0">
                사용가능
              </span>
            )
          )}
        </div>
        <p className={cn('text-xl font-bold mt-1', dimmed ? 'text-gray-300' : 'text-primary-500')}>
          {discountLabel(discountType, discountValue)}
        </p>
      </div>

      {/* 하단: 상세 정보 */}
      <div className="px-4 py-3 bg-gray-50 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">쿠폰 코드</span>
          <span className="font-mono font-semibold text-gray-600 tracking-wider">{toShortCode(couponId)}</span>
        </div>
        {issuedAt && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">지급일</span>
            <span className="text-gray-600">{formatDate(issuedAt)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">만료일</span>
          <span className={cn('font-medium', isExpired ? 'text-red-500' : 'text-gray-600')}>
            {formatDate(expiresAt)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">사용 횟수</span>
          <span className="text-gray-600">{usageLabel(usedCount, maxUsage)}</span>
        </div>
      </div>

      {/* 적용 불가 사유 (모달 선택 모드) */}
      {isSelectMode && !canApply && applyReason && (
        <div className="px-4 py-2 bg-red-50 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-500">{applyReason}</p>
        </div>
      )}
    </div>
  );
}
