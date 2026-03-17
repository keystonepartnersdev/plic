// src/lib/slack.ts
// Slack 웹훅 알림 유틸리티

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const SETTINGS_TABLE = process.env.SETTINGS_TABLE || 'plic-settings';

// 캐시: 웹훅 URL을 매번 DB에서 읽지 않도록 (5분 캐시)
let cachedWebhookUrl: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

async function getSlackWebhookUrl(): Promise<string | null> {
  const now = Date.now();
  if (cachedWebhookUrl !== null && now < cacheExpiry) {
    return cachedWebhookUrl || null;
  }

  try {
    const result = await docClient.send(new GetCommand({
      TableName: SETTINGS_TABLE,
      Key: { settingId: 'SYSTEM_SETTINGS' },
    }));

    cachedWebhookUrl = result.Item?.slackWebhookUrl || '';
    cacheExpiry = now + CACHE_TTL;
    return cachedWebhookUrl || null;
  } catch (error) {
    console.error('[Slack] Failed to get webhook URL:', error);
    return null;
  }
}

async function sendSlackMessage(text: string, blocks?: unknown[]): Promise<boolean> {
  const webhookUrl = await getSlackWebhookUrl();
  if (!webhookUrl) {
    console.log('[Slack] Webhook URL not configured, skipping notification');
    return false;
  }

  try {
    const payload: Record<string, unknown> = { text };
    if (blocks) payload.blocks = blocks;

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('[Slack] Failed to send message:', res.status, await res.text());
      return false;
    }

    console.log('[Slack] Notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Slack] Error sending message:', error);
    return false;
  }
}

// 신규 회원가입 알림
export async function notifyNewSignup(params: {
  name: string;
  email: string;
  phone: string;
  userType: string;
  authType: string;
}): Promise<boolean> {
  const { name, email, phone, userType, authType } = params;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const typeLabel = userType === 'business' ? '사업자' : '개인';
  const authLabel = authType === 'kakao' ? '카카오' : '이메일';

  return sendSlackMessage(
    `🎉 신규 회원가입\n이름: ${name}\n이메일: ${email}\n연락처: ${phone}\n유형: ${typeLabel} | 가입방식: ${authLabel}\n시간: ${now}`
  );
}

// 결제 완료 알림
export async function notifyPaymentComplete(params: {
  dealId: string;
  dealName: string;
  amount: number;
  finalAmount: number;
  recipientName: string;
  recipientBank: string;
  userName?: string;
}): Promise<boolean> {
  const { dealId, dealName, amount, finalAmount, recipientName, recipientBank, userName } = params;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  return sendSlackMessage(
    `💰 결제 완료\n거래: ${dealName} (${dealId})\n송금액: ${amount.toLocaleString()}원\n결제액: ${finalAmount.toLocaleString()}원\n수취인: ${recipientName} (${recipientBank})\n${userName ? `신청자: ${userName}\n` : ''}시간: ${now}`
  );
}
