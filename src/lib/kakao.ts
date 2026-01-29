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
 * - AWS_ACCESS_KEY_ID: AWS 액세스 키
 * - AWS_SECRET_ACCESS_KEY: AWS 시크릿 키
 * - AWS_REGION: AWS 리전
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// 카카오 API 엔드포인트
const KAKAO_AUTH_URL = 'https://kauth.kakao.com';
const KAKAO_API_URL = 'https://kapi.kakao.com';

// 환경변수에서 설정값 가져오기
export const getKakaoConfig = () => {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const adminKey = process.env.KAKAO_ADMIN_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!restApiKey) {
    console.warn('카카오 REST API 키가 설정되지 않았습니다.');
  }

  return {
    restApiKey: restApiKey || '',
    clientSecret: clientSecret || '',
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
    scope: 'profile_nickname account_email', // 닉네임, 이메일만 수집
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
  const { restApiKey, clientSecret, redirectUri } = getKakaoConfig();

  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  };

  // 클라이언트 시크릿이 설정된 경우 추가
  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  const response = await fetch(`${KAKAO_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams(params),
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
  nickname?: string;
  email?: string;
  verifiedAt: string;
}

// DynamoDB 클라이언트 초기화
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const VERIFICATION_TABLE = 'plic-kakao-verifications';

export function generateVerificationKey(): string {
  return `kakao_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function saveVerificationResult(key: string, result: VerificationResult): Promise<void> {
  // 10분 후 만료 (DynamoDB TTL)
  const ttl = Math.floor(Date.now() / 1000) + 600;

  await docClient.send(new PutCommand({
    TableName: VERIFICATION_TABLE,
    Item: {
      verificationKey: key,
      ...result,
      ttl,
      createdAt: new Date().toISOString(),
    },
  }));
}

export async function getVerificationResult(key: string): Promise<VerificationResult | null> {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: VERIFICATION_TABLE,
      Key: { verificationKey: key },
    }));

    if (!response.Item) return null;

    return {
      kakaoId: response.Item.kakaoId,
      nickname: response.Item.nickname,
      email: response.Item.email,
      verifiedAt: response.Item.verifiedAt,
    };
  } catch (error) {
    console.error('DynamoDB 조회 오류:', error);
    return null;
  }
}

export async function deleteVerificationResult(key: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({
      TableName: VERIFICATION_TABLE,
      Key: { verificationKey: key },
    }));
  } catch (error) {
    console.error('DynamoDB 삭제 오류:', error);
  }
}

/**
 * 카카오 사용자 정보에서 인증 결과 추출
 */
export function extractVerificationResult(userInfo: KakaoUserInfo): VerificationResult {
  const account = userInfo.kakao_account;

  return {
    kakaoId: userInfo.id,
    nickname: account?.profile?.nickname,
    email: account?.email,
    verifiedAt: new Date().toISOString(),
  };
}
