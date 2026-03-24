// src/lib/tracking.ts
// 자체 트래킹 시스템 - 이벤트 수집 및 전송

// === 세션 관리 (GA4 기준: 30분 비활성 타임아웃) ===
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분
const SESSION_ID_KEY = 'plic_session_id';
const SESSION_LAST_ACTIVITY_KEY = 'plic_session_last_activity';

const getAnonymousId = (): string => {
  if (typeof window === 'undefined') return '';

  let anonymousId = localStorage.getItem('plic_anonymous_id');
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('plic_anonymous_id', anonymousId);
  }
  return anonymousId;
};

const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  const now = Date.now();
  const lastActivity = Number(sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY) || '0');
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  // 30분 비활성 시 새 세션 생성
  if (!sessionId || (lastActivity > 0 && now - lastActivity > SESSION_TIMEOUT_MS)) {
    sessionId = `sess_${now}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  // 활동 시간 갱신
  sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));
  return sessionId;
};

// UTM 파라미터 추출
const getUtmParams = () => {
  if (typeof window === 'undefined') return undefined;

  const urlParams = new URLSearchParams(window.location.search);
  const utm = {
    source: urlParams.get('utm_source') || undefined,
    medium: urlParams.get('utm_medium') || undefined,
    campaign: urlParams.get('utm_campaign') || undefined,
    term: urlParams.get('utm_term') || undefined,
    content: urlParams.get('utm_content') || undefined,
  };

  if (Object.values(utm).every(v => !v)) return undefined;
  return utm;
};

// 디바이스 정보
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return undefined;

  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
  };
};

// 페이지 정보
const getPageInfo = () => {
  if (typeof window === 'undefined') return undefined;

  return {
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer || undefined,
  };
};

// === 이벤트 스키마 검증 ===
const VALID_EVENT_TYPES = ['pageview', 'click', 'funnel', 'error', 'performance', 'custom'] as const;
type ValidEventType = typeof VALID_EVENT_TYPES[number];

const VALID_FUNNEL_STEPS = [
  // 가입 퍼널
  'signup_start', 'signup_step_kakaoVerify', 'signup_step_info', 'signup_step_businessInfo', 'signup_complete', 'signup_abandon',
  // 로그인 퍼널
  'login_attempt', 'login_success', 'login_fail',
  // 송금 퍼널
  'transfer_start', 'transfer_info', 'transfer_recipient', 'transfer_attachment', 'transfer_confirm',
  'transfer_submitted', 'transfer_payment_complete', 'transfer_complete',
  // 결제 퍼널
  'payment_start', 'payment_attempt', 'payment_success', 'payment_fail',
];

const validateEvent = (event: TrackingEvent): boolean => {
  // eventType 검증
  if (!VALID_EVENT_TYPES.includes(event.eventType as ValidEventType)) return false;
  // 필수 필드 검증
  if (!event.sessionId || !event.anonymousId || !event.timestamp) return false;
  // 퍼널 이벤트 검증
  if (event.eventType === 'funnel' && event.funnel) {
    if (!VALID_FUNNEL_STEPS.includes(event.funnel.step)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[PLIC 트래킹] 알 수 없는 퍼널 스텝: ${event.funnel.step}`);
      }
    }
  }
  return true;
};

// 이벤트 타입
export interface TrackingEvent {
  eventType: 'pageview' | 'click' | 'funnel' | 'error' | 'performance' | 'custom';
  eventName?: string;
  sessionId: string;
  anonymousId: string;
  userId?: string;
  userRole?: 'user' | 'admin'; // 운영진 구분
  timestamp: string;
  page?: {
    path: string;
    title: string;
    referrer?: string;
  };
  device?: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  funnel?: {
    step: string;
    name: string;
  };
  click?: {
    element: string;
    text?: string;
    href?: string;
  };
  error?: {
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
  };
  performance?: {
    loadTime: number;
    domReady: number;
    firstPaint?: number;
  };
  custom?: Record<string, unknown>;
}

// === 이벤트 버퍼 (크기 제한 추가) ===
let eventBuffer: TrackingEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5초
const MAX_BUFFER_SIZE = 100; // 최대 버퍼 크기 (무한 누적 방지)

