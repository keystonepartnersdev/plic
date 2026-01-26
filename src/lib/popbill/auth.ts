/**
 * Linkhub 토큰 관리
 * 팝빌 API 호출 전 필요한 인증 토큰을 발급/캐싱
 * Linkhub SDK 참조: https://github.com/linkhub-sdk/node-linkhub
 */

import crypto from 'crypto';

const LINK_ID = (process.env.POPBILL_LINK_ID || '').trim();
const SECRET_KEY = (process.env.POPBILL_SECRET_KEY || '').trim();
const IS_TEST = process.env.POPBILL_IS_TEST === 'true';
const LINKHUB_API_VERSION = '2.0';

// 토큰 캐시 (메모리)
interface TokenCache {
  token: string;
  serviceID: string;
  expiration: Date;
}

const tokenCache: Map<string, TokenCache> = new Map();

/**
 * Linkhub 토큰 발급
 */
async function requestToken(serviceId: string, scopes: string[]): Promise<{ session_token: string; serviceID: string; expiration: string }> {
  const authHost = IS_TEST ? 'auth-test.linkhub.co.kr' : 'auth.linkhub.co.kr';
  const uri = `/${serviceId}/Token`;
  const xDate = new Date().toISOString();

  // Request body
  const tokenRequest = JSON.stringify({ access_id: LINK_ID, scope: scopes });

  // Body digest (SHA256 -> Base64)
  const sha256 = crypto.createHash('sha256');
  sha256.update(tokenRequest);
  const bodyDigest = sha256.digest('base64');

  // Signature target
  const digestTarget = `POST\n${bodyDigest}\n${xDate}\n${LINKHUB_API_VERSION}\n${uri}`;

  // HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', Buffer.from(SECRET_KEY, 'base64'));
  hmac.update(digestTarget);
  const signature = hmac.digest('base64');

  console.log('[Linkhub] Token request:', {
    serviceId,
    scopes,
    authHost,
    uri,
    linkId: LINK_ID,
    isTest: IS_TEST,
    bodyDigest,
  });

  const response = await fetch(`https://${authHost}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'Application/json',
      'x-lh-date': xDate,
      'x-lh-version': LINKHUB_API_VERSION,
      'Authorization': `LINKHUB ${LINK_ID} ${signature}`,
    },
    body: tokenRequest,
  });

  const responseText = await response.text();
  console.log('[Linkhub] Token response raw:', { status: response.status, body: responseText });

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  console.log('[Linkhub] Token response parsed:', data);

  if (!response.ok || data.code) {
    throw new Error(data.message || `Token request failed: ${response.status}`);
  }

  return data;
}

/**
 * 토큰 조회 (캐시 사용)
 * @param serviceId 서비스 ID ('CLOSEDOWN' | 'ACCOUNTCHECK')
 */
// 팝빌 서비스 ID 매핑
const SERVICE_IDS = {
  CLOSEDOWN: 'CLOSEDOWN',      // 휴폐업조회
  ACCOUNTCHECK: 'EasyFinBank', // 계좌실명조회
} as const;

export async function getToken(serviceId: 'CLOSEDOWN' | 'ACCOUNTCHECK'): Promise<string> {
  const actualServiceId = SERVICE_IDS[serviceId];
  const cacheKey = `${LINK_ID}_${actualServiceId}`;
  const cached = tokenCache.get(cacheKey);

  // 캐시 유효성 검사 (만료 1분 전까지 유효)
  if (cached && new Date(cached.expiration.getTime() - 60000) > new Date()) {
    console.log('[Linkhub] Using cached token for', actualServiceId);
    return cached.token;
  }

  console.log('[Linkhub] Requesting new token for', actualServiceId);

  // 서비스별 scope 설정
  // 170: 휴폐업조회, 141: 계좌조회
  const scopes = serviceId === 'CLOSEDOWN' ? ['170'] : ['141'];

  const tokenResponse = await requestToken(actualServiceId, scopes);

  // 캐시 저장
  tokenCache.set(cacheKey, {
    token: tokenResponse.session_token,
    serviceID: tokenResponse.serviceID,
    expiration: new Date(tokenResponse.expiration),
  });

  console.log('[Linkhub] Token acquired, expires at:', tokenResponse.expiration);

  return tokenResponse.session_token;
}

/**
 * 토큰 캐시 초기화
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
