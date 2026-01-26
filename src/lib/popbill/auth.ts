/**
 * Linkhub 토큰 관리
 * 팝빌 API 호출 전 필요한 인증 토큰을 발급/캐싱
 */

import crypto from 'crypto';
import { LINKHUB_API_URL, TIMEOUTS } from './constants';
import { LinkhubTokenResponse } from './types';

const LINK_ID = (process.env.POPBILL_LINK_ID || '').trim();
const SECRET_KEY = (process.env.POPBILL_SECRET_KEY || '').trim();
const IS_TEST = process.env.POPBILL_IS_TEST === 'true';

// 토큰 캐시 (메모리)
interface TokenCache {
  token: string;
  expiration: Date;
}

const tokenCache: Map<string, TokenCache> = new Map();

/**
 * Linkhub API URL 반환
 */
function getLinkhubUrl(): string {
  return IS_TEST ? LINKHUB_API_URL.TEST : LINKHUB_API_URL.PROD;
}

/**
 * HMAC-SHA256 서명 생성
 */
function generateSignature(
  method: string,
  url: string,
  timestamp: string,
  body?: string
): string {
  const target = [method, url, timestamp, body || ''].join('\n');
  const hmac = crypto.createHmac('sha256', Buffer.from(SECRET_KEY, 'base64'));
  hmac.update(target);
  return hmac.digest('base64');
}

/**
 * Linkhub 토큰 발급 (단일 서비스)
 */
async function requestToken(serviceId: string): Promise<LinkhubTokenResponse> {
  const baseUrl = getLinkhubUrl();
  const endpoint = `/${serviceId}/Token`;
  const timestamp = new Date().toISOString();

  const requestBody = JSON.stringify({
    access_id: LINK_ID,
    scope: [serviceId === 'CLOSEDOWN' ? '170' : '141'], // 170: 휴폐업조회, 141: 계좌조회
  });

  const signature = generateSignature('POST', endpoint, timestamp, requestBody);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.TOKEN);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-lh-date': timestamp,
        'x-lh-version': '2.0',
        Authorization: `LINKHUB ${LINK_ID} ${signature}`,
      },
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Linkhub] Token request failed:', errorData);
      throw new Error(errorData.message || `Token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data as LinkhubTokenResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('토큰 요청 시간이 초과되었습니다.');
    }
    throw error;
  }
}

/**
 * 토큰 조회 (캐시 사용)
 * @param serviceId 서비스 ID ('CLOSEDOWN' | 'ACCOUNTCHECK')
 */
export async function getToken(serviceId: 'CLOSEDOWN' | 'ACCOUNTCHECK'): Promise<string> {
  const cacheKey = `${LINK_ID}_${serviceId}`;
  const cached = tokenCache.get(cacheKey);

  // 캐시 유효성 검사 (만료 1분 전까지 유효)
  if (cached && new Date(cached.expiration.getTime() - 60000) > new Date()) {
    return cached.token;
  }

  console.log(`[Linkhub] Requesting new token for ${serviceId}...`);

  const tokenResponse = await requestToken(serviceId);

  // 캐시 저장
  tokenCache.set(cacheKey, {
    token: tokenResponse.session_token,
    expiration: new Date(tokenResponse.expiration),
  });

  console.log(`[Linkhub] Token acquired, expires at: ${tokenResponse.expiration}`);

  return tokenResponse.session_token;
}

/**
 * 토큰 캐시 초기화
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