// 이벤트 전송 (sendBeacon 우선, fetch fallback)
const flushEvents = async () => {
  if (eventBuffer.length === 0) return;

  const eventsToSend = [...eventBuffer];
  eventBuffer = [];

  const payload = JSON.stringify({ events: eventsToSend });

  // sendBeacon: 페이지 이탈 시에도 전송 보장
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const sent = navigator.sendBeacon('/api/tracking/events', new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  // fetch fallback
  try {
    const response = await fetch('/api/tracking/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });

    if (!response.ok) {
      // 실패 시 버퍼에 다시 넣되 최대 크기 제한
      const combined = [...eventsToSend, ...eventBuffer];
      eventBuffer = combined.slice(-MAX_BUFFER_SIZE);
    }
  } catch {
    const combined = [...eventsToSend, ...eventBuffer];
    eventBuffer = combined.slice(-MAX_BUFFER_SIZE);
  }
};

// 버퍼에 이벤트 추가
const bufferEvent = (event: TrackingEvent) => {
  // 이벤트 검증
  if (!validateEvent(event)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PLIC 트래킹] 유효하지 않은 이벤트:', event);
    }
    return;
  }

  // 개발 모드에서만 로그
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log(`[PLIC 트래킹] ${event.eventType}${event.eventName ? `:${event.eventName}` : ''}${event.funnel ? `:${event.funnel.step}` : ''}`);
  }

  // 최대 버퍼 크기 초과 시 오래된 이벤트 폐기
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    eventBuffer = eventBuffer.slice(-Math.floor(MAX_BUFFER_SIZE / 2));
  }

  eventBuffer.push(event);

  // 버퍼가 차면 즉시 전송
  if (eventBuffer.length >= BUFFER_SIZE) {
    flushEvents();
  }

  // 타이머 설정
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushEvents();
      flushTimer = null;
    }, FLUSH_INTERVAL);
  }
};

// === 사용자 식별 ===
let currentUserId: string | undefined;
let currentUserRole: 'user' | 'admin' | undefined;

// /admin 경로 접근 시 localStorage에 마킹 (기기 단위 운영진 식별)
const ADMIN_MARKER_KEY = 'plic_is_admin';

const checkAdminMarker = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ADMIN_MARKER_KEY) === 'true';
};

const setAdminMarker = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_MARKER_KEY, 'true');
};

// 현재 페이지가 /admin이면 자동 마킹
if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
  setAdminMarker();
}

// 공통 이벤트 베이스 생성
const createBaseEvent = () => ({
  sessionId: getSessionId(),
  anonymousId: getAnonymousId(),
  userId: currentUserId,
  userRole: currentUserRole || (checkAdminMarker() ? 'admin' : 'user'),
  timestamp: new Date().toISOString(),
});

