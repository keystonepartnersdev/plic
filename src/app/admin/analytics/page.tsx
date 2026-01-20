'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Building,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// API 기본 URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod';

interface BusinessAnalyticsData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    pendingVerification: number;
    totalDeals: number;
    completedDeals: number;
    totalTransactionAmount: number;
    totalFeeRevenue: number;
  };
  userStatusDistribution: {
    total: number;
    pending_verification: number;
    active: number;
    suspended: number;
    pending: number;
    withdrawn: number;
  };
  userGradeDistribution: {
    basic: number;
    platinum: number;
    b2b: number;
    employee: number;
  };
  registrationFunnel: {
    totalSignups: number;
    pendingVerification: number;
    verificationCompleted: number;
    firstDealCreated: number;
    firstPaymentCompleted: number;
    firstDealCompleted: number;
  };
  registrationConversion: {
    signupToVerification: number;
    verificationToFirstDeal: number;
    firstDealToPayment: number;
    paymentToComplete: number;
  };
  dealStatusDistribution: {
    total: number;
    awaiting_payment: number;
    pending: number;
    reviewing: number;
    hold: number;
    need_revision: number;
    completed: number;
    cancelled: number;
  };
  dealConversion: {
    creationToPayment: number;
    paymentToComplete: number;
    overallCompletion: number;
  };
  revenueMetrics: {
    totalTransactionAmount: number;
    totalFeeRevenue: number;
    totalPaymentAmount: number;
    averageTransactionAmount: number;
    averageFeeAmount: number;
    completedDealCount: number;
    paidDealCount: number;
  };
  dealTypeAnalysis: Array<{ type: string; count: number; amount: number }>;
  transferFunnel: Array<{
    step: string;
    name: string;
    count: number;
    conversionFromPrev: number;
    conversionFromStart: number;
  }>;
  trends: {
    dailySignups: Array<{ date: string; count: number }>;
    dailyDeals: Array<{ date: string; count: number }>;
    dailyAmount: Array<{ date: string; amount: number }>;
  };
  pendingReviewDeals: Array<{
    did: string;
    dealName: string;
    amount: number;
    status: string;
    isPaid: boolean;
    createdAt: string;
    userName: string;
  }>;
  pendingVerificationUsers: Array<{
    uid: string;
    name: string;
    email: string;
    phone: string;
    businessName?: string;
    createdAt: string;
  }>;
}

