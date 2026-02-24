// src/lib/api.ts
// Phase 2.1: 환경 설정 중앙화 - API_BASE_URL을 config에서 가져옴

import { API_CONFIG } from './config';
import { IUser, IDeal, IHomeBanner, INotice, IFAQ, IDiscount, IAdmin } from '@/types';

const API_BASE_URL = API_CONFIG.BASE_URL;

// 토큰 저장소 (레거시 호환용 - httpOnly 쿠키로 전환됨)
// 어드민 토큰만 localStorage 사용 (별도 인증 체계)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// ============================================
// API 로깅 유틸리티
// ============================================
const generateCorrelationId = () => `COR${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

interface ApiLogEntry {
  correlationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
  executionTime: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  action?: string; // 한글 설명
}

// 엔드포인트별 한글 설명
const getActionDescription = (endpoint: string, method: string): string => {
  // 정확한 매칭
  const exactMatches: Record<string, Record<string, string>> = {
    '/auth/signup': { POST: '회원가입' },
    '/auth/confirm': { POST: '이메일 인증' },
    '/auth/login': { POST: '로그인' },
    '/auth/refresh': { POST: '토큰 갱신' },
    '/auth/logout': { POST: '로그아웃' },
    '/users/me': { GET: '내 정보 조회', PUT: '내 정보 수정', DELETE: '회원 탈퇴' },
    '/users/me/business': { PUT: '사업자등록증 재제출' },
    '/users/me/grade': { GET: '등급/수수료 조회' },
    '/deals': { GET: '거래 목록 조회', POST: '거래 생성' },
    '/discounts/validate': { POST: '할인코드 검증' },
    '/discounts/coupons': { GET: '쿠폰 목록 조회' },
    '/content/banners': { GET: '배너 조회' },
    '/content/notices': { GET: '공지사항 목록' },
    '/content/faqs': { GET: 'FAQ 조회' },
    '/uploads/presigned-url': { POST: '파일 업로드 URL 요청' },
    '/admin/auth/login': { POST: '관리자 로그인' },
    '/admin/users': { GET: '회원 목록 조회' },
    '/admin/deals': { GET: '거래 목록 조회 (관리자)' },
    '/admin/banners': { GET: '배너 목록', POST: '배너 등록' },
    '/admin/notices': { GET: '공지사항 목록', POST: '공지사항 등록' },
    '/admin/faqs': { GET: 'FAQ 목록', POST: 'FAQ 등록' },
    '/admin/discounts': { GET: '할인코드 목록', POST: '할인코드 등록' },
    '/admin/admins': { GET: '관리자 목록', POST: '관리자 등록' },
    '/admin/analytics': { GET: '분석 데이터 조회' },
    '/admin/business-analytics': { GET: '비즈니스 분석 조회' },
  };

  if (exactMatches[endpoint]?.[method]) {
    return exactMatches[endpoint][method];
  }

  // 패턴 매칭 (동적 ID 포함)
  if (endpoint.match(/^\/deals\/[^/]+$/)) {
    if (method === 'GET') return '거래 상세 조회';
    if (method === 'PUT') return '거래 수정';
    if (method === 'DELETE') return '거래 취소';
  }
  if (endpoint.match(/^\/deals\/[^/]+\/discount$/)) {
    return '할인 적용';
  }
  if (endpoint.match(/^\/content\/notices\/[^/]+$/)) {
    return '공지사항 상세';
  }
  if (endpoint.match(/^\/admin\/users\/[^/]+$/)) {
    return '회원 상세 조회';
  }
  if (endpoint.match(/^\/admin\/users\/[^/]+\/status$/)) {
    return '회원 상태 변경';
  }
  if (endpoint.match(/^\/admin\/users\/[^/]+\/grade$/)) {
    return '회원 등급 변경';
  }
  if (endpoint.match(/^\/admin\/users\/[^/]+\/settings$/)) {
    return '회원 수수료/한도 설정';
  }
  if (endpoint.match(/^\/admin\/users\/[^/]+\/business$/)) {
    return '사업자 인증 처리';
  }
  if (endpoint.match(/^\/admin\/deals\/[^/]+$/)) {
    return '거래 상세 조회 (관리자)';
  }
  if (endpoint.match(/^\/admin\/deals\/[^/]+\/status$/)) {
    return '거래 상태 변경';
  }
  if (endpoint.match(/^\/admin\/banners\/[^/]+$/)) {
    if (method === 'PUT') return '배너 수정';
    if (method === 'DELETE') return '배너 삭제';
  }
  if (endpoint.match(/^\/admin\/notices\/[^/]+$/)) {
    if (method === 'PUT') return '공지사항 수정';
    if (method === 'DELETE') return '공지사항 삭제';
  }
  if (endpoint.match(/^\/admin\/faqs\/[^/]+$/)) {
    if (method === 'PUT') return 'FAQ 수정';
    if (method === 'DELETE') return 'FAQ 삭제';
  }
  if (endpoint.match(/^\/admin\/discounts\/[^/]+$/)) {
    if (method === 'GET') return '할인코드 상세';
    if (method === 'PUT') return '할인코드 수정';
    if (method === 'DELETE') return '할인코드 삭제';
  }
  if (endpoint.match(/^\/admin\/admins\/[^/]+$/)) {
    if (method === 'GET') return '관리자 상세';
    if (method === 'PUT') return '관리자 수정';
    if (method === 'DELETE') return '관리자 삭제';
  }

  // 기본값
  return `${method} ${endpoint}`;
};

// 로그 즉시 전송 (비동기, fire-and-forget)
const sendLog = (log: ApiLogEntry) => {
  if (typeof window === 'undefined') return;

  // fetch 사용 (fire-and-forget) - Next.js 프록시 경유 (CORS 우회)
  fetch('/api/tracking/api-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs: [log] }),
    keepalive: true,
  }).catch(() => {
    // 에러 무시 (fire-and-forget)
  });
};

// 로그 전송 (action 설명 추가)
const queueLog = (log: ApiLogEntry) => {
  const action = getActionDescription(log.endpoint, log.method);
  sendLog({ ...log, action });
};

// 현재 사용자 ID 가져오기 (로그용)
const getCurrentUserId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const userStore = localStorage.getItem('plic-user-storage');
    if (userStore) {
      const parsed = JSON.parse(userStore);
      return parsed.state?.currentUser?.uid;
    }
  } catch {
    // ignore
  }
  return undefined;
};

// 토큰 관리 (레거시 호환용 - 사용자 토큰은 httpOnly 쿠키로 전환됨)
// 참고: 사용자 인증은 secureAuth (/lib/auth.ts) 사용 권장
export const tokenManager = {
  // @deprecated httpOnly 쿠키 사용으로 더 이상 필요하지 않음
  setTokens: (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;
    // localStorage 저장 제거 - httpOnly 쿠키 사용
    console.warn('[tokenManager] setTokens is deprecated. Use secureAuth instead.');
  },
  // @deprecated httpOnly 쿠키 사용으로 더 이상 필요하지 않음
  getAccessToken: () => {
    return accessToken;
  },
  // @deprecated httpOnly 쿠키 사용으로 더 이상 필요하지 않음
  getRefreshToken: () => {
    return refreshToken;
  },
  // @deprecated httpOnly 쿠키 사용으로 더 이상 필요하지 않음
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
  },
};

// 공개 API 엔드포인트 (인증 불필요, credentials 제외)
const PUBLIC_ENDPOINTS = [
  '/content/banners',
  '/content/notices',
  '/content/faqs',
  '/content/terms',
  '/tracking/',
];

// 엔드포인트가 공개 API인지 확인
const isPublicEndpoint = (endpoint: string): boolean => {
  return PUBLIC_ENDPOINTS.some(pub => endpoint.startsWith(pub));
};

// API 요청 함수
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  skipLogging = false
): Promise<T> {
  // /content/* 엔드포인트는 /api/content/* 프록시 라우트로 리다이렉트
  const apiEndpoint = endpoint.startsWith('/content/') ? `/api${endpoint}` : endpoint;
  const url = `${API_BASE_URL}${apiEndpoint}`;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 인증 토큰 추가 (공개 API가 아닌 경우에만)
  const isPublic = isPublicEndpoint(endpoint);
  const token = tokenManager.getAccessToken();
  if (token && !isPublic) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: unknown;
  try {
    requestBody = options.body ? JSON.parse(options.body as string) : undefined;
  } catch {
    requestBody = options.body;
  }

  let response: Response;
  let data: { success: boolean; data?: T; error?: string; message?: string };

  try {
    // 공개 API는 credentials 제외 (CORS 정책 호환)
    // 인증 필요 API는 credentials: 'include'로 httpOnly 쿠키 전송
    response = await fetch(url, {
      ...options,
      headers,
      ...(isPublic ? {} : { credentials: 'include' as RequestCredentials }),
    });

    data = await response.json();

    // 토큰 만료 시 갱신 시도 (httpOnly 쿠키 기반, 인증 필요 API만)
    if (response.status === 401 && !isPublic) {
      try {
        // httpOnly 쿠키 기반 토큰 갱신
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // 쿠키가 자동으로 갱신되므로 재요청만 수행
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            credentials: 'include' as RequestCredentials,
          });
          const retryData = await retryResponse.json();

          // 로그 기록 (재시도)
          if (!skipLogging && !endpoint.includes('/tracking/')) {
            queueLog({
              correlationId,
              endpoint,
              method,
              statusCode: retryResponse.status,
              requestBody,
              responseBody: retryResponse.status >= 400 ? retryData : undefined,
              errorMessage: !retryResponse.ok ? retryData?.error : undefined,
              executionTime: Date.now() - startTime,
              timestamp: new Date().toISOString(),
              userId: getCurrentUserId(),
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            });
          }

          if (!retryResponse.ok || !retryData.success) {
            throw new Error(retryData.error || '요청 처리 중 오류가 발생했습니다.');
          }
          return retryData.data as T;
        } else {
          // 토큰 갱신 실패
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
      } catch {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    // 로그 기록
    if (!skipLogging && !endpoint.includes('/tracking/')) {
      queueLog({
        correlationId,
        endpoint,
        method,
        statusCode: response.status,
        requestBody,
        responseBody: response.status >= 400 ? data : undefined,
        errorMessage: !response.ok || !data.success ? data?.error : undefined,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        userId: getCurrentUserId(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
    }

    // 401 에러 처리
    if (response.status === 401) {
      // 로그인 요청이 아닌 경우에만 토큰 삭제 (인증된 API 호출 실패)
      if (!endpoint.includes('/auth/login')) {
        tokenManager.clearTokens();
      }
      // 백엔드 에러 메시지가 있으면 그대로 사용, 없으면 기본 메시지
      const errorMessage = data?.error || data?.message;
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
    }

    return data.data as T;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // 네트워크 에러 등 로깅
    if (!skipLogging && !endpoint.includes('/tracking/')) {
      queueLog({
        correlationId,
        endpoint,
        method,
        statusCode: 0,
        requestBody,
        errorMessage,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        userId: getCurrentUserId(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
    }
    throw error;
  }
}

// ============================================
// Auth API (Next.js 프록시 사용 - CORS 우회)
// ============================================
export const authAPI = {
  signup: async (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    userType: 'personal' | 'business';
    businessInfo?: {
      businessName: string;
      businessNumber: string;
      representativeName: string;
      businessLicenseKey?: string;
    };
    agreements: {
      service: boolean;
      privacy: boolean;
      thirdParty: boolean;
      marketing: boolean;
    };
    // 카카오 인증 정보
    kakaoVerified?: boolean;
    kakaoId?: number;
    // 카카오 인증 키 (백엔드에서 직접 DynamoDB 조회)
    kakaoVerificationKey?: string;
  }) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '회원가입에 실패했습니다.');
    }
    return result.data as { message: string; uid: string };
  },

  confirm: async (data: { email: string; code: string }) => {
    const response = await fetch('/api/auth/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '이메일 인증에 실패했습니다.');
    }
    return result.data as { message: string };
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '로그인에 실패했습니다.');
    }
    // 토큰은 httpOnly 쿠키로 자동 저장됨
    return result.data as { user: IUser };
  },

  refresh: async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      tokenManager.clearTokens();
    }
  },
};

// ============================================
// 인증 프록시 요청 헬퍼 (401 시 자동 토큰 갱신)
// ============================================
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, { ...options, credentials: 'include' });

  if (response.status === 401) {
    // 토큰 갱신 시도
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // 갱신 성공 → 원래 요청 재시도
      return fetch(url, { ...options, credentials: 'include' });
    }
    // 갱신 실패 → 원래 401 응답 반환
  }

  return response;
}

// ============================================
// Users API (Next.js 프록시 사용 - CORS 우회)
// ============================================
export const usersAPI = {
  getMe: async () => {
    const response = await fetchWithAuth('/api/users/me');
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || data.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return data.data as IUser;
  },

  updateMe: async (data: { name?: string; phone?: string; agreements?: { marketing?: boolean } }) => {
    const response = await fetchWithAuth('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { message: string; user: IUser };
  },

  withdraw: async () => {
    const response = await fetchWithAuth('/api/users/me', {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || data.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return data.data as { message: string };
  },

  getGrade: async () => {
    const response = await fetchWithAuth('/api/users/me/grade');
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || data.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return data.data as {
      grade: { code: string; name: string; isManual: boolean };
      fee: { rate: number; rateText: string };
      limit: { monthly: number; used: number; remaining: number; usagePercent: number };
      stats: { totalPaymentAmount: number; totalDealCount: number; lastMonthPaymentAmount: number };
    };
  },

  resubmitBusinessVerification: async (businessLicenseKey: string) => {
    const response = await fetchWithAuth('/api/users/me/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessLicenseKey }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || data.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return data.data as { message: string; uid: string; verificationStatus: string };
  },
};

// ============================================
// Deals API (Next.js 프록시 사용 - CORS 우회)
// ============================================
export const dealsAPI = {
  list: async (params?: { status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    const response = await fetchWithAuth(`/api/deals${queryString ? `?${queryString}` : ''}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { deals: IDeal[]; total: number };
  },

  get: async (did: string) => {
    const response = await fetchWithAuth(`/api/deals/${did}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { deal: IDeal };
  },

  create: async (data: {
    dealName: string;
    dealType: string;
    amount: number;
    recipient: { bank: string; accountNumber: string; accountHolder: string; isVerified?: boolean };
    senderName: string;
    attachments?: string[];
  }) => {
    const response = await fetchWithAuth('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { message: string; deal: IDeal };
  },

  update: async (did: string, data: Partial<IDeal>) => {
    const response = await fetchWithAuth(`/api/deals/${did}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { message: string; deal: IDeal };
  },

  cancel: async (did: string) => {
    const response = await fetchWithAuth(`/api/deals/${did}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { message: string; did: string };
  },

  applyDiscount: async (did: string, discountId: string) => {
    const response = await fetchWithAuth(`/api/deals/${did}/discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discountId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || data.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return data.data as { message: string; deal: IDeal };
  },
};

// ============================================
// Discounts API (Next.js 프록시 사용 - CORS 우회)
// ============================================
export const discountsAPI = {
  validate: async (data: { code: string; amount: number }) => {
    const response = await fetchWithAuth('/api/discounts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { valid: boolean; discount: IDiscount };
  },

  getCoupons: async () => {
    const response = await fetchWithAuth('/api/discounts/coupons');
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || data.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return data.data as { coupons: IDiscount[]; total: number };
  },
};

// ============================================
// Content API
// ============================================
export const contentAPI = {
  getBanners: () => request<{ banners: IHomeBanner[] }>('/content/banners'),

  getNotices: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request<{ notices: INotice[]; total: number }>(`/content/notices${query}`);
  },

  getNoticeDetail: (id: string) => request<{ notice: INotice }>(`/content/notices/${id}`),

  getFaqs: (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return request<{ faqs: IFAQ[]; grouped: Record<string, IFAQ[]>; total: number }>(`/content/faqs${query}`);
  },

  // 약관 조회
  getTerms: () => request<{ terms: Array<{
    type: string;
    title: string;
    content: string;
    version: string;
    effectiveDate: string;
  }> }>('/content/terms'),

  getTermsDetail: (type: 'service' | 'privacy' | 'electronic' | 'marketing') =>
    request<{ terms: {
      type: string;
      title: string;
      content: string;
      version: string;
      effectiveDate: string;
    } }>(`/content/terms/${type}`),
};

// ============================================
// Uploads API (Next.js 프록시 사용 - CORS 우회)
// ============================================
export type UploadType = 'business-license' | 'contract' | 'bank-statement' | 'attachment' | 'temp';

export const uploadsAPI = {
  getPresignedUrl: async (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadType: UploadType;
    entityId?: string;
  }) => {
    const response = await fetchWithAuth('/api/uploads/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.error || '요청 처리 중 오류가 발생했습니다.');
    }
    return result.data as { uploadUrl: string; fileKey: string; expiresIn: number };
  },
};

