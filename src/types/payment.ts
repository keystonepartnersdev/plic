// src/types/payment.ts

export type TPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type TPaymentType = 'single' | 'split';

export interface IRegisteredCard {
  cardId: string;
  billingKey: string;
  cardNickname: string;
  cardCompany: string;
  cardNumberLast4: string;
  isDefault: boolean;
  createdAt: string;
}

export interface IPaymentItem {
  cardId: string;
  amount: number;
  installment: number;
  status: TPaymentStatus;
  pgTransactionId?: string;
  paidAt?: string;
}

export interface IPayment {
  paymentId: string;
  did: string;
  uid: string;
  paymentType: TPaymentType;
  totalAmount: number;
  items: IPaymentItem[];
  status: TPaymentStatus;
  createdAt: string;
  completedAt?: string;
}