export const tracking = {
  // 사용자 식별 (role 추가)
  identify: (userId: string, role?: 'user' | 'admin') => {
    currentUserId = userId;
    currentUserRole = role || 'user';
  },

  // 페이지뷰 추적
  pageview: (customData?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;

    const event: TrackingEvent = {
      eventType: 'pageview',
      ...createBaseEvent(),
      page: getPageInfo(),
      device: getDeviceInfo(),
      utm: getUtmParams(),
      custom: customData,
    };

    bufferEvent(event);
  },

  // 클릭 추적
  click: (element: string, text?: string, href?: string, customData?: Record<string, unknown>) => {
    const event: TrackingEvent = {
      eventType: 'click',
      ...createBaseEvent(),
      page: getPageInfo(),
      click: { element, text, href },
      custom: customData,
    };

    bufferEvent(event);
  },

  // 퍼널 추적
  funnel: (step: string, name: string, customData?: Record<string, unknown>) => {
    const event: TrackingEvent = {
      eventType: 'funnel',
      ...createBaseEvent(),
      page: getPageInfo(),
      funnel: { step, name },
      custom: customData,
    };

    bufferEvent(event);
  },

  // 에러 추적
  error: (message: string, stack?: string, filename?: string, lineno?: number) => {
    const event: TrackingEvent = {
      eventType: 'error',
      ...createBaseEvent(),
      page: getPageInfo(),
      error: { message, stack, filename, lineno },
    };

    bufferEvent(event);
  },

  // 성능 추적
  performance: (loadTime: number, domReady: number, firstPaint?: number) => {
    const event: TrackingEvent = {
      eventType: 'performance',
      ...createBaseEvent(),
      page: getPageInfo(),
      device: getDeviceInfo(),
      performance: { loadTime, domReady, firstPaint },
    };

    bufferEvent(event);
  },

  // 커스텀 이벤트
  event: (eventName: string, customData?: Record<string, unknown>) => {
    const event: TrackingEvent = {
      eventType: 'custom',
      eventName,
      ...createBaseEvent(),
      page: getPageInfo(),
      custom: customData,
    };

    bufferEvent(event);
  },

  // 즉시 전송 (페이지 언로드 시)
  flush: () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushEvents();
  },

  // 버퍼 없이 즉시 전송 (페이지 떠나기 전 필수 이벤트용)
  sendNow: (...events: TrackingEvent[]) => {
    if (typeof navigator === 'undefined') return;
    // userRole 자동 첨부
    const enriched = events.map(e => ({ ...e, userRole: e.userRole || currentUserRole }));
    const payload = JSON.stringify({ events: enriched });
    try {
      navigator.sendBeacon('/api/tracking/events', new Blob([payload], { type: 'application/json' }));
    } catch {
      fetch('/api/tracking/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  },

  // 송금 퍼널 헬퍼 (재설계됨)
  transferFunnel: {
    start: () => tracking.funnel('transfer_start', '송금 시작'),
    info: () => tracking.funnel('transfer_info', '정보 입력'),
    recipient: () => tracking.funnel('transfer_recipient', '수취인 입력'),
    attachment: () => tracking.funnel('transfer_attachment', '증빙 업로드 완료'),
    confirm: () => tracking.funnel('transfer_confirm', '최종 확인'),
    submitted: () => tracking.funnel('transfer_submitted', '거래 생성'),
    paymentComplete: (dealId?: string) => tracking.funnel('transfer_payment_complete', '결제 완료', { dealId }),
    complete: () => tracking.funnel('transfer_complete', '송금 완료(승인)'),
  },

  // 가입 퍼널 헬퍼
  signupFunnel: {
    start: () => tracking.funnel('signup_start', '가입 시작'),
    step: (stepName: string) => tracking.funnel(`signup_step_${stepName}`, `가입 단계: ${stepName}`),
    complete: () => tracking.funnel('signup_complete', '가입 완료'),
    abandon: () => tracking.funnel('signup_abandon', '가입 이탈'),
  },

  // 로그인 퍼널 헬퍼
  loginFunnel: {
    attempt: () => tracking.funnel('login_attempt', '로그인 시도'),
    success: () => tracking.funnel('login_success', '로그인 성공'),
    fail: (reason?: string) => tracking.funnel('login_fail', '로그인 실패', { reason }),
  },

  // 결제 퍼널 헬퍼
  paymentFunnel: {
    start: (dealId?: string) => tracking.funnel('payment_start', '결제 진입', { dealId }),
    attempt: (dealId?: string) => tracking.funnel('payment_attempt', '결제 시도', { dealId }),
    success: (dealId?: string, amount?: number) => tracking.funnel('payment_success', '결제 성공', { dealId, amount }),
    fail: (dealId?: string, reason?: string) => tracking.funnel('payment_fail', '결제 실패', { dealId, reason }),
  },
};

// 전역 에러 핸들러 설정
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    tracking.error(
      event.message,
      event.error?.stack,
      event.filename,
      event.lineno
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    tracking.error(
      `Unhandled Promise Rejection: ${event.reason}`,
      event.reason?.stack
    );
  });

  // 페이지 언로드 시 이벤트 전송
  window.addEventListener('beforeunload', () => {
    tracking.flush();
  });

  // 성능 측정
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfEntry) {
        tracking.performance(
          perfEntry.loadEventEnd - perfEntry.startTime,
          perfEntry.domContentLoadedEventEnd - perfEntry.startTime,
          perfEntry.responseStart - perfEntry.startTime
        );
      }
    }, 100);
  });
}

export default tracking;
