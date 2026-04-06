/**
 * 회원가입 프록시
 * POST /api/auth/signup - 회원가입
 * - Lambda로 프록시 후, 이메일 사전인증 완료된 사용자는 Cognito auto-confirm 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';
const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';
const USER_COUPONS_TABLE = 'plic-user-coupons';

/**
 * signup_auto 쿠폰 자동 지급
 * plic-discounts에서 issueMethod === 'signup_auto' && 현재 날짜가 자동지급 기간 내인 쿠폰을 찾아 지급
 */
async function issueSignupAutoCoupons(uid: string) {
  try {
    const now = new Date().toISOString();
    const today = now.split('T')[0]; // YYYY-MM-DD

    // signup_auto 쿠폰 템플릿 조회
    const discountsResult = await docClient.send(new ScanCommand({
      TableName: DISCOUNTS_TABLE,
      FilterExpression: 'issueMethod = :method AND isActive = :active',
      ExpressionAttributeValues: {
        ':method': 'signup_auto',
        ':active': true,
      },
    }));

    const autoDiscounts = (discountsResult.Items || []).filter(d => {
      const startDate = d.autoIssueStartDate as string;
      const endDate = d.autoIssueEndDate as string;
      if (!startDate || !endDate) return true; // 기간 미설정 시 항상 지급
      return today >= startDate && today <= endDate;
    });

    let issuedCount = 0;
    for (const discount of autoDiscounts) {
      const id = uuidv4();
      const usageType = (discount.usageType as string) || 'single';

      // 유효기간 계산
      let expiresAt: string;
      const expiryDays = discount.usageExpiryDays as number;
      if (expiryDays && expiryDays > 0) {
        const date = new Date(now);
        date.setDate(date.getDate() + expiryDays);
        expiresAt = date.toISOString();
      } else {
        expiresAt = (discount.expiry as string) || new Date('2099-12-31').toISOString();
      }

      await docClient.send(new PutCommand({
        TableName: USER_COUPONS_TABLE,
        Item: {
          id,
          uid,
          discountId: discount.id,
          discountSnapshot: {
            name: discount.name,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            applicableDealTypes: discount.applicableDealTypes || [],
          },
          isUsed: false,
          usedCount: 0,
          maxUsage: usageType === 'single' ? 1 : usageType === 'limited' ? (discount.maxUsagePerUser || 1) : 999999,
          issuedAt: now,
          expiresAt,
          createdAt: now,
          updatedAt: now,
        },
      }));
      issuedCount++;
    }

    if (issuedCount > 0) {
      console.log(`[Signup Auto Coupon] Issued ${issuedCount} coupons to user ${uid}`);
    }
  } catch (error) {
    console.error('[Signup Auto Coupon] Error:', error);
    // 쿠폰 지급 실패해도 가입 자체는 성공
  }
}

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

    // 가입 성공 시: signup_auto 쿠폰 자동 지급
    if (data.success && data.data?.uid) {
      await issueSignupAutoCoupons(data.data.uid);
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
