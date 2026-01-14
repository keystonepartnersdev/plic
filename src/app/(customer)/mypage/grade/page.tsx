'use client';

import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { UserHelper } from '@/classes';
import { cn } from '@/lib/utils';

const grades = [
  { code: 'basic', name: '베이직', feeRate: 4.0, monthlyLimit: 10000000, color: 'bg-gray-100 text-gray-700' },
  { code: 'platinum', name: '플래티넘', feeRate: 3.5, monthlyLimit: 30000000, color: 'bg-purple-100 text-purple-700' },
  { code: 'b2b', name: 'B2B', feeRate: 3.0, monthlyLimit: 100000000, color: 'bg-blue-100 text-blue-700' },
  { code: 'employee', name: '임직원', feeRate: 1.0, monthlyLimit: 50000000, color: 'bg-green-100 text-green-700' },
];

export default function GradePage() {
  const { currentUser } = useUserStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="등급 안내" showBack />

      <div className="p-5">
        {/* 현재 내 등급 */}
        {currentUser && (
          <div className="bg-white rounded-xl p-5 mb-4">
            <p className="text-sm text-gray-500 mb-2">현재 내 등급</p>
            <div className="flex items-center gap-3">
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                grades.find(g => g.code === currentUser.grade)?.color || 'bg-gray-100 text-gray-700'
              )}>
                {UserHelper.getGradeConfig(currentUser.grade).name}
              </span>
              <span className="text-gray-600">
                수수료 {currentUser.feeRate}%
              </span>
            </div>
          </div>
        )}

        {/* 등급별 혜택 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">등급별 혜택</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {grades.map((grade) => (
              <div
                key={grade.code}
                className={cn(
                  'p-4',
                  currentUser?.grade === grade.code && 'bg-primary-50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    grade.color
                  )}>
                    {grade.name}
                  </span>
                  {currentUser?.grade === grade.code && (
                    <span className="text-xs text-primary-500 font-medium">현재 등급</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">수수료율</p>
                    <p className="font-semibold text-gray-900">{grade.feeRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">월 한도</p>
                    <p className="font-semibold text-gray-900">
                      {(grade.monthlyLimit / 10000).toLocaleString()}만원
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 등급 산정 기준 */}
        <div className="bg-white rounded-xl p-4 mt-4">
          <h2 className="font-bold text-gray-900 mb-3">등급 산정 기준</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              <span>베이직: 신규 가입 회원</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              <span>플래티넘: 전월 거래금액 500만원 이상</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              <span>B2B: 사업자 회원 (별도 심사)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              <span>임직원: 회사 임직원 전용</span>
            </li>
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            * 등급은 매월 1일 자동으로 재산정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
