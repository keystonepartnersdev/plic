// src/lib/api.ts

const API_BASE_URL = 'https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod';

// 토큰 저장소
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
  requestBody?: any;
  responseBody?: any;
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

  console.log('[API Log] 전송 시도:', log.endpoint, log.method, log.statusCode);

  // fetch 사용 (fire-and-forget)
  fetch(`${API_BASE_URL}/tracking/api-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs: [log] }),
    keepalive: true,
  }).then(res => {
    if (!res.ok) {
      console.error('[API Log] 전송 실패:', res.status, res.statusText);
    }
  }).catch((err) => {
    console.error('[API Log] 전송 에러:', err);
  });
};

// 로그 전송 (action 설명 추가)
const queueLog = (log: ApiLogEntry) => {
  console.log('[API queueLog]', log.endpoint, log.method);
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

// 토큰 관리
export const tokenManager = {
  setTokens: (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('plic_access_token', access);
      localStorage.setItem('plic_refresh_token', refresh);
    }
  },
  getAccessToken: () => {
    if (!accessToken && typeof window !== 'undefined') {
      accessToken = localStorage.getItem('plic_access_token');
    }
    return accessToken;
  },
  getRefreshToken: () => {
    if (!refreshToken && typeof window !== 'undefined') {
      refreshToken = localStorage.getItem('plic_refresh_token');
    }
    return refreshToken;
  },
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('plic_access_token');
      localStorage.removeItem('plic_refresh_token');
    }
  },
};

// API 요청 함수
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  skipLogging = false
): Promise<T> {
  console.log('[API Request]', options.method || 'GET', endpoint);
  const url = `${API_BASE_URL}${endpoint}`;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 인증 토큰 추가
  const token = tokenManager.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: any;
  try {
    requestBody = options.body ? JSON.parse(options.body as string) : undefined;
  } catch {
    requestBody = options.body;
  }

  let response: Response;
  let data: any;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });

    data = await response.json();

    // 토큰 만료 시 갱신 시도
    if (response.status === 401 && tokenManager.getRefreshToken()) {
      const refreshed = await authAPI.refresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
        const retryResponse = await fetch(url, { ...options, headers });
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
        return retryData.data;
      } else {
        // 토큰 갱신 실패 시 토큰 삭제
        tokenManager.clearTokens();
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

    // 401 에러 (토큰 없음 또는 갱신 실패)
    if (response.status === 401) {
      tokenManager.clearTokens();
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
    }

    return data.data;
  } catch (error: any) {
    // 네트워크 에러 등 로깅
    if (!skipLogging && !endpoint.includes('/tracking/')) {
      queueLog({
        correlationId,
        endpoint,
        method,
        statusCode: 0,
        requestBody,
        errorMessage: error.message,
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
// Auth API
// ============================================
export const authAPI = {
  signup: (data: {
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
  }) => request<{ message: string; uid: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  confirm: (data: { email: string; code: string }) =>
    request<{ message: string }>('/auth/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: async (data: { email: string; password: string }) => {
    const result = await request<{
      user: any;
      tokens: {
        accessToken: string;
        refreshToken: string;
        idToken: string;
        expiresIn: number;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    tokenManager.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  },

  refresh: async () => {
    try {
      const result = await request<{
        tokens: { accessToken: string; idToken: string };
      }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokenManager.getRefreshToken() }),
      });
      
      if (result.tokens.accessToken) {
        tokenManager.setTokens(result.tokens.accessToken, tokenManager.getRefreshToken()!);
        return true;
      }
    } catch {
      tokenManager.clearTokens();
    }
    return false;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      tokenManager.clearTokens();
    }
  },
};

// ============================================
// Users API
// ============================================
export const usersAPI = {
  getMe: () => request<any>('/users/me'),

  updateMe: (data: { name?: string; phone?: string; agreements?: { marketing?: boolean } }) =>
    request<{ message: string; user: any }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  withdraw: () => request<{ message: string }>('/users/me', { method: 'DELETE' }),

  getGrade: () => request<{
    grade: { code: string; name: string; isManual: boolean };
    fee: { rate: number; rateText: string };
    limit: { monthly: number; used: number; remaining: number; usagePercent: number };
    stats: { totalPaymentAmount: number; totalDealCount: number; lastMonthPaymentAmount: number };
  }>('/users/me/grade'),
};

// ============================================
// Deals API
// ============================================
export const dealsAPI = {
  list: (params?: { status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    return request<{ deals: any[]; total: number }>(`/deals${queryString ? `?${queryString}` : ''}`);
  },

  get: (did: string) => request<{ deal: any }>(`/deals/${did}`),

  create: (data: {
    dealName: string;
    dealType: string;
    amount: number;
    recipient: { bank: string; accountNumber: string; accountHolder: string };
    senderName: string;
    attachments?: string[];
  }) => request<{ message: string; deal: any }>('/deals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (did: string, data: any) =>
    request<{ message: string; deal: any }>(`/deals/${did}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (did: string) => request<{ message: string; did: string }>(`/deals/${did}`, { method: 'DELETE' }),

  applyDiscount: (did: string, discountId: string) =>
    request<{ message: string; deal: any }>(`/deals/${did}/discount`, {
      method: 'POST',
      body: JSON.stringify({ discountId }),
    }),
};

