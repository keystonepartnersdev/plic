// src/lib/auth.ts
// Phase 1.2: httpOnly 쿠키 기반 인증 유틸리티

/**
 * 보안 인증 API (httpOnly 쿠키 사용)
 *
 * XSS 공격으로부터 토큰을 보호하기 위해 httpOnly 쿠키를 사용합니다.
 * 모든 인증 관련 요청은 Next.js API Routes를 통해 프록시됩니다.
 */
export const secureAuth = {
  /**
   * 로그인 (httpOnly 쿠키로 토큰 저장)
   */
  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // 쿠키 포함
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '로그인에 실패했습니다.');
    }

    return data;
  },

  /**
   * 로그아웃 (httpOnly 쿠키 삭제)
   */
  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '로그아웃에 실패했습니다.');
    }

    return data;
  },

  /**
   * 토큰 갱신 (자동으로 쿠키 갱신)
   */
  refresh: async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '토큰 갱신에 실패했습니다.');
    }

    return data;
  },

  /**
   * 현재 로그인 상태 확인
   */
  getMe: async () => {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  },

  /**
   * 인증이 필요한 API 요청을 위한 fetch wrapper
   * credentials: 'include'가 자동으로 포함됨
   */
  fetchWithAuth: async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    // 401 응답 시 토큰 갱신 시도
    if (response.status === 401) {
      try {
        await secureAuth.refresh();
        // 토큰 갱신 후 재요청
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      } catch {
        // 갱신 실패 시 원래 응답 반환
        return response;
      }
    }

    return response;
  },
};

/**
 * 회원가입 (별도 처리 - 토큰 발급 없음)
 */
export const signup = async (data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '회원가입에 실패했습니다.');
  }

  return result;
};
