'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
import { adminAPI } from '@/lib/api';
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
    } catch (err: any) {
      console.error('대시보드 데이터 로드 실패:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
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
  const pendingDeals = deals.filter((d) =>
    d.status && ['pending', 'reviewing', 'hold'].includes(d.status)
  ).length;
  const completedDeals = deals.filter((d) => d.status && d.status === 'completed');
  const totalPaymentAmount = completedDeals.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

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
      label: '진행중 거래',
      value: pendingDeals.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-yellow-50 text-yellow-600',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
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
                      <span className={`
                        inline-flex px-3 py-1 text-xs font-bold rounded-full
                        ${deal.status === 'completed' ? 'bg-green-100 text-green-700' :
                          deal.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                          deal.status === 'need_revision' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {deal.status === 'completed' ? '완료' :
                          deal.status === 'pending' ? '진행중' :
                          deal.status === 'need_revision' ? '보완필요' :
                          deal.status || '-'}
                      </span>
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
