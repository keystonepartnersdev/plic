'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw, Eye, Monitor, Smartphone, Tablet, ArrowDown,
  Users, Activity, Globe, Download, MousePointer, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyData {
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    uniqueAnonymous: number;
    uniqueUsers: number;
    tabHidden: number;
    tabVisible: number;
  };
  eventTypeCounts: Record<string, number>;
  topPages: Array<{ path: string; count: number }>;
  scrollDepths: Record<number, number>;
  sessionMilestones: Record<string, number>;
  sectionViews: Record<string, number>;
  topClicks: Array<{ element: string; count: number }>;
  signupFunnel: Array<{ step: string; name: string; count: number }>;
  loginFunnel: Array<{ step: string; name: string; count: number }>;
  transferFunnel: Array<{ step: string; name: string; count: number }>;
  paymentFunnel: Array<{ step: string; name: string; count: number }>;
  topExitPages: Array<{ path: string; count: number }>;
  deviceCounts: Record<string, number>;
  dailyTrends: Array<{ date: string; events: number; sessions: number }>;
  utmSources: Record<string, number>;
  recentEvents: Array<Record<string, unknown>>;
  topErrors: Array<{ message: string; count: number }>;
}

// UTC → KST 변환
function toKST(timestamp: string): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function toKSTShort(timestamp: string): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// 이벤트 타입 한국어 매핑
const EVENT_TYPE_KR: Record<string, string> = {
  pageview: '페이지뷰',
  click: '클릭',
  funnel: '퍼널',
  error: '에러',
  performance: '성능',
  custom: '사용자정의',
};

