// src/lib/apiLogger.ts
// API 호출 로깅 유틸리티 - 디버깅 및 모니터링

const TRACKING_API_URL = '/api';

// Correlation ID 생성
const generateCorrelationId = () => {
  return `COR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 현재 요청의 Correlation ID
let currentCorrelationId: string | null = null;

export const getCorrelationId = () => {
  if (!currentCorrelationId) {
    currentCorrelationId = generateCorrelationId();
  }
  return currentCorrelationId;
};

export const newCorrelationId = () => {
  currentCorrelationId = generateCorrelationId();
  return currentCorrelationId;
};

// 민감 정보 마스킹
const SENSITIVE_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'idToken', 'secret', 'apiKey', 'Authorization'];

const maskSensitiveData = (data: unknown): unknown => {
  if (!data) return data;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  if (typeof data === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
};

// API 로그 엔트리
export interface ApiLogEntry {
  correlationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
  errorStack?: string;
  executionTime: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  level?: 'INFO' | 'WARN' | 'ERROR';
}

// 로그 버퍼
let logBuffer: ApiLogEntry[] = [];
let flushTimer: NodeJS.Timeout | null = null;
const BUFFER_SIZE = 5;
const FLUSH_INTERVAL = 10000; // 10초

// 사용자 ID
let currentUserId: string | undefined;

export const setApiLoggerUserId = (userId: string | undefined) => {
  currentUserId = userId;
};

// 로그 전송
const flushLogs = async () => {
  if (logBuffer.length === 0) return;

  const logsToSend = [...logBuffer];
  logBuffer = [];

  try {
    const response = await fetch(`${TRACKING_API_URL}/tracking/api-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
    });

    if (!response.ok) {
      console.error('API Log send error:', await response.text());
    }
  } catch (error) {
    console.error('API Log send error:', error);
  }
};

// 버퍼에 로그 추가
const bufferLog = (log: ApiLogEntry) => {
  logBuffer.push(log);

  if (logBuffer.length >= BUFFER_SIZE) {
    flushLogs();
  }

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushLogs();
      flushTimer = null;
    }, FLUSH_INTERVAL);
  }
};

// API 호출 래퍼
export const loggedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const correlationId = getCorrelationId();
  const startTime = Date.now();
  const method = options.method || 'GET';

  // 헤더에 Correlation ID 추가
  const headers = new Headers(options.headers);
  headers.set('X-Correlation-ID', correlationId);

  let requestBody: unknown;
  if (options.body && typeof options.body === 'string') {
    try {
      requestBody = JSON.parse(options.body);
    } catch {
      requestBody = options.body;
    }
  }

  let response: Response;
  let responseBody: unknown;
  let errorMessage: string | undefined;
  let errorStack: string | undefined;

  try {
    response = await fetch(url, { ...options, headers });

    // 응답 복제 (body는 한 번만 읽을 수 있으므로)
    const clonedResponse = response.clone();

    try {
      responseBody = await clonedResponse.json();
    } catch {
      responseBody = await clonedResponse.text();
    }

  } catch (error: unknown) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errorStack = error instanceof Error ? error.stack : undefined;

    // 에러 로그 기록
    bufferLog({
      correlationId,
      endpoint: new URL(url).pathname,
      method,
      statusCode: 0,
      requestBody: maskSensitiveData(requestBody),
      errorMessage,
      errorStack,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      level: 'ERROR',
    });

    throw error;
  }

  const executionTime = Date.now() - startTime;

  // 로그 기록
  bufferLog({
    correlationId,
    endpoint: new URL(url).pathname,
    method,
    statusCode: response.status,
    requestBody: maskSensitiveData(requestBody),
    responseBody: response.status >= 400 ? maskSensitiveData(responseBody) : undefined,
    executionTime,
    timestamp: new Date().toISOString(),
    userId: currentUserId,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    level: response.status >= 500 ? 'ERROR' : response.status >= 400 ? 'WARN' : 'INFO',
  });

  return response;
};

// 즉시 전송
export const flushApiLogs = () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushLogs();
};

// 페이지 언로드 시 전송
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushApiLogs();
  });
}

const apiLogger = {
  loggedFetch,
  getCorrelationId,
  newCorrelationId,
  setUserId: setApiLoggerUserId,
  flush: flushApiLogs,
};

export default apiLogger;
