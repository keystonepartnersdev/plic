// backend/plic/functions/shared/cors.ts
// 공통 CORS 설정 - httpOnly 쿠키 지원

/**
 * 허용된 Origin 목록
 * credentials: true 사용 시 '*'는 사용할 수 없으므로 명시적 도메인 필요
 */
const ALLOWED_ORIGINS = [
  'https://plic.kr',
  'https://www.plic.kr',
  'https://plic.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

/**
 * Origin 검증
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * CORS 헤더 생성 (httpOnly 쿠키 지원)
 * @param origin 요청 Origin
 * @param withCredentials credentials 지원 여부 (기본: true)
 */
export function getCorsHeaders(origin?: string, withCredentials = true): Record<string, string> {
  // credentials 지원 시 구체적인 Origin 필요
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': withCredentials ? allowedOrigin : '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  if (withCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * 레거시 CORS 헤더 (기존 코드 호환용)
 * ⚠️ 새 코드에서는 getCorsHeaders() 사용 권장
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

/**
 * 응답 헬퍼 (CORS 포함)
 */
export function createResponse(
  statusCode: number,
  body: Record<string, unknown>,
  origin?: string,
  withCredentials = true
) {
  return {
    statusCode,
    headers: getCorsHeaders(origin, withCredentials),
    body: JSON.stringify(body),
  };
}

/**
 * Set-Cookie 헤더가 포함된 응답 생성 (httpOnly 쿠키용)
 */
export function createResponseWithCookies(
  statusCode: number,
  body: Record<string, unknown>,
  cookies: Array<{ name: string; value: string; options?: CookieOptions }>,
  origin?: string
) {
  const headers: Record<string, string | string[]> = getCorsHeaders(origin, true);

  // Set-Cookie 헤더 추가
  const cookieHeaders = cookies.map(({ name, value, options }) =>
    formatSetCookie(name, value, options)
  );

  if (cookieHeaders.length > 0) {
    headers['Set-Cookie'] = cookieHeaders;
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

/**
 * 쿠키 옵션 인터페이스
 */
interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  maxAge?: number;
  path?: string;
  domain?: string;
}

/**
 * Set-Cookie 헤더 포맷팅
 */
function formatSetCookie(name: string, value: string, options: CookieOptions = {}): string {
  const {
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
    maxAge,
    path = '/',
    domain,
  } = options;

  let cookie = `${name}=${value}`;

  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  if (maxAge !== undefined) cookie += `; Max-Age=${maxAge}`;
  if (path) cookie += `; Path=${path}`;
  if (domain) cookie += `; Domain=${domain}`;

  return cookie;
}

/**
 * 쿠키 삭제용 Set-Cookie 생성
 */
export function createDeleteCookieHeader(name: string, path = '/'): string {
  return `${name}=; HttpOnly; Path=${path}; Max-Age=0`;
}

/**
 * 토큰 설정 상수
 */
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
  REFRESH_TOKEN_NAME: 'plic_refresh_token',
  ACCESS_TOKEN_MAX_AGE: 60 * 60, // 1시간
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7일
};
