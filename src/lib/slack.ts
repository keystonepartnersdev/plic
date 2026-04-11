// src/lib/slack.ts
// Slack 웹훅 알림 유틸리티

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

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
      TableName: CONTENTS_TABLE,
      Key: { pk: 'SETTINGS', sk: 'system' },
    }));

    cachedWebhookUrl = result.Item?.settings?.slackWebhookUrl || '';
    cacheExpiry = now + CACHE_TTL;
    return cachedWebhookUrl || null;
  } catch (error) {
    console.error('[Slack] Failed to get webhook URL:', error);
    return null;
  }
}

async function sendSlackMessage(text: string): Promise<boolean> {
  const webhookUrl = await getSlackWebhookUrl();
  if (!webhookUrl) {
    console.log('[Slack] Webhook URL not configured, skipping notification');
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
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

// 회원가입 알림
export async function notifyNewUser(params: {
  name: string;
  email: string;
  phone?: string;
  grade?: string;
  feeRate?: number;
  perTransactionLimit?: number;
  monthlyLimit?: number;
  businessName?: string;
  businessNumber?: string;
  ceoName?: string;
}): Promise<boolean> {
  const { name, email, phone, grade, feeRate, perTransactionLimit, monthlyLimit, businessName, businessNumber, ceoName } = params;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const lines = [
    `👤 신규 회원가입`,
    ``,
    `가입일시: ${now}`,
    `이름: ${name}`,
    `연락처: ${phone || '-'}`,
    `이메일: ${email}`,
    `등급: ${grade || 'basic'}`,
    `수수료율: ${feeRate ?? '-'}%`,
    `1회 결제 한도: ${perTransactionLimit ? perTransactionLimit.toLocaleString() + '원' : '-'}`,
    `월 한도: ${monthlyLimit ? monthlyLimit.toLocaleString() + '원' : '-'}`,
    ``,
    `[사업자정보]`,
    `상호: ${businessName || '-'}`,
    `사업자등록번호: ${businessNumber || '-'}`,
    `대표자명: ${ceoName || '-'}`,
  ];

  return sendSlackMessage(lines.join('\n'));
}

// 신규 거래 생성 알림
export async function notifyNewDeal(params: {
  dealId: string;
  dealType: string;
  amount: number;
  feeRate?: number;
  feeAmount?: number;
  finalAmount?: number;
  recipientBank?: string;
  recipientHolder?: string;
  recipientAccount?: string;
  userName: string;
  userPhone?: string;
  pgTransactionId?: string;
  pgAuthCd?: string;
}): Promise<boolean> {
  const { dealId, dealType, amount, feeRate, feeAmount, finalAmount, recipientBank, recipientHolder, recipientAccount, userName, userPhone, pgTransactionId, pgAuthCd } = params;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const totalAmount = finalAmount ?? amount;
  const fee = feeAmount ?? 0;

  const lines = [
    `🔔 신규 거래 생성`,
    ``,
    `신청일시: ${now}`,
    `PLIC거래번호: ${dealId}`,
    `소프트먼트거래번호: ${pgTransactionId || '-'}`,
    `승인번호: ${pgAuthCd || '-'}`,
    `거래명: ${dealType}`,
    ``,
    `총금액: ${totalAmount.toLocaleString()}원 (송금액: ${amount.toLocaleString()}원, 수수료(${feeRate ?? '-'}%): ${fee.toLocaleString()}원)`,
    ``,
    `사용자이름: ${userName}`,
    `연락처: ${userPhone || '-'}`,
    ``,
    `[수취인정보]`,
    `수취인명: ${recipientHolder || '-'}`,
    `은행: ${recipientBank || '-'}`,
    `계좌번호: ${recipientAccount || '-'}`,
  ];

  return sendSlackMessage(lines.join('\n'));
}

// 결제 완료 알림
export async function notifyPaymentComplete(params: {
  dealId: string;
  dealType: string;
  amount: number;
  feeRate: number;
  feeAmount: number;
  finalAmount: number;
  recipientBank: string;
  recipientHolder: string;
  recipientAccount: string;
  senderName: string;
  userName: string;
  userPhone: string;
  pgTransactionId: string;
  pgAuthCd: string;
}): Promise<boolean> {
  const {
    dealId, dealType, amount, feeRate, feeAmount, finalAmount,
    recipientBank, recipientHolder, recipientAccount,
    senderName, userName, userPhone,
    pgTransactionId, pgAuthCd,
  } = params;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const lines = [
    `🔔 결제완료!!`,
    ``,
    `PLIC거래번호: ${dealId}`,
    `소프트먼트거래번호: ${pgTransactionId || '-'}`,
    `승인번호: ${pgAuthCd || '-'}`,
    `거래유형: ${dealType}`,
    ``,
    `총 결제액: ${finalAmount.toLocaleString()}원`,
    `송금액: ${amount.toLocaleString()}원`,
    `수수료(${feeRate}%): ${feeAmount.toLocaleString()}원`,
    ``,
    `수취인: ${recipientHolder} | ${recipientBank} ${recipientAccount}`,
    `발송인: ${senderName || '-'}`,
    ``,
    `회원이름: ${userName}`,
    `연락처: ${userPhone}`,
    `시간: ${now}`,
  ];

  return sendSlackMessage(lines.join('\n'));
}

// 테스트 알림 발송
export async function sendTestNotification(): Promise<boolean> {
  return sendSlackMessage('✅ PLIC 슬랙 알림 연동 테스트 성공!');
}