// 엑셀(CSV) 다운로드
function downloadCSV(events: Array<Record<string, unknown>>) {
  const headers = ['시간(KST)', '이벤트유형', '이벤트명', '페이지', '유저구분', '세션ID', '익명ID'];
  const rows = events.map(e => [
    toKST(e.timestamp as string),
    EVENT_TYPE_KR[(e.eventType as string)] || (e.eventType as string),
    (e.eventName as string) || (e.funnel as Record<string, string>)?.name || '',
    (e.page as Record<string, string>)?.path || '',
    e.userId ? '가입자' : '미가입',
    (e.sessionId as string) || '',
    (e.anonymousId as string) || '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PLIC_트래킹_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// 퍼널 차트
function FunnelChart({ title, steps, color }: { title: string; steps: Array<{ name: string; count: number }>; color: string }) {
  const maxCount = Math.max(...steps.map(s => s.count), 1);
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const rate = i > 0 && steps[0].count > 0
            ? Math.round((step.count / steps[0].count) * 100) : 100;
          return (
            <div key={step.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{i + 1}. {step.name}</span>
                <span className="font-semibold">
                  {step.count}건
                  {i > 0 && <span className="text-gray-400 ml-1">({rate}%)</span>}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={cn('h-3 rounded-full transition-all', color)}
                  style={{ width: `${maxCount > 0 ? (step.count / maxCount) * 100 : 0}%` }} />
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="w-3 h-3 text-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 지표 카드
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export function UserJourneyTab() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'behavior' | 'events'>('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/user-journey');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error('유저 여정 데이터 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
        <span className="ml-2 text-gray-500">유저 여정 데이터 로딩 중...</span>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-gray-500">데이터를 불러올 수 없습니다.</div>;
  }

  const tabs = [
    { key: 'overview' as const, label: '전체 요약' },
    { key: 'funnel' as const, label: '퍼널 분석' },
    { key: 'behavior' as const, label: '행동 분석' },
    { key: 'events' as const, label: '이벤트 기록' },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(data.recentEvents)}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" /> 엑셀 다운로드
          </button>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-50 text-sm">
            <RefreshCw className="w-4 h-4" /> 새로고침
          </button>
        </div>
      </div>

      {/* 서브탭 */}
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1 mb-5">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 rounded-md text-sm font-medium transition-all flex-1',
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 전체 요약 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Activity} label="총 이벤트" value={data.summary.totalEvents.toLocaleString()} color="bg-blue-100 text-blue-600" />
            <StatCard icon={Globe} label="세션 수" value={data.summary.uniqueSessions.toLocaleString()} color="bg-green-100 text-green-600" />
            <StatCard icon={Users} label="미가입 방문자" value={data.summary.uniqueAnonymous.toLocaleString()} color="bg-orange-100 text-orange-600" />
            <StatCard icon={Users} label="가입 유저" value={data.summary.uniqueUsers.toLocaleString()} color="bg-purple-100 text-purple-600" />
            <StatCard icon={Eye} label="탭 이탈" value={data.summary.tabHidden} color="bg-red-100 text-red-600" />
            <StatCard icon={Eye} label="탭 복귀" value={data.summary.tabVisible} color="bg-emerald-100 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 이벤트 유형 분포 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">이벤트 유형 분포</h3>
              <div className="space-y-2">
                {Object.entries(data.eventTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{EVENT_TYPE_KR[type] || type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-400"
                          style={{ width: `${(count / data.summary.totalEvents) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-16 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 디바이스 분포 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">디바이스 분포</h3>
              <div className="flex justify-around items-center h-32">
                {[
                  { key: 'desktop', icon: Monitor, label: '데스크톱' },
                  { key: 'mobile', icon: Smartphone, label: '모바일' },
                  { key: 'tablet', icon: Tablet, label: '태블릿' },
                ].map(({ key, icon: DIcon, label }) => {
                  const total = Object.values(data.deviceCounts).reduce((a, b) => a + b, 0) || 1;
                  const count = data.deviceCounts[key] || 0;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={key} className="text-center">
                      <DIcon className="w-7 h-7 mx-auto mb-2 text-gray-400" />
                      <p className="text-xl font-bold text-gray-900">{pct}%</p>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-xs text-gray-400">{count}건</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 페이지별 방문 + 이탈 페이지 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">페이지별 방문 수 (상위 20)</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.topPages.map((p, i) => (
                  <div key={p.path} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 truncate flex-1">
                      <span className="text-gray-400 mr-2">{i + 1}.</span>{p.path}
                    </span>
                    <span className="text-sm font-semibold ml-2">{p.count}회</span>
                  </div>
                ))}
                {data.topPages.length === 0 && <p className="text-gray-400 text-sm">데이터 없음</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">이탈 페이지 (상위 10)</h3>
              <div className="space-y-2">
                {data.topExitPages.map((p, i) => (
                  <div key={p.path} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 truncate flex-1">
                      <span className="text-red-400 mr-2">{i + 1}.</span>{p.path}
                    </span>
                    <span className="text-sm font-semibold text-red-600 ml-2">{p.count}회</span>
                  </div>
                ))}
                {data.topExitPages.length === 0 && <p className="text-gray-400 text-sm">데이터 없음</p>}
              </div>
            </div>
          </div>

          {/* UTM 유입 소스 */}
          {Object.keys(data.utmSources).length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">유입 소스 (UTM)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(data.utmSources).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                  <div key={source} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{source}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일별 추이 */}
          {data.dailyTrends.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">일별 이벤트 추이 (최근 30일)</h3>
              <div className="overflow-x-auto">
                <div className="flex gap-1 items-end h-36 min-w-[600px]">
                  {data.dailyTrends.map(d => {
                    const maxEvents = Math.max(...data.dailyTrends.map(t => t.events), 1);
                    const h = (d.events / maxEvents) * 100;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 mb-1">{d.events}</span>
                        <div className="w-full bg-blue-400 rounded-t min-h-[2px]"
                          style={{ height: `${h}%` }}
                          title={`${d.date}: ${d.events}건, ${d.sessions}세션`} />
                        <span className="text-[8px] text-gray-400 mt-1 rotate-45 origin-left">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 퍼널 분석 */}
      {activeTab === 'funnel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FunnelChart title="회원가입 퍼널" steps={data.signupFunnel} color="bg-blue-400" />
          <FunnelChart title="로그인" steps={data.loginFunnel} color="bg-green-400" />
          <FunnelChart title="송금 퍼널" steps={data.transferFunnel} color="bg-purple-400" />
          <FunnelChart title="결제 퍼널" steps={data.paymentFunnel} color="bg-orange-400" />
        </div>
      )}

      {/* 행동 분석 */}
      {activeTab === 'behavior' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 스크롤 깊이 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">스크롤 깊이 분포</h3>
              <div className="space-y-4">
                {[25, 50, 75, 100].map(depth => {
                  const count = data.scrollDepths[depth] || 0;
                  const max = Math.max(...Object.values(data.scrollDepths), 1);
                  return (
                    <div key={depth}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{depth}% 도달</span>
                        <span className="font-semibold">{count}회</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className={cn('h-3 rounded-full',
                          depth <= 25 ? 'bg-green-300' : depth <= 50 ? 'bg-green-400' : depth <= 75 ? 'bg-green-500' : 'bg-green-600'
                        )} style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 체류 시간 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">체류 시간 마일스톤</h3>
              <div className="space-y-4">
                {Object.entries(data.sessionMilestones)
                  .sort((a, b) => {
                    const order = ['30초', '1분', '3분', '5분', '10분'];
                    return order.indexOf(a[0]) - order.indexOf(b[0]);
                  })
                  .map(([label, count]) => {
                    const max = Math.max(...Object.values(data.sessionMilestones), 1);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{label} 이상 체류</span>
                          <span className="font-semibold">{count}명</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div className="h-3 rounded-full bg-indigo-400"
                            style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(data.sessionMilestones).length === 0 && <p className="text-gray-400 text-sm">데이터 없음</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 랜딩 섹션 노출 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">랜딩 섹션 노출</h3>
              <div className="space-y-2">
                {Object.entries(data.sectionViews).sort((a, b) => b[1] - a[1]).map(([section, count]) => (
                  <div key={section} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-700 font-medium">{section}</span>
                    <span className="text-sm font-bold text-blue-600">{count}회</span>
                  </div>
                ))}
                {Object.keys(data.sectionViews).length === 0 && <p className="text-gray-400 text-sm">데이터 없음</p>}
              </div>
            </div>

            {/* 클릭 현황 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">클릭 현황</h3>
              <div className="space-y-2">
                {data.topClicks.map((c, i) => (
                  <div key={c.element} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-700">
                      <span className="text-gray-400 mr-2">{i + 1}.</span>{c.element}
                    </span>
                    <span className="text-sm font-bold text-purple-600">{c.count}회</span>
                  </div>
                ))}
                {data.topClicks.length === 0 && <p className="text-gray-400 text-sm">데이터 없음</p>}
              </div>
            </div>
          </div>

          {/* 에러 현황 */}
          {data.topErrors.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">에러 현황 (상위 10)</h3>
              <div className="space-y-2">
                {data.topErrors.map((e, i) => (
                  <div key={i} className="flex justify-between items-start bg-red-50 rounded-lg px-4 py-2">
                    <span className="text-sm text-red-700 break-all flex-1">{e.message}</span>
                    <span className="text-sm font-bold text-red-600 ml-2 whitespace-nowrap">{e.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 이벤트 기록 */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">최근 이벤트 (50건)</h3>
            <button onClick={() => downloadCSV(data.recentEvents)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border">
              <Download className="w-3.5 h-3.5" /> CSV 다운로드
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 px-2">시간(KST)</th>
                  <th className="py-2 px-2">유형</th>
                  <th className="py-2 px-2">이벤트명</th>
                  <th className="py-2 px-2">페이지</th>
                  <th className="py-2 px-2">유저구분</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((e, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-500 whitespace-nowrap text-xs">
                      {toKSTShort(e.timestamp as string)}
                    </td>
                    <td className="py-2 px-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        e.eventType === 'pageview' ? 'bg-blue-100 text-blue-700' :
                        e.eventType === 'click' ? 'bg-purple-100 text-purple-700' :
                        e.eventType === 'funnel' ? 'bg-green-100 text-green-700' :
                        e.eventType === 'error' ? 'bg-red-100 text-red-700' :
                        e.eventType === 'custom' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {EVENT_TYPE_KR[(e.eventType as string)] || (e.eventType as string)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-700 text-xs">
                      {(e.eventName as string) || (e.funnel as Record<string, string>)?.name || '-'}
                    </td>
                    <td className="py-2 px-2 text-gray-500 text-xs truncate max-w-[200px]">
                      {(e.page as Record<string, string>)?.path || '-'}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {e.userId
                        ? <span className="text-green-600 font-medium">가입자</span>
                        : <span className="text-orange-500">미가입</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentEvents.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">아직 수집된 이벤트가 없습니다</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
