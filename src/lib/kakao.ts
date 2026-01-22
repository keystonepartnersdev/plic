/**
 * 카카오 본인인증 유틸리티
 *
 * 카카오 개발자 문서: https://developers.kakao.com
 *
 * 필요한 환경변수:
 * - KAKAO_REST_API_KEY: REST API 키
 * - KAKAO_JAVASCRIPT_KEY: JavaScript 키 (프론트엔드용)
 * - KAKAO_ADMIN_KEY: Admin 키 (선택)
 * - NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY: JavaScript 키 (클라이언트 노출용)
 * - NEXT_PUBLIC_BASE_URL: 사이트 기본 URL
 */

// 카카오 API 엔드포인트
const KAKAO_AUTH_URL = 'https://kauth.kakao.com';
const KAKAO_API_URL = 'https://kapi.kakao.com';

// 환경변수에서 설정값 가져오기
export const getKakaoConfig = () => {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  const adminKey = process.env.KAKAO_ADMIN_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!restApiKey) {
    console.warn('카카오 REST API 키가 설정되지 않았습니다.');
  }

  return {
    restApiKey: restApiKey || '',
    adminKey: adminKey || '',
    baseUrl,
    redirectUri: `${baseUrl}/api/kakao/callback`,
  };
};

/**
 * 카카오 로그인 인가 URL 생성
 */
export function getKakaoAuthUrl(state?: string): string {
  const { restApiKey, redirectUri } = getKakaoConfig();

  const params = new URLSearchParams({
    client_id: restApiKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'account_email phone_number', // 필요한 동의 항목
  });

  if (state) {
    params.append('state', state);
  }

  return `${KAKAO_AUTH_URL}/oauth/authorize?${params.toString()}`;
}

/**
 * 인가 코드로 액세스 토큰 발급
 */
export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export async function getKakaoAccessToken(code: string): Promise<KakaoTokenResponse> {
  const { restApiKey, redirectUri } = getKakaoConfig();

  const response = await fetch(`${KAKAO_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: restApiKey,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('카카오 토큰 발급 실패:', error);
    throw new Error(error.error_description || '카카오 토큰 발급에 실패했습니다.');
  }

  return response.json();
}

/**
 * 사용자 정보 조회
 */
export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  kakao_account?: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
    has_phone_number?: boolean;
    name_needs_agreement?: boolean;
    name?: string;
    birthyear_needs_agreement?: boolean;
    birthyear?: string;
    birthday_needs_agreement?: boolean;
    birthday?: string;
    birthday_type?: string;
    gender_needs_agreement?: boolean;
    gender?: 'male' | 'female';
    ci_needs_agreement?: boolean;
    ci?: string;
    ci_authenticated_at?: string;
  };
}

export async function getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const response = await fetch(`${KAKAO_API_URL}/v2/user/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('카카오 사용자 정보 조회 실패:', error);
    throw new Error(error.msg || '카카오 사용자 정보 조회에 실패했습니다.');
  }

  return response.json();
}

/**
 * 카카오 로그아웃 (토큰 만료)
 */
export async function kakaoLogout(accessToken: string): Promise<void> {
  const response = await fetch(`${KAKAO_API_URL}/v1/user/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error('카카오 로그아웃 실패');
  }
}

/**
 * 카카오 연결 끊기
 */
export async function kakaoUnlink(accessToken: string): Promise<void> {
  const response = await fetch(`${KAKAO_API_URL}/v1/user/unlink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error('카카오 연결 끊기 실패');
  }
}

/**
 * 전화번호 포맷팅 (+82 10-1234-5678 -> 010-1234-5678)
 */
export function formatKakaoPhoneNumber(phone: string): string {
  if (!phone) return '';

  // +82 10-1234-5678 형식을 010-1234-5678로 변환
  let formatted = phone.replace(/^\+82\s*/, '0');
  formatted = formatted.replace(/[^0-9]/g, '');

  // 010-0000-0000 형식으로 포맷
  if (formatted.length === 11) {
    return `${formatted.slice(0, 3)}-${formatted.slice(3, 7)}-${formatted.slice(7)}`;
  }

  return formatted;
}

/**
 * 인증 결과 저장 (세션/캐시)
 */
interface VerificationResult {
  kakaoId: number;
  name?: string;
  email?: string;
  phone?: string;
  birthyear?: string;
  birthday?: string;
  gender?: 'male' | 'female';
  ci?: string;
  verifiedAt: string;
}

const verificationCache = new Map<string, { result: VerificationResult; expiresAt: number }>();

export function generateVerificationKey(): string {
  return `kakao_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function saveVerificationResult(key: string, result: VerificationResult): void {
  // 10분 후 만료
  const expiresAt = Date.now() + 10 * 60 * 1000;
  verificationCache.set(key, { result, expiresAt });
}

export function getVerificationResult(key: string): VerificationResult | null {
  const cached = verificationCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    verificationCache.delete(key);
    return null;
  }

  return cached.result;
}

export function deleteVerificationResult(key: string): void {
  verificationCache.delete(key);
}

/**
 * 카카오 사용자 정보에서 인증 결과 추출
 */
export function extractVerificationResult(userInfo: KakaoUserInfo): VerificationResult {
  const account = userInfo.kakao_account;

  return {
    kakaoId: userInfo.id,
    name: account?.name,
    email: account?.email,
    phone: account?.phone_number ? formatKakaoPhoneNumber(account.phone_number) : undefined,
    birthyear: account?.birthyear,
    birthday: account?.birthday,
    gender: account?.gender,
    ci: account?.ci,
    verifiedAt: new Date().toISOString(),
  };
}
