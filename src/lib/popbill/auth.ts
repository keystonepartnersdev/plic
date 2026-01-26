/**
 * Linkhub 토큰 관리
 * 팝빌 API 호출 전 필요한 인증 토큰을 발급/캐싱
 * Linkhub SDK 참조: https://github.com/linkhub-sdk/node-linkhub
 */

import crypto from 'crypto';
import { LINKHUB_AUTH_URL, POPBILL_SERVICE_ID } from './constants';

const LINK_ID = (process.env.POPBILL_LINK_ID || '').trim();
const SECRET_KEY = (process.env.POPBILL_SECRET_KEY || '').trim();
const CORP_NUM = (process.env.POPBILL_CORP_NUM || '').trim(); // 회원 사업자번호
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
 * @param scopes 필요한 권한 scope 배열
 */
async function requestToken(scopes: readonly string[]): Promise<{ session_token: string; serviceID: string; expiration: string }> {
  // 인증 서버는 테스트/프로덕션 공용
  const authHost = LINKHUB_AUTH_URL;
  // 서비스 ID는 테스트/프로덕션 구분
  const serviceId = IS_TEST ? POPBILL_SERVICE_ID.TEST : POPBILL_SERVICE_ID.PROD;
  const uri = `/${serviceId}/Token`;
  const xDate = new Date().toISOString();

  // Request body - access_id는 회원 사업자번호
  const tokenRequest = JSON.stringify({ access_id: CORP_NUM, scope: scopes });

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
    corpNum: CORP_NUM,
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
 * @param serviceType 서비스 타입 ('CLOSEDOWN' | 'ACCOUNTCHECK')
 */
// 서비스별 scope 매핑
const SERVICE_SCOPES = {
  CLOSEDOWN: ['170'],           // 휴폐업조회
  ACCOUNTCHECK: ['182', '183'], // 예금주조회
} as const;

export async function getToken(serviceType: 'CLOSEDOWN' | 'ACCOUNTCHECK'): Promise<string> {
  const serviceId = IS_TEST ? POPBILL_SERVICE_ID.TEST : POPBILL_SERVICE_ID.PROD;
  const scopes = SERVICE_SCOPES[serviceType];
  const cacheKey = `${LINK_ID}_${serviceId}_${serviceType}`;
  const cached = tokenCache.get(cacheKey);

  // 캐시 유효성 검사 (만료 1분 전까지 유효)
  if (cached && new Date(cached.expiration.getTime() - 60000) > new Date()) {
    console.log('[Linkhub] Using cached token for', serviceType);
    return cached.token;
  }

  console.log('[Linkhub] Requesting new token for', serviceType, 'scopes:', scopes);

  const tokenResponse = await requestToken(scopes);

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
