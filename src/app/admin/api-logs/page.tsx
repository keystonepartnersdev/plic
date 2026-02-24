'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  XCircle,
  Activity,
  Users,
  Shield,
  CreditCard,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { cn, getErrorMessage } from '@/lib/utils';

interface ApiLog {
  logId: string;
  correlationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  errorMessage?: string;
  executionTime: number;
  timestamp: string;
  userId?: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  action?: string; // 한글 설명
}

interface CategoryStats {
  total: number;
  success: number;
  error: number;
  avgTime: number;
  successRate: number;
}

interface ApiLogsData {
  stats: {
    total: number;
    success: number;
    clientError: number;
    serverError: number;
    networkError: number;
    avgExecutionTime: number;
    successRate: number;
  };
  categoryStats: Record<string, CategoryStats>;
  topErrors: Array<{
    endpoint: string;
    count: number;
    lastError: string;
    lastTime: string;
  }>;
  recentErrors: ApiLog[];
  slowRequests: Array<{
    endpoint: string;
    method: string;
    executionTime: number;
    timestamp: string;
    userId?: string;
  }>;
  hourlyStats: Array<{ hour: string; total: number; errors: number }>;
  usersWithMostErrors: Array<{ userId: string; errorCount: number }>;
  methodDistribution: Record<string, number>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  logs: ApiLog[];
  hasMore: boolean;
}

type StatusFilter = 'all' | 'error' | 'slow';
type ViewTab = 'overview' | 'errors' | 'logs';

