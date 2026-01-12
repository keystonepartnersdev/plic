// src/lib/gradeUtils.ts

import { IUser, TUserGrade, IUserHistory, IGradeChangeResult } from '@/types';
import { getNow } from './utils';

/**
 * 등급 라벨 상수
 */
export const GRADE_LABELS: Record<TUserGrade, string> = {
  basic: '베이직',
  platinum: '플래티넘',
  b2b: 'B2B',
  employee: '임직원',
};

/**
 * 등급 설정 타입
 */
export type TGradeSettings = Record<TUserGrade, { feeRate: number; monthlyLimit: number }>;

/**
 * 사용자의 전월 실적 기반 자동 등급 변경 처리
 * 베이직/플래티넘만 대상 (B2B, 임직원, 수동 등급은 제외)
 *
 * @param users 전체 사용자 목록
 * @param platinumThreshold 플래티넘 승급 기준 금액
 * @param basicThreshold 베이직 강등 기준 금액 (플래티넘 유지 기준)
 * @param gradeSettings 등급별 수수료율/한도 설정
 * @returns 등급 변경 결과와 업데이트된 사용자 목록
 */
export function processAutoGradeChange(
  users: IUser[],
  platinumThreshold: number,
  basicThreshold: number,
  gradeSettings: TGradeSettings
): { results: IGradeChangeResult[]; updatedUsers: IUser[] } {
  const results: IGradeChangeResult[] = [];
  const now = getNow();

  const updatedUsers = users.map((user) => {
    // 수동 등급이거나 B2B/임직원은 제외
    if (user.isGradeManual || user.grade === 'b2b' || user.grade === 'employee') {
      return user;
    }

    const lastMonthPayment = user.lastMonthPaymentAmount || 0;
    let newGrade: TUserGrade = user.grade;

    // 플래티넘 승급 조건: 전월 결제액 >= platinumThreshold
    if (user.grade === 'basic' && lastMonthPayment >= platinumThreshold) {
      newGrade = 'platinum';
    }
    // 베이직 강등 조건: 전월 결제액 < basicThreshold (플래티넘 유지 기준)
    else if (user.grade === 'platinum' && lastMonthPayment < basicThreshold) {
      newGrade = 'basic';
    }

    // 등급 변경이 없으면 그대로 반환
    if (newGrade === user.grade) {
      return user;
    }

    // 등급 변경 기록
    results.push({
      uid: user.uid,
      name: user.name,
      prevGrade: user.grade,
      newGrade,
      lastMonthPaymentAmount: lastMonthPayment,
    });

    const newSettings = gradeSettings[newGrade];
    const historyEntries: IUserHistory[] = [
      {
        id: `H${Date.now()}_grade_${user.uid}`,
        field: 'grade',
        fieldLabel: '회원 등급',
        prevValue: GRADE_LABELS[user.grade],
        newValue: GRADE_LABELS[newGrade],
        actor: 'system',
        actorLabel: '시스템',
        memo: `전월 실적 기준 자동 ${newGrade === 'platinum' ? '승급' : '강등'} (${(lastMonthPayment / 10000).toLocaleString()}만원)`,
        timestamp: now,
      },
    ];

    // 수수료율 변경 기록
    if (user.feeRate !== newSettings.feeRate) {
      historyEntries.push({
        id: `H${Date.now()}_feeRate_${user.uid}`,
        field: 'feeRate',
        fieldLabel: '수수료율',
        prevValue: `${user.feeRate}%`,
        newValue: `${newSettings.feeRate}%`,
        actor: 'system',
        actorLabel: '시스템',
        memo: `${GRADE_LABELS[newGrade]} 등급 적용`,
        timestamp: now,
      });
    }

    // 월 한도 변경 기록
    if (user.monthlyLimit !== newSettings.monthlyLimit) {
      historyEntries.push({
        id: `H${Date.now()}_limit_${user.uid}`,
        field: 'monthlyLimit',
        fieldLabel: '월 한도',
        prevValue: `${user.monthlyLimit.toLocaleString()}원`,
        newValue: `${newSettings.monthlyLimit.toLocaleString()}원`,
        actor: 'system',
        actorLabel: '시스템',
        memo: `${GRADE_LABELS[newGrade]} 등급 적용`,
        timestamp: now,
      });
    }

    return {
      ...user,
      grade: newGrade,
      feeRate: newSettings.feeRate,
      monthlyLimit: newSettings.monthlyLimit,
      history: [...historyEntries, ...(user.history || [])],
      updatedAt: now,
    };
  });

  return { results, updatedUsers };
}

/**
 * 모든 사용자의 월간 사용량을 초기화 (매월 1일 실행)
 * 현재 월 사용량을 전월 결제금액으로 이동하고 월 사용량 초기화
 *
 * @param users 전체 사용자 목록
 * @returns 초기화된 사용자 목록
 */
export function resetMonthlyUsage(users: IUser[]): IUser[] {
  const now = getNow();

  return users.map((user) => ({
    ...user,
    // 현재 월 사용량을 전월 결제금액으로 이동
    lastMonthPaymentAmount: user.usedAmount,
    // 월 사용량 초기화
    usedAmount: 0,
    updatedAt: now,
  }));
}
