// src/lib/ses.ts - SES 이메일 발송 공통 유틸
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const SES_SENDER = process.env.SES_SENDER_EMAIL || 'noreply@plic.kr';

// 공통 이메일 래퍼 HTML
function wrapEmailHtml(title: string, bodyContent: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;padding:40px 20px;background:#ffffff;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="font-size:28px;font-weight:800;color:#2563EB;margin:0;">PLIC</h1>
        <p style="font-size:13px;color:#94a3b8;margin-top:4px;">카드로 송금하다</p>
      </div>
      <h2 style="font-size:20px;font-weight:700;color:#111;margin-bottom:24px;text-align:center;">${title}</h2>
      ${bodyContent}
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="font-size:12px;color:#94a3b8;">본 메일은 PLIC 서비스에서 자동 발송되었습니다.</p>
        <p style="font-size:12px;color:#94a3b8;">문의: support@plic.kr</p>
      </div>
    </div>
  `;
}

// 이메일 인증코드 발송
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const html = wrapEmailHtml('이메일 인증', `
    <p style="font-size:16px;color:#333;margin-bottom:24px;">아래 인증코드를 입력해주세요.</p>
    <div style="text-align:center;padding:24px;background:#f8f9fa;border-radius:12px;margin-bottom:24px;">
      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563EB;">${code}</span>
    </div>
    <p style="font-size:14px;color:#888;">이 인증코드는 5분간 유효합니다.<br/>본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
  `);

  await sesClient.send(new SendEmailCommand({
    Source: SES_SENDER,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: '[PLIC] 이메일 인증코드', Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  }));
}

// 임시 비밀번호 발송
export async function sendTemporaryPasswordEmail(to: string, tempPassword: string): Promise<void> {
  const html = wrapEmailHtml('임시 비밀번호 안내', `
    <p style="font-size:16px;color:#333;margin-bottom:16px;">비밀번호 재설정 요청에 따라 임시 비밀번호를 발급해드립니다.</p>
    <div style="text-align:center;padding:24px;background:#f8f9fa;border-radius:12px;margin-bottom:24px;">
      <p style="font-size:13px;color:#64748b;margin:0 0 8px 0;">임시 비밀번호</p>
      <span style="font-size:24px;font-weight:700;letter-spacing:2px;color:#2563EB;">${tempPassword}</span>
    </div>
    <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="font-size:14px;color:#92400e;margin:0;font-weight:600;">⚠️ 보안 안내</p>
      <p style="font-size:13px;color:#92400e;margin:8px 0 0 0;">로그인 후 반드시 비밀번호를 변경해주세요.<br/>임시 비밀번호는 24시간 동안만 유효합니다.</p>
    </div>
    <p style="font-size:14px;color:#888;">본인이 요청하지 않았다면 이 이메일을 무시하세요.<br/>계정 보안에 문제가 있다고 판단되면 고객센터로 연락해주세요.</p>
  `);

  await sesClient.send(new SendEmailCommand({
    Source: SES_SENDER,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: '[PLIC] 임시 비밀번호 안내', Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  }));
}

// 송금 완료 알림 이메일
export async function sendTransferCompleteEmail(to: string, data: {
  dealId: string;
  amount: number;
  feeAmount: number;
  finalAmount: number;
  recipientBank: string;
  recipientAccount: string;
  recipientHolder: string;
  transferredAt: string;
}): Promise<void> {
  const formattedAmount = data.amount.toLocaleString('ko-KR');
  const formattedFee = data.feeAmount.toLocaleString('ko-KR');
  const formattedFinal = data.finalAmount.toLocaleString('ko-KR');
  const formattedDate = new Date(data.transferredAt).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const html = wrapEmailHtml('송금 완료 안내', `
    <p style="font-size:16px;color:#333;margin-bottom:24px;">요청하신 거래의 송금이 완료되었습니다.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="text-align:center;margin-bottom:16px;">
        <span style="font-size:14px;color:#16a34a;font-weight:600;">✅ 송금 완료</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">거래번호</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;font-weight:600;">${data.dealId.slice(-8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">결제 금액</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;">${formattedAmount}원</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">수수료</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;">${formattedFee}원</td>
        </tr>
        <tr style="border-top:1px solid #d1fae5;">
          <td style="padding:12px 0 8px;font-size:15px;color:#111;font-weight:700;">송금 금액</td>
          <td style="padding:12px 0 8px;font-size:18px;color:#2563EB;text-align:right;font-weight:700;">${formattedFinal}원</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">수취 은행</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;">${data.recipientBank}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">수취 계좌</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;">${data.recipientAccount}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">예금주</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;">${data.recipientHolder}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#64748b;">송금 완료 시각</td>
          <td style="padding:8px 0;font-size:14px;color:#111;text-align:right;">${formattedDate}</td>
        </tr>
      </table>
    </div>
    <p style="font-size:14px;color:#888;">거래 내역은 PLIC 앱에서 확인하실 수 있습니다.</p>
  `);

  await sesClient.send(new SendEmailCommand({
    Source: SES_SENDER,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `[PLIC] 송금 완료 - ${formattedFinal}원`, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  }));
}
