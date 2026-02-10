// backend/functions/auth/signup.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  AdminConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || process.env.COGNITO_CLIENT_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const KAKAO_VERIFICATIONS_TABLE = 'plic-kakao-verifications';

// CORS 헤더 (httpOnly 쿠키 지원)
const ALLOWED_ORIGINS = [
  'https://plic.kr',
  'https://www.plic.kr',
  'https://plic.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// 응답 헬퍼 (CORS 지원)
const response = (statusCode: number, body: Record<string, unknown>, origin?: string) => ({
  statusCode,
  headers: getCorsHeaders(origin),
  body: JSON.stringify(body),
});

interface SignupRequest {
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
  // 카카오 인증 정보 (프론트엔드에서 전달 - deprecated)
  kakaoVerified?: boolean;
  kakaoId?: number;
  // 카카오 인증 키 (백엔드에서 직접 DynamoDB 조회)
  kakaoVerificationKey?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;

  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {}, origin);
  }

  try {
    // 요청 바디 파싱
    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      });
    }

    const body: SignupRequest = JSON.parse(event.body);
    const { email, password, name, phone, userType, businessInfo, agreements, kakaoVerificationKey } = body;
    let { kakaoVerified, kakaoId } = body;

    // kakaoVerificationKey가 있으면 DynamoDB에서 직접 카카오 인증 정보 조회
    if (kakaoVerificationKey) {
      try {
        const verificationResult = await docClient.send(new GetCommand({
          TableName: KAKAO_VERIFICATIONS_TABLE,
          Key: { verificationKey: kakaoVerificationKey },
        }));

        if (verificationResult.Item && verificationResult.Item.kakaoId) {
          console.log(`[Signup] 카카오 인증 키로 조회 성공: ${verificationResult.Item.email}`);
          kakaoVerified = true;
          kakaoId = verificationResult.Item.kakaoId;
        } else {
          console.log(`[Signup] 카카오 인증 키 조회 실패 또는 만료: ${kakaoVerificationKey}`);
        }
      } catch (verifyError: any) {
        console.error('[Signup] 카카오 인증 키 조회 오류:', verifyError);
        // 실패해도 계속 진행 (일반 가입으로)
      }
    }

    // 필수 필드 검증
    if (!email || !password || !name || !phone) {
      return response(400, {
        success: false,
        error: '필수 필드가 누락되었습니다: email, password, name, phone',
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response(400, {
        success: false,
        error: '올바른 이메일 형식이 아닙니다.',
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return response(400, {
        success: false,
        error: '비밀번호는 8자 이상이어야 합니다.',
      });
    }

    // 약관 동의 검증
    if (!agreements?.service || !agreements?.privacy || !agreements?.thirdParty) {
      return response(400, {
        success: false,
        error: '필수 약관에 동의해주세요.',
      });
    }

    // 사업자 회원인 경우 사업자 정보 검증
    if (userType === 'business') {
      if (!businessInfo?.businessName || !businessInfo?.businessNumber || !businessInfo?.representativeName) {
        return response(400, {
          success: false,
          error: '사업자 정보가 필요합니다: businessName, businessNumber, representativeName',
        });
      }

      // 사업자등록번호 형식 검증 (10자리 숫자)
      const cleanBusinessNumber = businessInfo.businessNumber.replace(/-/g, '');
      if (!/^\d{10}$/.test(cleanBusinessNumber)) {
        return response(400, {
          success: false,
          error: '사업자등록번호는 10자리 숫자여야 합니다.',
        });
      }
    }

    // Cognito에 사용자 등록
    const uid = uuidv4();

    try {
      const signUpCommand = new SignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
          { Name: 'phone_number', Value: `+82${phone.slice(1)}` }, // 국제 형식으로 변환
        ],
      });

      await cognitoClient.send(signUpCommand);
    } catch (cognitoError: any) {
      if (cognitoError.name === 'UsernameExistsException') {
        // 미완료 가입 계정인지 확인하고 삭제 후 재시도
        try {
          const getUserResult = await cognitoClient.send(new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
          }));

          // UNCONFIRMED 상태면 삭제하고 재가입 허용
          if (getUserResult.UserStatus === 'UNCONFIRMED') {
            console.log(`[Signup] 미완료 계정 삭제: ${email}`);

            // Cognito에서 삭제
            await cognitoClient.send(new AdminDeleteUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: email,
            }));

            // DynamoDB에서도 삭제 (이메일로 조회 후 삭제)
            try {
              const queryResult = await docClient.send(new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: { ':email': email },
              }));

              if (queryResult.Items && queryResult.Items.length > 0) {
                await docClient.send(new DeleteCommand({
                  TableName: USERS_TABLE,
                  Key: { uid: queryResult.Items[0].uid },
                }));
              }
            } catch (dbError) {
              console.error('[Signup] DynamoDB 삭제 실패 (무시):', dbError);
            }

            // 재시도: Cognito 회원가입
            const retrySignUpCommand = new SignUpCommand({
              ClientId: USER_POOL_CLIENT_ID,
              Username: email,
              Password: password,
              UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'name', Value: name },
                { Name: 'phone_number', Value: `+82${phone.slice(1)}` },
              ],
            });

            await cognitoClient.send(retrySignUpCommand);
            // 성공 - 아래 DynamoDB 저장으로 계속 진행
          } else {
            // CONFIRMED 상태면 실제로 이미 가입된 계정
            return response(409, {
              success: false,
              error: '이미 등록된 이메일입니다.',
            });
          }
        } catch (adminError: any) {
          console.error('[Signup] 미완료 계정 처리 실패:', adminError);
          return response(409, {
            success: false,
            error: '이미 등록된 이메일입니다.',
          });
        }
      } else if (cognitoError.name === 'InvalidPasswordException') {
        return response(400, {
          success: false,
          error: '비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
        });
      } else if (cognitoError.name === 'InvalidParameterException') {
        return response(400, {
          success: false,
          error: cognitoError.message || '입력값이 올바르지 않습니다.',
        });
      } else {
        throw cognitoError;
      }
    }

    // DynamoDB에 사용자 정보 저장
    const now = new Date().toISOString();

    const userItem: Record<string, any> = {
      uid,
      email,
      name,
      phone,
      userType: userType || 'personal',
      authType: kakaoVerified ? 'kakao' : 'direct',
      socialProvider: kakaoVerified ? 'kakao' : 'none',
      kakaoId: kakaoId || null,
      isVerified: false,
      status: 'pending',
      grade: 'basic',
      feeRate: 4.5,
      isGradeManual: false,
      monthlyLimit: 20000000,
      usedAmount: 0,
      agreements: {
        service: agreements.service,
        privacy: agreements.privacy,
        thirdParty: agreements.thirdParty,
        marketing: agreements.marketing || false,
      },
      totalPaymentAmount: 0,
      totalDealCount: 0,
      lastMonthPaymentAmount: 0,
      history: [],
      createdAt: now,
      updatedAt: now,
    };

    // 사업자 정보 추가
    if (userType === 'business' && businessInfo) {
      userItem.businessInfo = {
        businessName: businessInfo.businessName,
        businessNumber: businessInfo.businessNumber.replace(/-/g, ''),
        representativeName: businessInfo.representativeName,
        businessLicenseKey: businessInfo.businessLicenseKey || null,
        verificationStatus: 'pending',
        verificationMemo: null,
        verifiedAt: null,
      };
    }

    // 카카오 인증 사용자는 자동 확인 (이메일 인증 스킵)
    if (kakaoVerified && kakaoId) {
      try {
        await cognitoClient.send(new AdminConfirmSignUpCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
        }));
        console.log(`[Signup] 카카오 사용자 자동 확인 완료: ${email}`);
        userItem.isVerified = true;
        userItem.status = 'active';
      } catch (confirmError: any) {
        console.error('[Signup] 카카오 사용자 자동 확인 실패:', confirmError);
        // 실패해도 계속 진행 (나중에 수동 인증 가능)
      }
    }

    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: userItem,
    }));

    const successMessage = kakaoVerified
      ? '회원가입이 완료되었습니다. 바로 로그인할 수 있습니다.'
      : '회원가입이 완료되었습니다. 이메일로 전송된 인증코드를 확인해주세요.';

    return response(200, {
      success: true,
      data: {
        message: successMessage,
        uid,
        autoConfirmed: kakaoVerified || false,
      },
    });
  } catch (error: any) {
    console.error('회원가입 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '회원가입 중 오류가 발생했습니다.',
    });
  }
};
