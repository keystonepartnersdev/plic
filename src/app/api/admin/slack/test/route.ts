// src/app/api/admin/slack/test/route.ts - 슬랙 알림 테스트
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { notifyNewUser, notifyNewDeal, sendTestNotification } from '@/lib/slack';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || 'test';

    // 디버그: DB에서 직접 webhook URL 조회
    let debugInfo: any = {};
    try {
      const result = await docClient.send(new GetCommand({
        TableName: CONTENTS_TABLE,
        Key: { pk: 'SETTINGS', sk: 'system' },
      }));
      debugInfo = {
        hasItem: !!result.Item,
        hasSettings: !!result.Item?.settings,
        hasWebhookUrl: !!result.Item?.settings?.slackWebhookUrl,
        webhookUrlPrefix: result.Item?.settings?.slackWebhookUrl?.substring(0, 30) + '...',
        table: CONTENTS_TABLE,
      };
    } catch (dbErr: any) {
      debugInfo = { dbError: dbErr.message };
    }

    let result = false;

    switch (type) {
      case 'signup':
        result = await notifyNewUser({
          name: '홍길동 (테스트)',
          email: 'test@example.com',
          phone: '010-1234-5678',
          grade: 'basic',
          feeRate: 4.5,
          perTransactionLimit: 2000000,
          monthlyLimit: 20000000,
          businessName: '테스트상사',
          businessNumber: '123-45-67890',
          ceoName: '홍길동',
        });
        break;
      case 'deal':
        result = await notifyNewDeal({
          dealId: 'TEST-' + Date.now(),
          dealType: '카드→계좌',
          amount: 500000,
          feeRate: 4.5,
          feeAmount: 22500,
          finalAmount: 522500,
          recipientBank: '국민은행',
          recipientHolder: '김수신 (테스트)',
          recipientAccount: '123-456-789012',
          userName: '홍길동 (테스트)',
          userPhone: '010-1234-5678',
          pgTransactionId: 'SM-TEST-001',
          pgAuthCd: 'AUTH-TEST-001',
        });
        break;
      default:
        result = await sendTestNotification();
        break;
    }

    if (result) {
      return NextResponse.json({ success: true, data: { message: '슬랙 알림이 전송되었습니다.' } });
    } else {
      return NextResponse.json({ success: false, error: '슬랙 알림 전송에 실패했습니다.', debug: debugInfo }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Slack Test] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
