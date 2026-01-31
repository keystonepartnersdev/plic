// src/classes/UserHelper.ts

import { IUser, TUserGrade } from '@/types/user';

interface IGradeConfig {
  feeRate: number;
  monthlyLimit: number;
  name: string;
}

export class UserHelper {
  // 등급별 설정값
  static GRADE_CONFIG: Record<TUserGrade, IGradeConfig> = {
    basic: { feeRate: 4.0, monthlyLimit: 10000000, name: '베이직' },
    platinum: { feeRate: 3.5, monthlyLimit: 30000000, name: '플래티넘' },
    b2b: { feeRate: 3.0, monthlyLimit: 100000000, name: 'B2B' },
    employee: { feeRate: 1.0, monthlyLimit: 100000000, name: '임직원' },
  };

  // UID 생성
  static generateUID(): string {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `U${yy}${mm}${dd}${random}`;
  }

  // 등급별 설정 반환
  static getGradeConfig(grade: TUserGrade): IGradeConfig {
    return this.GRADE_CONFIG[grade] || this.GRADE_CONFIG['basic'];
  }

  // 잔여 한도 계산
  static getRemainingLimit(user: IUser): number {
    return user.monthlyLimit - user.usedAmount;
  }

  // 한도 사용률 (%)
  static getUsageRate(user: IUser): number {
    return Math.round((user.usedAmount / user.monthlyLimit) * 100);
  }

  // 신규 사용자 생성
  static createNewUser(
    name: string,
    phone: string,
    authType: 'direct' | 'social',
    agreements: IUser['agreements'],
    userType: 'personal' | 'business' = 'personal'
  ): IUser {
    const gradeConfig = this.GRADE_CONFIG['basic'];
    const now = new Date().toISOString();

    return {
      uid: this.generateUID(),
      name,
      phone,
      userType,
      authType,
      socialProvider: null,
      isVerified: false,
      status: 'pending',
      grade: 'basic',
      feeRate: gradeConfig.feeRate,
      monthlyLimit: gradeConfig.monthlyLimit,
      usedAmount: 0,
      agreements,
      totalPaymentAmount: 0,
      totalDealCount: 0,
      lastMonthPaymentAmount: 0,
      isGradeManual: false,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}