const DEAL_TYPE_LABELS: Record<string, string> = {
  goods_purchase: '물품매입',
  labor_cost: '인건비',
  service_fee: '용역대금',
  construction: '공사대금',
  rent: '임대료',
  equipment: '장비대여',
  material: '자재비',
  transport: '운송비',
  advertising: '광고비',
  maintenance: '유지보수',
  consulting: '컨설팅',
  other: '기타',
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: '결제대기',
  pending: '진행중',
  reviewing: '검토중',
  hold: '보류',
  need_revision: '보완필요',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-purple-100 text-purple-700',
  hold: 'bg-orange-100 text-orange-700',
  need_revision: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<BusinessAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('plic_admin_token');
      const response = await fetch(`${API_BASE}/admin/business-analytics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || '데이터 로드 실패');
      }
    } catch (err: any) {
      console.error('Business Analytics 로드 실패:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toLocaleString()}만`;
    }
    return amount.toLocaleString();
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">비즈니스 Analytics</h1>
          <p className="text-gray-500 mt-1">PLIC 핵심 지표 및 전환율 분석</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 핵심 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard
              label="전체 회원"
              value={data?.summary.totalUsers || 0}
              subLabel={`활성 ${data?.summary.activeUsers || 0}명`}
              icon={Users}
              color="bg-blue-50 text-blue-600"
            />
            <SummaryCard
              label="인증 대기"
              value={data?.summary.pendingVerification || 0}
              subLabel="사업자 검수 필요"
              icon={Building}
              color="bg-orange-50 text-orange-600"
              urgent={data?.summary.pendingVerification ? data.summary.pendingVerification > 0 : false}
            />
            <SummaryCard
              label="총 거래액"
              value={formatAmount(data?.summary.totalTransactionAmount || 0)}
              subLabel={`${data?.summary.completedDeals || 0}건 완료`}
              icon={Wallet}
              color="bg-green-50 text-green-600"
              isAmount
            />
            <SummaryCard
              label="수수료 수익"
              value={formatAmount(data?.summary.totalFeeRevenue || 0)}
              subLabel="누적 수익"
              icon={TrendingUp}
              color="bg-purple-50 text-purple-600"
              isAmount
            />
          </>
        )}
      </div>

      {/* 가입 퍼널 & 사용자 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 가입 → 첫 거래 퍼널 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <BarChart3 className="inline w-5 h-5 mr-2 text-primary-400" />
            가입 → 첫 거래 퍼널
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <FunnelStep
                step={1}
                name="회원가입 완료"
                count={data?.registrationFunnel.totalSignups || 0}
                rate={100}
                isFirst
              />
              <FunnelStep
                step={2}
                name="사업자 인증 완료"
                count={data?.registrationFunnel.verificationCompleted || 0}
                rate={data?.registrationConversion.signupToVerification || 0}
              />
              <FunnelStep
                step={3}
                name="첫 거래 생성"
                count={data?.registrationFunnel.firstDealCreated || 0}
                rate={data?.registrationConversion.verificationToFirstDeal || 0}
              />
              <FunnelStep
                step={4}
                name="첫 결제 완료"
                count={data?.registrationFunnel.firstPaymentCompleted || 0}
                rate={data?.registrationConversion.firstDealToPayment || 0}
              />
              <FunnelStep
                step={5}
                name="첫 거래 완료"
                count={data?.registrationFunnel.firstDealCompleted || 0}
                rate={data?.registrationConversion.paymentToComplete || 0}
              />
            </div>
          )}
        </div>

        {/* 사용자 현황 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Users className="inline w-5 h-5 mr-2 text-primary-400" />
            사용자 현황
          </h3>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-gray-100 rounded" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ) : (
            <>
              {/* 상태별 분포 */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">상태별 분포</p>
                <div className="grid grid-cols-3 gap-3">
                  <StatusBox
                    label="인증 대기"
                    count={data?.userStatusDistribution.pending_verification || 0}
                    color="bg-orange-100 text-orange-700"
                    icon={Clock}
                  />
                  <StatusBox
                    label="활성"
                    count={data?.userStatusDistribution.active || 0}
                    color="bg-green-100 text-green-700"
                    icon={CheckCircle}
                  />
                  <StatusBox
                    label="정지"
                    count={data?.userStatusDistribution.suspended || 0}
                    color="bg-red-100 text-red-700"
                    icon={XCircle}
                  />
                </div>
              </div>

              {/* 등급별 분포 */}
              <div>
                <p className="text-sm text-gray-500 mb-3">등급별 분포 (활성 회원)</p>
                <div className="grid grid-cols-4 gap-2">
                  <GradeBox label="베이직" count={data?.userGradeDistribution.basic || 0} color="bg-gray-100" />
                  <GradeBox label="플래티넘" count={data?.userGradeDistribution.platinum || 0} color="bg-purple-100" />
                  <GradeBox label="B2B" count={data?.userGradeDistribution.b2b || 0} color="bg-blue-100" />
                  <GradeBox label="임직원" count={data?.userGradeDistribution.employee || 0} color="bg-green-100" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 거래 현황 & 전환율 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 거래 상태 분포 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <FileText className="inline w-5 h-5 mr-2 text-primary-400" />
            거래 현황
          </h3>
          {loading ? (
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {data?.dealStatusDistribution.awaiting_payment || 0}
                  </p>
                  <p className="text-xs text-gray-500">결제대기</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {data?.dealStatusDistribution.reviewing || 0}
                  </p>
                  <p className="text-xs text-gray-500">검토중</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {data?.dealStatusDistribution.need_revision || 0}
                  </p>
                  <p className="text-xs text-gray-500">보완필요</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {data?.dealStatusDistribution.completed || 0}
                  </p>
                  <p className="text-xs text-gray-500">완료</p>
                </div>
              </div>

              {/* 전환율 */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">거래 전환율</p>
                <ConversionBar
                  label="거래생성 → 결제"
                  rate={data?.dealConversion.creationToPayment || 0}
                />
                <ConversionBar
                  label="결제 → 완료"
                  rate={data?.dealConversion.paymentToComplete || 0}
                />
                <ConversionBar
                  label="전체 완료율"
                  rate={data?.dealConversion.overallCompletion || 0}
                  highlight
                />
              </div>
            </>
          )}
        </div>

        {/* 매출 지표 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <CreditCard className="inline w-5 h-5 mr-2 text-primary-400" />
            매출 지표
          </h3>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <MetricRow
                label="총 거래액"
                value={`${formatAmount(data?.revenueMetrics.totalTransactionAmount || 0)}원`}
                subValue={`${data?.revenueMetrics.completedDealCount || 0}건 완료`}
              />
              <MetricRow
                label="총 수수료 수익"
                value={`${formatAmount(data?.revenueMetrics.totalFeeRevenue || 0)}원`}
                highlight
              />
              <MetricRow
                label="평균 거래액"
                value={`${formatAmount(data?.revenueMetrics.averageTransactionAmount || 0)}원`}
                subValue="건당 평균"
              />
              <MetricRow
                label="평균 수수료"
                value={`${formatAmount(data?.revenueMetrics.averageFeeAmount || 0)}원`}
                subValue="건당 평균"
              />
            </div>
          )}
        </div>
      </div>

      {/* 대기 목록 (인증 대기 & 검수 대기) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 사업자 인증 대기 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              <Clock className="inline w-4 h-4 mr-2 text-orange-500" />
              사업자 인증 대기
            </h3>
            <Link href="/admin/users?status=pending_verification" className="text-sm text-primary-400 hover:text-primary-500">
              전체보기 <ChevronRight className="inline w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              ))
            ) : data?.pendingVerificationUsers && data.pendingVerificationUsers.length > 0 ? (
              data.pendingVerificationUsers.slice(0, 5).map((user) => (
                <Link
                  key={user.uid}
                  href={`/admin/users/${user.uid}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.businessName || user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                대기중인 회원이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 거래 검수 대기 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              <AlertCircle className="inline w-4 h-4 mr-2 text-purple-500" />
              거래 검수 대기
            </h3>
            <Link href="/admin/deals?status=reviewing" className="text-sm text-primary-400 hover:text-primary-500">
              전체보기 <ChevronRight className="inline w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              ))
            ) : data?.pendingReviewDeals && data.pendingReviewDeals.length > 0 ? (
              data.pendingReviewDeals.slice(0, 5).map((deal) => (
                <Link
                  key={deal.did}
                  href={`/admin/deals/${deal.did}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{deal.dealName}</p>
                    <p className="text-sm text-gray-500">
                      {deal.userName} · {deal.amount.toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      STATUS_COLORS[deal.status]
                    )}>
                      {STATUS_LABELS[deal.status]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                대기중인 거래가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 거래 유형별 분석 */}
      {data?.dealTypeAnalysis && data.dealTypeAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">거래 유형별 분석</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.dealTypeAnalysis.map((type) => (
              <div key={type.type} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {DEAL_TYPE_LABELS[type.type] || type.type}
                </p>
                <p className="text-lg font-bold text-gray-900">{type.count}건</p>
                <p className="text-xs text-gray-500">{formatAmount(type.amount)}원</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 요약 카드 컴포넌트
function SummaryCard({
  label,
  value,
  subLabel,
  icon: Icon,
  color,
  urgent,
  isAmount,
}: {
  label: string;
  value: number | string;
  subLabel: string;
  icon: any;
  color: string;
  urgent?: boolean;
  isAmount?: boolean;
}) {
  return (
    <div className={cn(
      'bg-white rounded-xl p-6 shadow-sm',
      urgent && 'ring-2 ring-orange-400'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {isAmount ? value : typeof value === 'number' ? value.toLocaleString() : value}
            {isAmount && <span className="text-sm font-normal text-gray-500">원</span>}
          </p>
          <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

// 퍼널 단계 컴포넌트
function FunnelStep({
  step,
  name,
  count,
  rate,
  isFirst,
}: {
  step: number;
  name: string;
  count: number;
  rate: number;
  isFirst?: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          {step}. {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{count}명</span>
          {!isFirst && (
            <span className={cn(
              'flex items-center text-xs px-2 py-0.5 rounded',
              rate >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              <ArrowRight className="w-3 h-3 mr-1" />
              {rate}%
            </span>
          )}
        </div>
      </div>
      <div className="h-6 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full bg-primary-400 rounded flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
          style={{ width: `${Math.max(rate, 5)}%` }}
        >
          {rate > 15 && `${rate}%`}
        </div>
      </div>
    </div>
  );
}

// 상태 박스 컴포넌트
function StatusBox({
  label,
  count,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: any;
}) {
  return (
    <div className={cn('p-3 rounded-lg text-center', color)}>
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <p className="text-xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

// 등급 박스 컴포넌트
function GradeBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={cn('p-2 rounded-lg text-center', color)}>
      <p className="text-lg font-bold text-gray-900">{count}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

// 전환율 바 컴포넌트
function ConversionBar({
  label,
  rate,
  highlight,
}: {
  label: string;
  rate: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={cn(
          'font-semibold',
          highlight ? 'text-primary-400' : 'text-gray-900'
        )}>
          {rate}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            highlight ? 'bg-primary-400' : rate >= 70 ? 'bg-green-500' : rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

// 매출 지표 행 컴포넌트
function MetricRow({
  label,
  value,
  subValue,
  highlight,
}: {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg',
      highlight ? 'bg-primary-50' : 'bg-gray-50'
    )}>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
      <p className={cn(
        'text-lg font-bold',
        highlight ? 'text-primary-600' : 'text-gray-900'
      )}>
        {value}
      </p>
    </div>
  );
}
