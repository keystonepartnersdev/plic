'use client';
import { getErrorMessage } from '@/lib/utils';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, FileText, CreditCard, CheckCircle, Clock, XCircle, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { DealHelper } from '@/classes';
import { IUser, IDeal } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, dealsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getDeals(),
      ]);
      setUsers(usersResponse.users || []);
      setDeals(dealsResponse.deals || []);
    } catch (err: unknown) {
      console.error('대시보드 데이터 로드 실패:', err);
      setError(getErrorMessage(err) || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 통계 계산
  const totalUsers = users.length;
  const totalDeals = deals.length;
  const completedDeals = deals.filter((d) => d.status === 'completed');
  const completedDealsCount = completedDeals.length;
  const pendingDealsCount = deals.filter((d) => d.status && ['draft', 'awaiting_payment'].includes(d.status)).length;
  const cancelledDealsCount = deals.filter((d) => d.status === 'cancelled').length;
  const totalPaymentAmount = completedDeals.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  // 대기 목록 계산
  const pendingVerificationUsers = users.filter((u) => u.businessInfo?.verificationStatus === 'pending');
  const pendingReviewDeals = deals.filter((d) => d.status === 'reviewing');

  const stats = [
    {
      label: '총 회원 수',
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: '총 거래 건수',
      value: totalDeals.toLocaleString(),
      icon: FileText,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: '총 거래완료 건수',
      value: completedDealsCount.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: '총 대기 건수',
      value: pendingDealsCount.toLocaleString(),
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: '총 취소 건수',
      value: cancelledDealsCount.toLocaleString(),
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: '총 결제 금액',
      value: `${totalPaymentAmount.toLocaleString()}원`,
      icon: CreditCard,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div>
      {/* 페이지 헤더 - PLIC 디자인 시스템 적용 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1 font-medium">PLIC 서비스 운영 현황을 확인하세요.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-[#2563EB] rounded-xl text-gray-700 hover:text-[#2563EB] disabled:opacity-50 transition-all duration-300 font-medium"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} strokeWidth={2} />
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* 통계 카드 - PLIC 디자인 시스템 적용 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 대기 목록 (사업자 인증 대기 & 거래 검수 대기) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 사업자 인증 대기 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50">
                <Clock className="w-4 h-4 text-orange-500" strokeWidth={2} />
              </div>
              사업자 인증 대기
              {!loading && pendingVerificationUsers.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                  {pendingVerificationUsers.length}
                </span>
              )}
            </h3>
            <Link href="/admin/users?status=pending_verification" className="text-sm text-[#2563EB] hover:text-blue-700 font-medium flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-4 h-4" />
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
            ) : pendingVerificationUsers.length > 0 ? (
              pendingVerificationUsers.slice(0, 5).map((user) => (
                <Link
                  key={user.uid}
                  href={`/admin/users/${user.uid}`}
                  className="flex items-center justify-between p-4 hover:bg-blue-50/30 transition-colors duration-300"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.businessInfo?.businessName || user.email}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className="text-xs text-gray-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 font-medium">
                대기중인 회원이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 거래 검수 대기 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50">
                <AlertCircle className="w-4 h-4 text-purple-500" strokeWidth={2} />
              </div>
              거래 검수 대기
              {!loading && pendingReviewDeals.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                  {pendingReviewDeals.length}
                </span>
              )}
            </h3>
            <Link href="/admin/deals?status=reviewing" className="text-sm text-[#2563EB] hover:text-blue-700 font-medium flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-4 h-4" />
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
            ) : pendingReviewDeals.length > 0 ? (
              pendingReviewDeals.slice(0, 5).map((deal) => (
                <Link
                  key={deal.did}
                  href={`/admin/deals/${deal.did}`}
                  className="flex items-center justify-between p-4 hover:bg-blue-50/30 transition-colors duration-300"
                >
                  <div>
                    <p className="font-medium text-gray-900">{deal.dealName || '-'}</p>
                    <p className="text-sm text-gray-500">
                      {deal.senderName || '-'} · {(deal.amount || 0).toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                      검수대기
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 font-medium">
                대기중인 거래가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 거래 - PLIC 디자인 시스템 적용 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">최근 거래</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
            </div>
          ) : deals.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-bold">거래번호</th>
                  <th className="pb-3 font-bold">거래명</th>
                  <th className="pb-3 font-bold">금액</th>
                  <th className="pb-3 font-bold">상태</th>
                  <th className="pb-3 font-bold">생성일</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 5).map((deal) => (
                  <tr key={deal.did} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors duration-300">
                    <td className="py-4 text-sm font-mono text-gray-600">{deal.did}</td>
                    <td className="py-4 text-sm text-gray-900 font-medium">{deal.dealName || '-'}</td>
                    <td className="py-4 text-sm text-gray-900 font-bold">
                      {(deal.amount || 0).toLocaleString()}원
                    </td>
                    <td className="py-4">
                      {(() => {
                        const statusConfig = DealHelper.getStatusConfig(deal.status, deal.isPaid);
                        const colorMap: Record<string, string> = {
                          blue: 'bg-blue-100 text-blue-700',
                          yellow: 'bg-yellow-100 text-yellow-700',
                          orange: 'bg-orange-100 text-orange-700',
                          red: 'bg-red-100 text-red-700',
                          gray: 'bg-gray-100 text-gray-700',
                          green: 'bg-green-100 text-green-700',
                        };
                        return (
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${colorMap[statusConfig.color] || 'bg-gray-100 text-gray-700'}`}>
                            {statusConfig.name}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 text-sm text-gray-500 font-medium">
                      {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500 font-medium">
              거래 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