// ============================================
// Admin API
// ============================================
export const adminAPI = {
  login: async (data: { email: string; password: string }) => {
    // Next.js API 프록시를 통해 로그인 (CORS 우회)
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || '로그인에 실패했습니다.');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('plic_admin_token', result.data.token);
    }
    return result.data as { admin: IAdmin; token: string };
  },

  // 회원 관리
  getUsers: (params?: { status?: string; grade?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.grade) query.append('grade', params.grade);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();

    return requestWithAdminToken<{ users: IUser[]; total: number }>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUser: (uid: string) => requestWithAdminToken<{ user: IUser; recentDeals: IDeal[] }>(`/admin/users/${uid}`),

  updateUserStatus: (uid: string, status: string, reason?: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/users/${uid}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),

  updateUserGrade: (uid: string, grade: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/users/${uid}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ grade }),
    }),

  // 거래 관리
  getDeals: (params?: { status?: string; uid?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.uid) query.append('uid', params.uid);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();

    return requestWithAdminToken<{ deals: IDeal[]; total: number }>(`/admin/deals${queryString ? `?${queryString}` : ''}`);
  },

  getDeal: (did: string) => requestWithAdminToken<{ deal: IDeal; user: IUser }>(`/admin/deals/${did}`),

  updateDealStatus: (did: string, status: string, reason?: string, revisionType?: 'documents' | 'recipient', revisionMemo?: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/deals/${did}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason, revisionType, revisionMemo }),
    }),

  updateDeal: (did: string, data: Partial<IDeal>) =>
    requestWithAdminToken<{ message: string; deal: IDeal }>(`/admin/deals/${did}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // 개별 사용자 수수료/한도 설정
  updateUserSettings: (uid: string, settings: { feeRate?: number; monthlyLimit?: number }) =>
    requestWithAdminToken<{ message: string; uid: string; feeRate: number; monthlyLimit: number }>(`/admin/users/${uid}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // 사업자 인증 관리
  updateBusinessVerification: (uid: string, status: 'verified' | 'rejected', memo?: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/users/${uid}/business`, {
      method: 'PUT',
      body: JSON.stringify({ status, memo }),
    }),

  // 배너 관리
  createBanner: (data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    priority: number;
    isVisible: boolean;
  }) => requestWithAdminToken<{ message: string; banner: IHomeBanner }>('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateBanner: (id: string, data: Partial<{
    title: string;
    imageUrl: string;
    linkUrl: string;
    priority: number;
    isVisible: boolean;
  }>) => requestWithAdminToken<{ message: string; banner: IHomeBanner }>(`/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteBanner: (id: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/banners/${id}`, {
      method: 'DELETE',
    }),

  // 공지사항 관리
  createNotice: (data: {
    title: string;
    content: string;
    category: string;
    isPinned?: boolean;
    isVisible?: boolean;
  }) => requestWithAdminToken<{ message: string; notice: INotice }>('/admin/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateNotice: (id: string, data: Partial<{
    title: string;
    content: string;
    category: string;
    isPinned: boolean;
    isVisible: boolean;
  }>) => requestWithAdminToken<{ message: string; notice: INotice }>(`/admin/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteNotice: (id: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/notices/${id}`, {
      method: 'DELETE',
    }),

  // FAQ 관리
  getFaqs: () =>
    requestWithAdminToken<{ faqs: IFAQ[]; count: number }>('/admin/faqs'),

  createFaq: (data: {
    question: string;
    answer: string;
    category: string;
    priority?: number;
    isVisible?: boolean;
    isHomeFeatured?: boolean;
  }) => requestWithAdminToken<{ message: string; faq: IFAQ }>('/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateFaq: (id: string, data: Partial<{
    question: string;
    answer: string;
    category: string;
    priority: number;
    isVisible: boolean;
    isHomeFeatured: boolean;
  }>) => requestWithAdminToken<{ message: string; faq: IFAQ }>(`/admin/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteFaq: (id: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/faqs/${id}`, {
      method: 'DELETE',
    }),

  // 관리자 계정 관리
  getAdmins: () => requestWithAdminToken<{ admins: IAdmin[]; count: number }>('/admin/admins'),

  getAdmin: (adminId: string) => requestWithAdminToken<{ admin: IAdmin }>(`/admin/admins/${adminId}`),

  createAdmin: (data: {
    email: string;
    name: string;
    phone?: string;
    role: 'super' | 'operator' | 'cs';
    password: string;
  }) => requestWithAdminToken<{ message: string; admin: IAdmin }>('/admin/admins', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateAdmin: (adminId: string, data: Partial<{
    name: string;
    phone: string;
    role: 'super' | 'operator' | 'cs';
    status: 'active' | 'inactive' | 'suspended';
    password: string;
    isLocked: boolean;
  }>) => requestWithAdminToken<{ message: string; admin: IAdmin }>(`/admin/admins/${adminId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteAdmin: (adminId: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/admins/${adminId}`, {
      method: 'DELETE',
    }),

  // 할인코드/쿠폰 관리
  getDiscounts: (type?: 'code' | 'coupon') => {
    const query = type ? `?type=${type}` : '';
    return requestWithAdminToken<{ discounts: IDiscount[]; count: number }>(`/admin/discounts${query}`);
  },

  getDiscount: (discountId: string) =>
    requestWithAdminToken<{ discount: IDiscount }>(`/admin/discounts/${discountId}`),

  createDiscount: (data: {
    name: string;
    code?: string;
    type: 'code' | 'coupon';
    discountType: 'amount' | 'feePercent';
    discountValue: number;
    minAmount?: number;
    startDate?: string;
    expiry?: string;
    canStack?: boolean;
    isReusable?: boolean;
    description?: string;
    allowedGrades?: string[];
    targetGrades?: string[];
    targetUserIds?: string[];
  }) => requestWithAdminToken<{ message: string; discount: IDiscount }>('/admin/discounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateDiscount: (discountId: string, data: Partial<{
    name: string;
    code: string;
    discountType: 'amount' | 'feePercent';
    discountValue: number;
    minAmount: number;
    startDate: string;
    expiry: string;
    canStack: boolean;
    isReusable: boolean;
    isActive: boolean;
    description: string;
    allowedGrades: string[];
    targetGrades: string[];
    targetUserIds: string[];
  }>) => requestWithAdminToken<{ message: string; discount: IDiscount }>(`/admin/discounts/${discountId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteDiscount: (discountId: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/discounts/${discountId}`, {
      method: 'DELETE',
    }),

  // Analytics & API Logs
  getAnalytics: (range?: 'today' | 'week' | 'month') => {
    const query = range ? `?range=${range}` : '';
    return requestWithAdminToken<{
      range: string;
      period: { start: string; end: string };
      stats: {
        totalEvents: number;
        uniqueSessions: number;
        uniqueUsers: number;
        uniqueAnonymous: number;
      };
      eventTypeCounts: Record<string, number>;
      topPages: Array<{ path: string; count: number }>;
      transferFunnel: Array<{ step: string; name: string; count: number }>;
      errors: Array<{ message: string; page: string; timestamp: string; count: number }>;
      devices: { desktop: number; mobile: number; tablet: number };
      dailyTrend: Array<{ date: string; count: number }>;
      sessionTrend: Array<{ date: string; count: number }>;
      performance: { avgLoadTime: number; avgDomReady: number } | null;
    }>(`/admin/analytics${query}`);
  },

  getApiLogs: (params?: { logId?: string; correlationId?: string; status?: 'error' | 'slow'; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.logId) query.append('logId', params.logId);
    if (params?.correlationId) query.append('correlationId', params.correlationId);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();

    return requestWithAdminToken<{
      logs?: Array<{
        logId: string;
        correlationId: string;
        endpoint: string;
        method: string;
        statusCode: number;
        requestBody?: unknown;
        responseBody?: unknown;
        errorMessage?: string;
        executionTime: number;
        timestamp: string;
        userId?: string;
        level: 'INFO' | 'WARN' | 'ERROR';
      }>;
      log?: ApiLogEntry;
      stats: {
        total: number;
        success: number;
        clientError: number;
        serverError: number;
        avgExecutionTime: number;
      };
      topErrors: Array<{ endpoint: string; count: number }>;
      hasMore: boolean;
    }>(`/admin/api-logs${queryString ? `?${queryString}` : ''}`);
  },

  // 약관 관리
  getTerms: () => requestWithAdminToken<{ terms: Array<{
    type: string;
    title: string;
    content: string;
    version: string;
    effectiveDate: string;
    updatedAt?: string;
    createdAt?: string;
  }>; count: number }>('/admin/terms'),

  getTermsDetail: (type: 'service' | 'privacy' | 'electronic' | 'marketing') =>
    requestWithAdminToken<{ terms: {
      type: string;
      title: string;
      content: string;
      version: string;
      effectiveDate: string;
      updatedAt?: string;
      createdAt?: string;
    } }>(`/admin/terms/${type}`),

  updateTerms: (type: 'service' | 'privacy' | 'electronic' | 'marketing', data: {
    content: string;
    version?: string;
    effectiveDate?: string;
  }) => requestWithAdminToken<{ message: string; terms: { type: string; title: string; content: string; version: string; effectiveDate: string; updatedAt?: string; createdAt?: string; } }>(`/admin/terms/${type}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// 관리자 토큰으로 요청
async function requestWithAdminToken<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // /admin/* 엔드포인트는 /api/admin/* 프록시 라우트로 리다이렉트
  const apiEndpoint = endpoint.startsWith('/admin/') ? `/api${endpoint}` : endpoint;
  const url = `${API_BASE_URL}${apiEndpoint}`;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const method = options.method || 'GET';

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('plic_admin_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  let requestBody: unknown;
  try {
    requestBody = options.body ? JSON.parse(options.body as string) : undefined;
  } catch {
    requestBody = options.body;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data: { success: boolean; data?: T; error?: string } = await response.json();

    // 관리자 API 로그 기록 (tracking 엔드포인트 제외)
    if (!endpoint.includes('/tracking/') && !endpoint.includes('/api-logs')) {
      queueLog({
        correlationId,
        endpoint,
        method,
        statusCode: response.status,
        requestBody,
        responseBody: response.status >= 400 ? data : undefined,
        errorMessage: !response.ok || !data.success ? data?.error : undefined,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        userId: 'admin',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
    }

    // 401 에러 시 토큰 클리어 및 로그인 페이지로 리다이렉트
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('plic_admin_token');
        localStorage.removeItem('plic-admin-storage');
        window.location.href = '/admin/login';
      }
      throw new Error(data.error || '관리자 인증이 필요합니다.');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
    }

    return data.data as T;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // 에러 로깅
    if (!endpoint.includes('/tracking/') && !endpoint.includes('/api-logs')) {
      queueLog({
        correlationId,
        endpoint,
        method,
        statusCode: 0,
        requestBody,
        errorMessage,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        userId: 'admin',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
    }
    throw error;
  }
}
