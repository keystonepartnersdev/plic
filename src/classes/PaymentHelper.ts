// src/classes/PaymentHelper.ts

import { IPayment, IRegisteredCard, TPaymentType } from '@/types/payment';

export class PaymentHelper {
  // Payment ID 생성
  static generatePaymentId(): string {
    return `P${Date.now().toString(36).toUpperCase()}`;
  }

  // Card ID 생성
  static generateCardId(): string {
    return `CARD${Date.now().toString(36).toUpperCase()}`;
  }

  // Billing Key 생성 (Mock)
  static generateBillingKey(): string {
    return `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  // 단일 결제 생성
  static createSinglePayment(
    did: string,
    uid: string,
    amount: number,
    cardId: string,
    installment: number = 0
  ): IPayment {
    return {
      paymentId: this.generatePaymentId(),
      did,
      uid,
      paymentType: 'single',
      totalAmount: amount,
      items: [{
        cardId,
        amount,
        installment,
        status: 'pending',
      }],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  // 분할 결제 생성
  static createSplitPayment(
    did: string,
    uid: string,
    totalAmount: number,
    splitItems: Array<{ cardId: string; amount: number; installment: number }>
  ): IPayment {
    const sumAmount = splitItems.reduce((sum, item) => sum + item.amount, 0);
    if (sumAmount !== totalAmount) {
      throw new Error('분할 결제 금액의 합이 총 결제 금액과 일치하지 않습니다.');
    }

    return {
      paymentId: this.generatePaymentId(),
      did,
      uid,
      paymentType: 'split',
      totalAmount,
      items: splitItems.map(item => ({
        ...item,
        status: 'pending' as const,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  // 카드 등록 생성 (Mock)
  static createRegisteredCard(
    cardNickname: string,
    cardCompany: string,
    cardNumberLast4: string,
    isDefault: boolean = false
  ): IRegisteredCard {
    return {
      cardId: this.generateCardId(),
      billingKey: this.generateBillingKey(),
      cardNickname,
      cardCompany,
      cardNumberLast4,
      isDefault,
      createdAt: new Date().toISOString(),
    };
  }

  // 카드사 목록
  static CARD_COMPANIES = [
    { code: 'shinhan', name: '신한카드' },
    { code: 'samsung', name: '삼성카드' },
    { code: 'kb', name: 'KB국민카드' },
    { code: 'hyundai', name: '현대카드' },
    { code: 'lotte', name: '롯데카드' },
    { code: 'bc', name: 'BC카드' },
    { code: 'hana', name: '하나카드' },
    { code: 'nh', name: 'NH농협카드' },
    { code: 'woori', name: '우리카드' },
  ];

  // 할부 옵션
  static INSTALLMENT_OPTIONS = [
    { value: 0, label: '일시불' },
    { value: 2, label: '2개월' },
    { value: 3, label: '3개월' },
    { value: 4, label: '4개월' },
    { value: 5, label: '5개월' },
    { value: 6, label: '6개월' },
    { value: 7, label: '7개월' },
    { value: 8, label: '8개월' },
    { value: 9, label: '9개월' },
    { value: 10, label: '10개월' },
    { value: 11, label: '11개월' },
    { value: 12, label: '12개월' },
  ];
}
