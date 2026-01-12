'use client';

import { Users, FileText, CreditCard, TrendingUp } from 'lucide-react';
import { useUserStore, useDealStore, usePaymentStore } from '@/stores';

export default function AdminDashboardPage() {
  const { users } = useUserStore();
  const { deals } = useDealStore();
  const { payments } = usePaymentStore();

  // 통계 계산
  const totalUsers = users.length;
  const totalDeals = deals.length;
  const pendingDeals = deals.filter((d) =>
    ['pending', 'reviewing', 'hold'].includes(d.status)
  ).length;
  const completedDeals = deals.filter((d) => d.status === 'completed').length;
  const totalPaymentAmount = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalAmount, 0);

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
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">PLIC 서비스 운영 현황을 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 최근 거래 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">최근 거래</h2>
        </div>
        <div className="p-6">
          {deals.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">거래번호</th>
                  <th className="pb-3 font-medium">거래명</th>
                  <th className="pb-3 font-medium">금액</th>
                  <th className="pb-3 font-medium">상태</th>
                  <th className="pb-3 font-medium">생성일</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 5).map((deal) => (
                  <tr key={deal.did} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-sm font-mono text-gray-600">{deal.did}</td>
                    <td className="py-3 text-sm text-gray-900">{deal.dealName}</td>
                    <td className="py-3 text-sm text-gray-900">
                      {deal.amount.toLocaleString()}원
                    </td>
                    <td className="py-3">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${deal.status === 'completed' ? 'bg-green-100 text-green-700' :
                          deal.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                          deal.status === 'need_revision' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {deal.status === 'completed' ? '완료' :
                          deal.status === 'pending' ? '진행중' :
                          deal.status === 'need_revision' ? '보완필요' :
                          deal.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(deal.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              거래 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
