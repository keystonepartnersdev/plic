/**
 * 회원가입 프록시
 * POST /api/auth/signup - 회원가입
 * - Lambda로 프록시 후, 이메일 사전인증 완료된 사용자는 Cognito auto-confirm 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailPreVerified, ...signupBody } = body;

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupBody),
    });

    const data = await response.json();

    // Lambda 성공 + 이메일 사전인증 완료 → Cognito auto-confirm
    if (data.success && emailPreVerified && !data.data?.autoConfirmed) {
      try {
        await cognitoClient.send(new AdminConfirmSignUpCommand({
          UserPoolId: USER_POOL_ID,
          Username: body.email,
        }));
        console.log(`[Signup Proxy] Auto-confirmed email-verified user: ${body.email}`);

        // DynamoDB isVerified 업데이트
        const queryResult = await docClient.send(new QueryCommand({
          TableName: USERS_TABLE,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': body.email },
        }));

        if (queryResult.Items && queryResult.Items.length > 0) {
          await docClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { uid: queryResult.Items[0].uid },
            UpdateExpression: 'SET isVerified = :verified, authType = :authType, updatedAt = :now',
            ExpressionAttributeValues: {
              ':verified': true,
              ':authType': 'direct',
              ':now': new Date().toISOString(),
            },
          }));
        }

        data.data.autoConfirmed = true;
        data.data.message = '회원가입이 완료되었습니다.';
      } catch (confirmError: any) {
        console.error('[Signup Proxy] Auto-confirm failed:', confirmError);
        // 실패해도 가입 자체는 성공했으므로 에러 무시
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] /auth/signup POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
