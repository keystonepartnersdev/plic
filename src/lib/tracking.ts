// src/lib/tracking.ts
// 자체 트래킹 시스템 - 이벤트 수집 및 전송

// Next.js 프록시 사용으로 CORS 우회

// 세션/익명 ID 관리
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

  let sessionId = sessionStorage.getItem('plic_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('plic_session_id', sessionId);
  }
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

  // 모두 undefined면 undefined 반환
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

// 이벤트 타입
export interface TrackingEvent {
  eventType: 'pageview' | 'click' | 'funnel' | 'error' | 'performance' | 'custom';
  eventName?: string;
  sessionId: string;
  anonymousId: string;
  userId?: string;
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

// 이벤트 버퍼
let eventBuffer: TrackingEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5초

// 이벤트 전송
const flushEvents = async () => {
  if (eventBuffer.length === 0) return;

  const eventsToSend = [...eventBuffer];
  eventBuffer = [];

  try {
    const response = await fetch('/api/tracking/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend }),
    });

    if (!response.ok) {
      console.error('Tracking API error:', await response.text());
      // 실패 시 이벤트 복구
      eventBuffer = [...eventsToSend, ...eventBuffer];
    }
  } catch (error) {
    console.error('Tracking send error:', error);
    // 네트워크 오류 시 이벤트 복구
    eventBuffer = [...eventsToSend, ...eventBuffer];
  }
};

// 버퍼에 이벤트 추가
const bufferEvent = (event: TrackingEvent) => {
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

// 사용자 ID 저장
let currentUserId: string | undefined;

export const tracking = {
  // 사용자 식별
  identify: (userId: string) => {
    currentUserId = userId;
  },

  // 페이지뷰 추적
  pageview: (customData?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;

    const event: TrackingEvent = {
      eventType: 'pageview',
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      userId: currentUserId,
      timestamp: new Date().toISOString(),
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
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      userId: currentUserId,
      timestamp: new Date().toISOString(),
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
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      userId: currentUserId,
      timestamp: new Date().toISOString(),
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
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      userId: currentUserId,
      timestamp: new Date().toISOString(),
      page: getPageInfo(),
      error: { message, stack, filename, lineno },
    };

    bufferEvent(event);
  },

  // 성능 추적
  performance: (loadTime: number, domReady: number, firstPaint?: number) => {
    const event: TrackingEvent = {
      eventType: 'performance',
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      userId: currentUserId,
      timestamp: new Date().toISOString(),
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
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      userId: currentUserId,
      timestamp: new Date().toISOString(),
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

  // 송금 퍼널 헬퍼
  transferFunnel: {
    start: () => tracking.funnel('transfer_start', '송금 시작'),
    info: () => tracking.funnel('transfer_info', '정보 입력'),
    attachment: () => tracking.funnel('transfer_attachment', '증빙 업로드'),
    confirm: () => tracking.funnel('transfer_confirm', '확인'),
    complete: () => tracking.funnel('transfer_complete', '완료'),
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
