'use client';
import { getErrorMessage } from '@/lib/utils';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, FileText, Clock, Check, AlertCircle, X, RefreshCw } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { DealHelper } from '@/classes';
import { IDeal, TDealStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const statuses = [
    { value: 'all', label: '전체' },
    ...Object.entries(DealHelper.STATUS_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.name,
    })),
  ];

  const dealTypes = [
    { value: 'all', label: '전체' },
    ...Object.entries(DealHelper.DEAL_TYPE_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.name,
    })),
  ];

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDeals();
      setDeals(response.deals || []);
    } catch (err: unknown) {
      console.error('거래 목록 로드 실패:', err);
      setError(getErrorMessage(err) || '거래 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = (deal.dealName && deal.dealName.includes(searchQuery)) ||
      (deal.did && deal.did.includes(searchQuery)) ||
      (deal.recipient?.accountHolder && deal.recipient.accountHolder.includes(searchQuery));
    const matchesStatus = filterStatus === 'all' || deal.status === filterStatus;
    const matchesType = filterType === 'all' || deal.dealType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
  };

  const StatusIcon = ({ status }: { status: TDealStatus }) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
      case 'hold':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'need_revision':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 통계 계산
  const stats = {
    total: deals.length,
    pending: deals.filter(d => d.status && d.status === 'pending').length,
    reviewing: deals.filter(d => d.status && d.status === 'reviewing').length,
    completed: deals.filter(d => d.status && d.status === 'completed').length,
    totalAmount: deals.filter(d => d.status && d.status === 'completed').reduce((sum, d) => sum + (d.totalAmount || 0), 0),
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래정보</h1>
          <p className="text-gray-500 mt-1">전체 거래 목록을 관리합니다.</p>
        </div>
        <button
          onClick={fetchDeals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">전체 거래</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">대기중</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending + stats.reviewing}건</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">완료</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}건</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">총 결제액</p>
          <p className="text-2xl font-bold text-primary-400">{(stats.totalAmount / 10000).toFixed(0)}만원</p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="거래명, 거래번호, 수취인명 검색"
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {/* 유형 필터 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
          >
            {dealTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">거래정보</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">유형</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">상태</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">결제금액</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">수취인</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">일자</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length > 0 ? (
                  filteredDeals.map((deal) => {
                    const statusConfig = DealHelper.getStatusConfig(deal.status);
                    const typeConfig = DealHelper.getDealTypeConfig(deal.dealType);
                    return (
                      <tr key={deal.did} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{deal.dealName || '-'}</p>
                            <p className="text-xs text-gray-400 font-mono">{deal.did}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {typeConfig.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {deal.isPaid && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                                <Check className="w-3 h-3" />
                                결제완료
                              </span>
                            )}
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded',
                              statusColors[statusConfig.color]
                            )}>
                              <StatusIcon status={deal.status} />
                              {statusConfig.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {(deal.finalAmount || deal.totalAmount || 0).toLocaleString()}원
                          </p>
                          {deal.discountAmount > 0 && deal.discountCode && (
                            <p className="text-xs text-green-600">할인코드 {deal.discountCode}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            수수료 {((deal.feeAmount || 0) - (deal.discountAmount || 0)).toLocaleString()}원
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{deal.recipient?.accountHolder || '-'}</p>
                          <p className="text-xs text-gray-500">{deal.recipient?.bank || '-'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/deals/${deal.did}`}
                            className="text-primary-400 hover:text-primary-500"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                        ? '검색 결과가 없습니다.'
                        : '등록된 거래가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
