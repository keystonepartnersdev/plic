import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { signUp } from '../../lib/cognito';
import { putItem, Tables, getItem, queryItems } from '../../lib/dynamodb';
import { success, error, serverError } from '../../lib/response';
import { generateUID, now, GRADE_CONFIG } from '../../lib/utils';
import { IUser } from '../../types';

interface SignUpBody {
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
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: SignUpBody = JSON.parse(event.body || '{}');

    // 필수 필드 검증
    if (!body.email || !body.password || !body.name || !body.phone) {
      return error('이메일, 비밀번호, 이름, 전화번호는 필수입니다.');
    }

    // 필수 약관 동의 검증
    if (!body.agreements?.service || !body.agreements?.privacy) {
      return error('서비스 이용약관과 개인정보 처리방침에 동의해주세요.');
    }

    // 이메일 중복 확인
    const existingUsers = await queryItems<IUser>(
      Tables.USERS,
      'email-index',
      'email = :email',
      { ':email': body.email }
    );

    if (existingUsers.length > 0) {
      return error('이미 가입된 이메일입니다.');
    }

    // 전화번호 중복 확인
    const existingPhones = await queryItems<IUser>(
      Tables.USERS,
      'phone-index',
      'phone = :phone',
      { ':phone': body.phone }
    );

    if (existingPhones.length > 0) {
      return error('이미 가입된 전화번호입니다.');
    }

    // Cognito 회원가입
    await signUp(body.email, body.password, body.name, body.phone);

    // DynamoDB에 사용자 정보 저장
    const gradeConfig = GRADE_CONFIG.basic;
    const timestamp = now();

    const user: IUser = {
      uid: generateUID(),
      name: body.name,
      phone: body.phone,
      email: body.email,
      authType: 'direct',
      socialProvider: null,
      isVerified: false,
      status: 'pending',
      grade: 'basic',
      feeRate: gradeConfig.feeRate,
      isGradeManual: false,
      monthlyLimit: gradeConfig.monthlyLimit,
      usedAmount: 0,
      agreements: body.agreements,
      totalPaymentAmount: 0,
      totalDealCount: 0,
      lastMonthPaymentAmount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await putItem(Tables.USERS, user);

    return success({
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
      uid: user.uid,
    }, 201);

  } catch (err: any) {
    console.error('Signup error:', err);
    
    if (err.name === 'UsernameExistsException') {
      return error('이미 가입된 이메일입니다.');
    }
    if (err.name === 'InvalidPasswordException') {
      return error('비밀번호는 8자 이상, 대문자, 소문자, 숫자를 포함해야 합니다.');
    }
    
    return serverError('회원가입 처리 중 오류가 발생했습니다.');
  }
};
