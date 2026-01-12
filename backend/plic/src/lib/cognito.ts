import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-2' });

const USER_POOL_ID = 'ap-northeast-2_zEYkk3i56';
const CLIENT_ID = '41i4ud2ehrctcgehuvctd5g7oa';

// 전화번호 포맷 (010xxxx -> +8210xxxx)
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return '+82' + cleaned.substring(1);
  }
  if (cleaned.startsWith('82')) {
    return '+' + cleaned;
  }
  return '+82' + cleaned;
}

// 회원가입
export async function signUp(email: string, password: string, name: string, phone?: string) {
  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'name', Value: name },
  ];
  
  if (phone) {
    userAttributes.push({ Name: 'phone_number', Value: formatPhoneNumber(phone) });
  }

  const result = await client.send(new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  }));

  return result;
}

// 회원가입 확인 (이메일 인증)
export async function confirmSignUp(email: string, code: string) {
  const result = await client.send(new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  }));

  return result;
}

// 로그인
export async function signIn(email: string, password: string) {
  const result = await client.send(new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  }));

  return {
    accessToken: result.AuthenticationResult?.AccessToken,
    refreshToken: result.AuthenticationResult?.RefreshToken,
    idToken: result.AuthenticationResult?.IdToken,
    expiresIn: result.AuthenticationResult?.ExpiresIn,
  };
}

// 토큰 갱신
export async function refreshTokens(refreshToken: string) {
  const result = await client.send(new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  }));

  return {
    accessToken: result.AuthenticationResult?.AccessToken,
    idToken: result.AuthenticationResult?.IdToken,
    expiresIn: result.AuthenticationResult?.ExpiresIn,
  };
}

// 로그아웃 (모든 토큰 무효화)
export async function signOut(accessToken: string) {
  await client.send(new GlobalSignOutCommand({
    AccessToken: accessToken,
  }));
}

// 토큰으로 사용자 정보 조회
export async function getUserFromToken(accessToken: string) {
  const result = await client.send(new GetUserCommand({
    AccessToken: accessToken,
  }));

  const attributes: Record<string, string> = {};
  result.UserAttributes?.forEach((attr) => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });

  return {
    username: result.Username,
    email: attributes['email'],
    name: attributes['name'],
    phone: attributes['phone_number'],
    emailVerified: attributes['email_verified'] === 'true',
  };
}

// 토큰 검증 (Authorization 헤더에서 추출)
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}
