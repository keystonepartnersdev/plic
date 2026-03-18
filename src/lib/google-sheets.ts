/**
 * Google Sheets 연동 유틸리티
 * 결제 완료 시 Google Apps Script 웹앱을 통해 스프레드시트에 거래 정보를 기록합니다.
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxunxaJQbX1c2yuyZxy-2ozZmXN84YCp7zDw-ewVujYhmWXAZC09K5HoRlevD039ala/exec';

export interface PaymentSheetRow {
  paidAt: string;              // 결제승인시각
  dealId: string;              // 플릭거래번호
  pgTransactionId: string;     // 소프트먼트 거래번호
  pgTrackId: string;           // 가맹점주문번호
  pgAuthCd: string;            // 승인번호
  dealType: string;            // 거래유형
  finalAmount: number;         // 총결제금액
  amount: number;              // 송금액
  feeAmount: number;           // 수수료
  recipientHolder: string;     // 수취인예금주
  recipientBank: string;       // 수취인은행
  recipientAccount: string;    // 수취인계좌번호
  senderName: string;          // 발송인
  userName: string;            // 사용자이름
  userPhone: string;           // 사용자연락처
  businessName: string;        // 사용자사업자명
  businessNumber: string;      // 사용자사업자등록번호
  representativeName: string;  // 사용자사업자대표자명
}

export async function appendPaymentToSheet(row: PaymentSheetRow): Promise<boolean> {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      console.error('[GoogleSheets] HTTP error:', res.status);
      return false;
    }

    const result = await res.json();
    if (result.success) {
      console.log('[GoogleSheets] Payment row appended successfully');
      return true;
    }

    console.error('[GoogleSheets] Script error:', result.error);
    return false;
  } catch (error) {
    console.error('[GoogleSheets] Failed to append row:', error);
    return false;
  }
}
