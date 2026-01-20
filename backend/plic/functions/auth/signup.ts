// backend/functions/auth/signup.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, SignUpCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
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
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
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
    const { email, password, name, phone, userType, businessInfo, agreements } = body;

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
          { Name: 'custom:uid', Value: uid },
          { Name: 'custom:userType', Value: userType || 'personal' },
        ],
      });

      await cognitoClient.send(signUpCommand);
    } catch (cognitoError: any) {
      if (cognitoError.name === 'UsernameExistsException') {
        return response(409, {
          success: false,
          error: '이미 등록된 이메일입니다.',
        });
      }
      if (cognitoError.name === 'InvalidPasswordException') {
        return response(400, {
          success: false,
          error: '비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
        });
      }
      if (cognitoError.name === 'InvalidParameterException') {
        return response(400, {
          success: false,
          error: cognitoError.message || '입력값이 올바르지 않습니다.',
        });
      }
      throw cognitoError;
    }

    // DynamoDB에 사용자 정보 저장
    const now = new Date().toISOString();

    const userItem: Record<string, any> = {
      uid,
      email,
      name,
      phone,
      userType: userType || 'personal',
      authType: 'direct',
      socialProvider: 'none',
      isVerified: false,
      status: 'pending',
      grade: 'basic',
      feeRate: 2.5,
      isGradeManual: false,
      monthlyLimit: 5000000,
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

    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: userItem,
    }));

    return response(200, {
      success: true,
      data: {
        message: '회원가입이 완료되었습니다. 이메일로 전송된 인증코드를 확인해주세요.',
        uid,
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
