// src/app/api/admin/slack/test/route.ts - 슬랙 알림 테스트
import { NextRequest, NextResponse } from 'next/server';
import { sendTestNotification, notifyNewUser, notifyNewDeal } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || 'test';

    let result = false;

    switch (type) {
      case 'signup':
        result = await notifyNewUser({
          name: '홍길동 (테스트)',
          email: 'test@example.com',
          phone: '010-1234-5678',
          grade: 'basic',
        });
        break;
      case 'deal':
        result = await notifyNewDeal({
          dealId: 'TEST-' + Date.now(),
          dealType: '카드→계좌',
          amount: 500000,
          recipientBank: '국민은행',
          recipientHolder: '김수신 (테스트)',
          userName: '홍길동 (테스트)',
          userPhone: '010-1234-5678',
        });
        break;
      default:
        result = await sendTestNotification();
        break;
    }

    if (result) {
      return NextResponse.json({ success: true, data: { message: '슬랙 알림이 전송되었습니다.' } });
    } else {
      return NextResponse.json({ success: false, error: '슬랙 알림 전송에 실패했습니다. Webhook URL을 확인해주세요.' }, { status: 500 });
    }
  } catch (error) {
    console.error('[Slack Test] Error:', error);
    return NextResponse.json({ success: false, error: '슬랙 테스트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
