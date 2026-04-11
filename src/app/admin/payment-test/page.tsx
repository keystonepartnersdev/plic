'use client';

import { useState } from 'react';
import { CreditCard, ArrowRight, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

/**
 * 소프트먼트 결제 테스트 페이지
 *
 * 플로우:
 * 1. 거래등록 API → authPageUrl 받기
 * 2. authPageUrl 열기 (소프트먼트 결제창 - 카드정보 수기 입력)
 * 3. 인증 완료 → returnUrl(콜백)로 authorizationId 전달
 * 4. 승인요청 API → 결제 완료
 *
 * ※ DB 저장 없이 순수 결제 흐름만 테스트
 */
export default function PaymentTestPage() {
  const [amount, setAmount] = useState('1004');
  const [goodsName, setGoodsName] = useState('PLIC 결제 테스트');
  const [payerName, setPayerName] = useState('테스트');
  const [payerTel, setPayerTel] = useState('010-0000-0000');
  const [device, setDevice] = useState<'pc' | 'mobile'>('pc');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    step: string;
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR');
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleCreatePayment = async () => {
    setLoading(true);
    setResult(null);
    setLogs([]);

    try {
      const trackId = `TEST-${Date.now()}`;
      addLog(`거래등록 요청 시작 (trackId: ${trackId}, 금액: ${amount}원)`);

      const res = await fetch('/api/payment-test/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          amount: Number(amount),
          goodsName,
          payerName,
          payerTel,
          device,
        }),
      });

      const data = await res.json();
      addLog(`거래등록 응답: ${JSON.stringify(data)}`);

      if (data.success && data.data?.authPageUrl) {
        addLog(`✅ 거래등록 성공! 결제창 URL 발급됨`);
        addLog(`→ trxId: ${data.data.trxId}`);
        addLog(`→ 결제창을 새 탭으로 엽니다...`);

        setResult({
          step: '거래등록',
          success: true,
          data: data.data,
        });

        // 결제창 열기
        window.open(data.data.authPageUrl, '_blank', 'width=500,height=700');
      } else {
        addLog(`❌ 거래등록 실패: ${data.error || data.message || '알 수 없는 오류'}`);
        setResult({
          step: '거래등록',
          success: false,
          error: data.error || data.message,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '네트워크 오류';
      addLog(`❌ 에러: ${msg}`);
      setResult({ step: '거래등록', success: false, error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <CreditCard className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">소프트먼트 결제 테스트</h1>
              <p className="text-sm text-gray-500">개발 환경 (DB 저장 없음)</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <strong>테스트 모드:</strong> 실제 결제가 진행됩니다. 소액(1,004원)으로 테스트 후 취소해주세요.
          </div>
        </div>

        {/* 결제 플로우 설명 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-sm font-bold text-gray-500 mb-4">결제 플로우</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">① 거래등록</span>
            <ArrowRight size={14} className="text-gray-300" />
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">② 결제창 호출</span>
            <ArrowRight size={14} className="text-gray-300" />
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">③ 카드정보 입력</span>
            <ArrowRight size={14} className="text-gray-300" />
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">④ 승인완료</span>
          </div>
        </div>

        {/* 결제 정보 입력 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">결제 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">결제 금액 (원)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                placeholder="1004"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
              <input
                type="text"
                value={goodsName}
                onChange={(e) => setGoodsName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">구매자명</label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={payerTel}
                  onChange={(e) => setPayerTel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">디바이스</label>
              <div className="flex gap-3">
                {(['pc', 'mobile'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      device === d
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d === 'pc' ? '💻 PC' : '📱 모바일'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreatePayment}
            disabled={loading || !amount}
            className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                결제 테스트 시작
              </>
            )}
          </button>
        </div>

        {/* 결과 */}
        {result && (
          <div className={`rounded-2xl p-6 shadow-sm border mb-6 ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {result.success ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              <h3 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.step} - {result.success ? '성공' : '실패'}
              </h3>
            </div>

            {result.success && result.data && (
              <div className="space-y-2 text-sm">
                {typeof result.data.authPageUrl === 'string' && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-700">결제창이 새 탭에서 열렸습니다.</span>
                    <a
                      href={result.data.authPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      다시 열기 <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                <pre className="mt-2 p-3 bg-white/60 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.error && (
              <p className="text-sm text-red-700">{result.error}</p>
            )}
          </div>
        )}

        {/* 로그 */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 mb-3">📋 요청 로그</h3>
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className={`${
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('→') ? 'text-blue-400' :
                  'text-gray-300'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