// ============================================
// Discounts API
// ============================================
export const discountsAPI = {
  validate: (data: { code: string; amount: number }) =>
    request<{ valid: boolean; discount: any }>('/discounts/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCoupons: () => request<{ coupons: any[]; total: number }>('/discounts/coupons'),
};

// ============================================
// Content API
// ============================================
export const contentAPI = {
  getBanners: () => request<{ banners: any[] }>('/content/banners'),

  getNotices: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request<{ notices: any[]; total: number }>(`/content/notices${query}`);
  },

  getNoticeDetail: (id: string) => request<{ notice: any }>(`/content/notices/${id}`),

  getFaqs: (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return request<{ faqs: any[]; grouped: Record<string, any[]>; total: number }>(`/content/faqs${query}`);
  },
};

// ============================================
// Uploads API
// ============================================
export type UploadType = 'business-license' | 'contract' | 'bank-statement' | 'attachment' | 'temp';

export const uploadsAPI = {
  getPresignedUrl: (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadType: UploadType;
    entityId?: string;
  }) => request<{ uploadUrl: string; fileKey: string; expiresIn: number }>('/uploads/presigned-url', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ============================================
// Admin API
// ============================================
export const adminAPI = {
  login: async (data: { email: string; password: string }) => {
    const result = await request<{ admin: any; token: string }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('plic_admin_token', result.token);
    }
    return result;
  },

  // 회원 관리
  getUsers: (params?: { status?: string; grade?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.grade) query.append('grade', params.grade);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    
    return requestWithAdminToken<{ users: any[]; total: number }>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUser: (uid: string) => requestWithAdminToken<{ user: any; recentDeals: any[] }>(`/admin/users/${uid}`),

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
    
    return requestWithAdminToken<{ deals: any[]; total: number }>(`/admin/deals${queryString ? `?${queryString}` : ''}`);
  },

  getDeal: (did: string) => requestWithAdminToken<{ deal: any; user: any }>(`/admin/deals/${did}`),

  updateDealStatus: (did: string, status: string, reason?: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/deals/${did}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
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
  }) => requestWithAdminToken<{ message: string; banner: any }>('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateBanner: (id: string, data: Partial<{
    title: string;
    imageUrl: string;
    linkUrl: string;
    priority: number;
    isVisible: boolean;
  }>) => requestWithAdminToken<{ message: string; banner: any }>(`/admin/banners/${id}`, {
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
  }) => requestWithAdminToken<{ message: string; notice: any }>('/admin/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateNotice: (id: string, data: Partial<{
    title: string;
    content: string;
    category: string;
    isPinned: boolean;
    isVisible: boolean;
  }>) => requestWithAdminToken<{ message: string; notice: any }>(`/admin/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteNotice: (id: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/notices/${id}`, {
      method: 'DELETE',
    }),

  // FAQ 관리
  createFaq: (data: {
    question: string;
    answer: string;
    category: string;
    priority?: number;
    isVisible?: boolean;
    isHomeFeatured?: boolean;
  }) => requestWithAdminToken<{ message: string; faq: any }>('/admin/faqs', {
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
  }>) => requestWithAdminToken<{ message: string; faq: any }>(`/admin/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteFaq: (id: string) =>
    requestWithAdminToken<{ message: string }>(`/admin/faqs/${id}`, {
      method: 'DELETE',
    }),

  // 관리자 계정 관리
  getAdmins: () => requestWithAdminToken<{ admins: any[]; count: number }>('/admin/admins'),

  getAdmin: (adminId: string) => requestWithAdminToken<{ admin: any }>(`/admin/admins/${adminId}`),

  createAdmin: (data: {
    email: string;
    name: string;
    phone?: string;
    role: 'super' | 'operator' | 'cs';
    password: string;
  }) => requestWithAdminToken<{ message: string; admin: any }>('/admin/admins', {
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
  }>) => requestWithAdminToken<{ message: string; admin: any }>(`/admin/admins/${adminId}`, {
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
    return requestWithAdminToken<{ discounts: any[]; count: number }>(`/admin/discounts${query}`);
  },

  getDiscount: (discountId: string) =>
    requestWithAdminToken<{ discount: any }>(`/admin/discounts/${discountId}`),

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
  }) => requestWithAdminToken<{ message: string; discount: any }>('/admin/discounts', {
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
  }>) => requestWithAdminToken<{ message: string; discount: any }>(`/admin/discounts/${discountId}`, {
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
        requestBody?: any;
        responseBody?: any;
        errorMessage?: string;
        executionTime: number;
        timestamp: string;
        userId?: string;
        level: 'INFO' | 'WARN' | 'ERROR';
      }>;
      log?: any;
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
};

// 관리자 토큰으로 요청
async function requestWithAdminToken<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
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

  let requestBody: any;
  try {
    requestBody = options.body ? JSON.parse(options.body as string) : undefined;
  } catch {
    requestBody = options.body;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

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

    if (!response.ok || !data.success) {
      throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
    }

    return data.data;
  } catch (error: any) {
    // 에러 로깅
    if (!endpoint.includes('/tracking/') && !endpoint.includes('/api-logs')) {
      queueLog({
        correlationId,
        endpoint,
        method,
        statusCode: 0,
        requestBody,
        errorMessage: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        userId: 'admin',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
    }
    throw error;
  }
}
