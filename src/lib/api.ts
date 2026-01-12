// src/lib/api.ts

const API_BASE_URL = 'https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod';

// 토큰 저장소
let accessToken: string | null = null;
let refreshToken: string | null = null;

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
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 인증 토큰 추가
  const token = tokenManager.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  // 토큰 만료 시 갱신 시도
  if (response.status === 401 && tokenManager.getRefreshToken()) {
    const refreshed = await authAPI.refresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
      const retryResponse = await fetch(url, { ...options, headers });
      return retryResponse.json();
    }
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
  }

  return data.data;
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
};

// 관리자 토큰으로 요청
async function requestWithAdminToken<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('plic_admin_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
  }

  return data.data;
}