const CATEGORY_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  auth: { name: '인증', icon: <Shield className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100' },
  deal: { name: '거래', icon: <FileText className="w-4 h-4" />, color: 'text-purple-600 bg-purple-100' },
  user: { name: '사용자', icon: <Users className="w-4 h-4" />, color: 'text-green-600 bg-green-100' },
  payment: { name: '결제', icon: <CreditCard className="w-4 h-4" />, color: 'text-orange-600 bg-orange-100' },
  content: { name: '콘텐츠', icon: <FileText className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100' },
  admin: { name: '관리자', icon: <Settings className="w-4 h-4" />, color: 'text-red-600 bg-red-100' },
};

export default function AdminApiLogsPage() {
  const [data, setData] = useState<ApiLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchCorrelationId, setSearchCorrelationId] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { limit: number; status?: 'error' | 'slow'; correlationId?: string } = { limit: 200 };
      if (statusFilter === 'error' || statusFilter === 'slow') {
        params.status = statusFilter;
      }
      if (searchCorrelationId) {
        params.correlationId = searchCorrelationId;
      }
      const response = await adminAPI.getApiLogs(params) as ApiLogsData;

      // 기본값 설정 - stats가 없는 경우 대비
      const defaultStats = {
        total: 0,
        success: 0,
        clientError: 0,
        serverError: 0,
        networkError: 0,
        avgExecutionTime: 0,
        successRate: 0,
      };

      setData({
        ...response,
        stats: response.stats || defaultStats,
        categoryStats: response.categoryStats || {},
        topErrors: response.topErrors || [],
        recentErrors: response.recentErrors || [],
        slowRequests: response.slowRequests || [],
        hourlyStats: response.hourlyStats || [],
        usersWithMostErrors: response.usersWithMostErrors || [],
        methodDistribution: response.methodDistribution || {},
        topEndpoints: response.topEndpoints || [],
        logs: response.logs || [],
        hasMore: response.hasMore || false,
      });
    } catch (err: unknown) {
      console.error('API Logs 데이터 로드 실패:', err);
      setError(getErrorMessage(err) || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (statusCode: number) => {
    if (statusCode === 0) return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    if (statusCode >= 500) return <XCircle className="w-4 h-4 text-red-500" />;
    if (statusCode >= 400) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (statusCode: number) => {
    if (statusCode === 0) return 'bg-gray-100 text-gray-700';
    if (statusCode >= 500) return 'bg-red-100 text-red-700';
    if (statusCode >= 400) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-700';
      case 'POST':
        return 'bg-green-100 text-green-700';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealthColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API 모니터링</h1>
          <p className="text-gray-500 mt-1">PLIC 서비스 API 상태 및 성능 모니터링</p>
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

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'overview', label: '개요', icon: Activity },
            { id: 'errors', label: '에러 분석', icon: AlertCircle },
            { id: 'logs', label: '로그 상세', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ViewTab)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-primary-500 border-primary-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
        </div>
      ) : !data || !data.stats ? (
        <div className="text-center py-16 text-gray-400">데이터를 불러올 수 없습니다</div>
      ) : (
        <>
          {/* 개요 탭 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 전체 상태 요약 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">API 성공률</span>
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className={cn('text-3xl font-bold', getHealthColor(data.stats.successRate))}>
                    {data.stats.successRate}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.stats.success.toLocaleString()} / {data.stats.total.toLocaleString()} 요청
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">평균 응답시간</span>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className={cn(
                    'text-3xl font-bold',
                    data.stats.avgExecutionTime > 2000 ? 'text-red-600' :
                    data.stats.avgExecutionTime > 1000 ? 'text-yellow-600' : 'text-green-600'
                  )}>
                    {data.stats.avgExecutionTime}ms
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.slowRequests?.length || 0}개 느린 요청
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">에러 발생</span>
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {(data.stats.clientError + data.stats.serverError).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    4xx: {data.stats.clientError} / 5xx: {data.stats.serverError}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">총 API 호출</span>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.stats.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    최근 수집 기준
                  </p>
                </div>
              </div>

              {/* PLIC 카테고리별 상태 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">기능별 API 상태</h3>
                {data.categoryStats && Object.keys(data.categoryStats).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(data.categoryStats).map(([category, stats]) => {
                      if (!stats) return null;
                      const config = CATEGORY_CONFIG[category] || {
                        name: category,
                        icon: <Activity className="w-4 h-4" />,
                        color: 'text-gray-600 bg-gray-100'
                      };
                      const successRate = stats.successRate ?? 0;
                      const avgTime = stats.avgTime ?? 0;
                      const errorCount = stats.error ?? 0;
                      return (
                        <div
                          key={category}
                          className="border border-gray-100 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className={cn('p-1.5 rounded-lg', config.color)}>
                              {config.icon}
                            </span>
                            <span className="font-medium text-gray-900">{config.name}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">성공률</span>
                              <span className={cn('font-medium', getHealthColor(successRate))}>
                                {successRate}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">평균응답</span>
                              <span className={cn(
                                'font-medium',
                                avgTime > 2000 ? 'text-red-600' :
                                avgTime > 1000 ? 'text-yellow-600' : 'text-gray-900'
                              )}>
                                {avgTime}ms
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">에러</span>
                              <span className={cn(
                                'font-medium',
                                errorCount > 0 ? 'text-red-600' : 'text-green-600'
                              )}>
                                {errorCount}건
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>아직 수집된 API 로그가 없습니다</p>
                    <p className="text-sm mt-1">서비스 사용 시 자동으로 수집됩니다</p>
                  </div>
                )}
              </div>

              {/* 상위 엔드포인트 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">자주 호출되는 API</h3>
                  {data.topEndpoints && data.topEndpoints.length > 0 ? (
                    <div className="space-y-3">
                      {data.topEndpoints.map((item, idx) => (
                        <div key={item.endpoint} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-400 w-4">{idx + 1}</span>
                          <span className="flex-1 font-mono text-sm text-gray-700 truncate">
                            {item.endpoint}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">데이터 없음</div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">느린 요청</h3>
                  {data.slowRequests && data.slowRequests.length > 0 ? (
                    <div className="space-y-3">
                      {data.slowRequests.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="flex-1 font-mono text-sm text-gray-700 truncate">
                            {item.endpoint}
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            {item.executionTime.toLocaleString()}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p>느린 요청 없음</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 에러 분석 탭 */}
          {activeTab === 'errors' && (
            <div className="space-y-6">
              {/* 에러 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-gray-700">클라이언트 에러 (4xx)</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">
                    {data.stats.clientError.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-gray-700">서버 에러 (5xx)</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {data.stats.serverError.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-gray-700">네트워크 에러</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-600">
                    {data.stats.networkError?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* 에러 발생 엔드포인트 순위 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">에러 발생 엔드포인트 TOP</h3>
                {data.topErrors && data.topErrors.length > 0 ? (
                  <div className="space-y-3">
                    {data.topErrors.map((item) => (
                      <div
                        key={item.endpoint}
                        className="flex items-center gap-4 p-3 bg-red-50 rounded-lg"
                      >
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-gray-700 truncate">{item.endpoint}</p>
                          <p className="text-xs text-red-600 truncate">{item.lastError}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-red-600">{item.count}</span>
                          <p className="text-xs text-gray-400">
                            {new Date(item.lastTime).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p>에러가 없습니다</p>
                  </div>
                )}
              </div>

              {/* 에러가 많은 사용자 */}
              {data.usersWithMostErrors && data.usersWithMostErrors.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">에러 발생 사용자</h3>
                  <div className="space-y-2">
                    {data.usersWithMostErrors.map((user) => (
                      <div key={user.userId} className="flex items-center justify-between py-2">
                        <span className="font-mono text-sm text-gray-600">{user.userId}</span>
                        <span className="text-sm font-medium text-red-600">{user.errorCount}건</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 최근 에러 목록 */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">최근 에러</h3>
                </div>
                {data.recentErrors && data.recentErrors.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {data.recentErrors.slice(0, 10).map((log) => (
                      <div key={log.logId} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(log.statusCode)}
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-mono font-medium',
                            getMethodBadge(log.method)
                          )}>
                            {log.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">
                              {log.action || log.endpoint}
                            </span>
                            {log.action && (
                              <span className="ml-2 font-mono text-xs text-gray-400">
                                {log.endpoint}
                              </span>
                            )}
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            getStatusBadge(log.statusCode)
                          )}>
                            {log.statusCode || 'Network Error'}
                          </span>
                        </div>
                        {log.errorMessage && (
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                            {log.errorMessage}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(log.timestamp).toLocaleString('ko-KR')} | {log.executionTime}ms
                          {log.userId && ` | User: ${log.userId}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">에러 로그가 없습니다</div>
                )}
              </div>
            </div>
          )}

          {/* 로그 상세 탭 */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* 필터 & 검색 */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* 상태 필터 */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {(['all', 'error', 'slow'] as StatusFilter[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setStatusFilter(filter)}
                          className={cn(
                            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                            statusFilter === filter
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          )}
                        >
                          {filter === 'all' ? '전체' : filter === 'error' ? '에러만' : '느린 요청'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Correlation ID 검색 */}
                  <form onSubmit={handleSearch} className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchCorrelationId}
                        onChange={(e) => setSearchCorrelationId(e.target.value)}
                        placeholder="Correlation ID로 검색"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                    </div>
                  </form>
                </div>
              </div>

              {/* 로그 목록 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">API 호출 로그</h3>
                  <span className="text-sm text-gray-500">{data.logs?.length || 0}건</span>
                </div>

                {data.logs && data.logs.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {data.logs.map((log) => (
                      <div key={log.logId} className="hover:bg-gray-50">
                        {/* 로그 요약 행 */}
                        <div
                          className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                          onClick={() =>
                            setExpandedLog(expandedLog === log.logId ? null : log.logId)
                          }
                        >
                          {getStatusIcon(log.statusCode)}

                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-mono font-medium',
                              getMethodBadge(log.method)
                            )}
                          >
                            {log.method}
                          </span>

                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">
                              {log.action || log.endpoint}
                            </span>
                            {log.action && (
                              <span className="ml-2 font-mono text-xs text-gray-400">
                                {log.endpoint}
                              </span>
                            )}
                          </div>

                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getStatusBadge(log.statusCode)
                            )}
                          >
                            {log.statusCode || 'ERR'}
                          </span>

                          <div className="flex items-center gap-1 text-xs text-gray-500 w-16">
                            <Clock className="w-3 h-3" />
                            {log.executionTime}ms
                          </div>

                          <span className="text-xs text-gray-400 w-28 text-right">
                            {new Date(log.timestamp).toLocaleString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {expandedLog === log.logId ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>

                        {/* 상세 정보 */}
                        {expandedLog === log.logId && (
                          <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <label className="text-xs font-medium text-gray-500">
                                  Correlation ID
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    {log.correlationId}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(log.correlationId)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    <Copy className="w-3 h-3 text-gray-400" />
                                  </button>
                                </div>
                              </div>

                              {log.userId && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    User ID
                                  </label>
                                  <code className="block text-xs bg-gray-100 px-2 py-1 rounded font-mono mt-1">
                                    {log.userId}
                                  </code>
                                </div>
                              )}

                              {log.errorMessage && (
                                <div className="col-span-2">
                                  <label className="text-xs font-medium text-red-500">
                                    Error Message
                                  </label>
                                  <div className="mt-1 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                                    {log.errorMessage}
                                  </div>
                                </div>
                              )}

                              {log.requestBody && (
                                <div className="col-span-2">
                                  <label className="text-xs font-medium text-gray-500">
                                    Request Body
                                  </label>
                                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-40">
                                    {JSON.stringify(log.requestBody, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {log.responseBody && (
                                <div className="col-span-2">
                                  <label className="text-xs font-medium text-gray-500">
                                    Response Body
                                  </label>
                                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-40">
                                    {JSON.stringify(log.responseBody, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>로그가 없습니다</p>
                    <p className="text-sm mt-1">서비스 사용 시 자동으로 수집됩니다</p>
                  </div>
                )}

                {data.hasMore && (
                  <div className="p-4 border-t border-gray-100 text-center">
                    <button className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                      더 보기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
