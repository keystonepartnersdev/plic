'use client';

import { useState, useEffect } from 'react';
import {
  Percent,
  CreditCard,
  Clock,
  Bell,
  Shield,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore, useAdminUserStore, defaultSettings } from '@/stores';
import { TUserGrade, IUserHistory } from '@/types';

const API_BASE_URL = 'https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod';

const GRADE_LABELS: Record<TUserGrade, string> = {
  basic: '베이직',
  platinum: '플래티넘',
  b2b: 'B2B',
  employee: '임직원',
};

type TabType = 'grade' | 'operation' | 'notification' | 'security';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('grade');
  const { settings, updateSettings, updateGradeSettings, updateGradeCriteria, resetSettings } = useSettingsStore();
  const { users, updateUser } = useAdminUserStore();

  const [localSettings, setLocalSettings] = useState<typeof defaultSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 클라이언트 hydration 후 API에서 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/settings`);
        const data = await response.json();
        if (data.success && data.data?.settings) {
          const apiSettings = {
            ...defaultSettings,
            ...data.data.settings,
            gradeSettings: {
              ...defaultSettings.gradeSettings,
              ...(data.data.settings.gradeSettings || {}),
            },
          };
          setLocalSettings(apiSettings);
          updateSettings(apiSettings);
        } else {
          // Fallback to local store
          const settingsToUse = {
            ...defaultSettings,
            ...settings,
            gradeSettings: {
              ...defaultSettings.gradeSettings,
              ...(settings.gradeSettings || {}),
            },
          };
          setLocalSettings(settingsToUse);
        }
      } catch (error) {
        console.error('Failed to load settings from API:', error);
        // Fallback to local store
        const settingsToUse = {
          ...defaultSettings,
          ...settings,
          gradeSettings: {
            ...defaultSettings.gradeSettings,
            ...(settings.gradeSettings || {}),
          },
        };
        setLocalSettings(settingsToUse);
      }
      setIsHydrated(true);
    };

    loadSettings();
  }, []); // Only run once on mount

  // 등급별 설정이 변경되었을 때 해당 등급 회원들에게 일괄 적용
  const applyGradeSettingsToUsers = (grade: TUserGrade, feeRate: number, monthlyLimit: number) => {
    const now = new Date().toISOString();
    const historyId = `H${Date.now().toString(36).toUpperCase()}`;

    users.forEach((user) => {
      if (user.grade === grade) {
        const historyEntries: IUserHistory[] = [];

        // 수수료율 변경 기록
        if (user.feeRate !== feeRate) {
          historyEntries.push({
            id: `${historyId}_fee`,
            field: 'feeRate',
            fieldLabel: '수수료율',
            prevValue: `${user.feeRate}%`,
            newValue: `${feeRate}%`,
            actor: 'system',
            actorLabel: '시스템(정책 변경)',
            memo: `${GRADE_LABELS[grade]} 등급 수수료 정책 변경`,
            timestamp: now,
          });
        }

        // 월 한도 변경 기록
        if (user.monthlyLimit !== monthlyLimit) {
          historyEntries.push({
            id: `${historyId}_limit`,
            field: 'monthlyLimit',
            fieldLabel: '월 한도',
            prevValue: `${user.monthlyLimit.toLocaleString()}원`,
            newValue: `${monthlyLimit.toLocaleString()}원`,
            actor: 'system',
            actorLabel: '시스템(정책 변경)',
            memo: `${GRADE_LABELS[grade]} 등급 한도 정책 변경`,
            timestamp: now,
          });
        }

        if (historyEntries.length > 0) {
          updateUser(user.uid, {
            feeRate,
            monthlyLimit,
            history: [...historyEntries, ...(user.history || [])],
          });
        }
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    // 등급별 설정 변경 감지 및 회원 일괄 적용
    const grades: TUserGrade[] = ['basic', 'platinum', 'b2b', 'employee'];
    grades.forEach((grade) => {
      const prevSettings = settings.gradeSettings[grade];
      const newSettings = localSettings.gradeSettings[grade];

      if (prevSettings.feeRate !== newSettings.feeRate || prevSettings.monthlyLimit !== newSettings.monthlyLimit) {
        applyGradeSettingsToUsers(grade, newSettings.feeRate, newSettings.monthlyLimit);
      }
    });

    // 로컬 스토어 저장
    updateSettings(localSettings);

    // API에 설정 저장
    try {
      await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: localSettings }),
      });
    } catch (error) {
      console.error('Failed to save settings to API:', error);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
      resetSettings();
      setLocalSettings(defaultSettings);
    }
  };

  const tabs = [
    { id: 'grade', label: '등급 설정', icon: TrendingUp },
    { id: 'operation', label: '운영 설정', icon: Clock },
    { id: 'notification', label: '알림 설정', icon: Bell },
    { id: 'security', label: '보안 설정', icon: Shield },
  ] as const;

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-500 mt-1">시스템 설정을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 h-10 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            초기화
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-2 h-10 px-4 font-medium rounded-lg transition-colors',
              saveSuccess
                ? 'bg-green-500 text-white'
                : 'bg-primary-400 hover:bg-primary-500 text-white'
            )}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                저장 완료
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                저장하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap',
                  activeTab === tab.id ? 'text-primary-400' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 설정 내용 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'grade' && (
          <GradeSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
        )}
        {activeTab === 'operation' && (
          <OperationSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
        )}
        {activeTab === 'notification' && (
          <NotificationSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
        )}
        {activeTab === 'security' && (
          <SecuritySettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
        )}
      </div>
    </div>
  );
}

// 등급 설정
function GradeSettings({
  localSettings,
  setLocalSettings,
}: {
  localSettings: typeof defaultSettings;
  setLocalSettings: (s: typeof defaultSettings) => void;
}) {
  const { processAutoGradeChange, resetMonthlyUsage, users } = useAdminUserStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    type: 'grade' | 'reset';
    count: number;
    message: string;
  } | null>(null);

  const grades: TUserGrade[] = ['basic', 'platinum', 'b2b', 'employee'];

  // 자동 등급 변경 실행
  const handleAutoGradeChange = async () => {
    if (!confirm('전월 실적 기준으로 자동 등급 변경을 실행하시겠습니까?\n(베이직/플래티넘 등급만 대상)')) {
      return;
    }

    setIsProcessing(true);

    // 약간의 딜레이 추가 (UX)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const results = processAutoGradeChange(
      localSettings.gradeCriteria.platinumThreshold,
      localSettings.gradeCriteria.basicThreshold,
      localSettings.gradeSettings
    );

    setIsProcessing(false);

    if (results.length === 0) {
      setProcessResult({
        type: 'grade',
        count: 0,
        message: '등급 변경 대상 회원이 없습니다.',
      });
    } else {
      const upgraded = results.filter((r) => r.newGrade === 'platinum').length;
      const downgraded = results.filter((r) => r.newGrade === 'basic').length;
      setProcessResult({
        type: 'grade',
        count: results.length,
        message: `${results.length}명의 회원 등급이 변경되었습니다. (승급: ${upgraded}명, 강등: ${downgraded}명)`,
      });
    }

    setTimeout(() => setProcessResult(null), 5000);
  };

  // 월간 사용량 리셋 실행
  const handleMonthlyReset = async () => {
    if (!confirm('월간 사용량을 리셋하시겠습니까?\n(현재 월 사용량이 전월 결제금액으로 이동하고, 월 사용량이 0으로 초기화됩니다)')) {
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    resetMonthlyUsage();

    setIsProcessing(false);
    setProcessResult({
      type: 'reset',
      count: users.length,
      message: `${users.length}명 회원의 월간 사용량이 리셋되었습니다.`,
    });

    setTimeout(() => setProcessResult(null), 5000);
  };

  return (
    <div className="space-y-8">
      {/* 등급별 수수료/한도 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">등급별 수수료 및 한도</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">등급</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">수수료율</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">월 한도</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => {
                const gradeSetting = localSettings.gradeSettings?.[grade];
                if (!gradeSetting) return null;

                return (
                  <tr key={grade} className="border-b border-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">{GRADE_LABELS[grade]}</span>
                      {(grade === 'b2b' || grade === 'employee') && (
                        <span className="ml-2 text-xs text-gray-400">(수동 부여만 가능)</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative w-32">
                        <input
                          type="number"
                          value={gradeSetting.feeRate}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              gradeSettings: {
                                ...localSettings.gradeSettings,
                                [grade]: {
                                  ...gradeSetting,
                                  feeRate: parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          step="0.1"
                          className="w-full h-10 px-4 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative w-48">
                        <input
                          type="number"
                          value={gradeSetting.monthlyLimit}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              gradeSettings: {
                                ...localSettings.gradeSettings,
                                [grade]: {
                                  ...gradeSetting,
                                  monthlyLimit: parseInt(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="w-full h-10 px-4 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">원</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(gradeSetting.monthlyLimit / 10000).toLocaleString()}만원
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">등급별 설정 변경 안내</p>
              <p className="text-sm text-yellow-700 mt-1">
                수수료율 또는 한도를 변경하고 저장하면, 해당 등급의 모든 회원에게 즉시 적용됩니다.
                변경 내역은 각 회원의 히스토리에 기록됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 자동 등급 기준 */}
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">자동 등급 기준 (베이직 ↔ 플래티넘)</h3>
        <p className="text-sm text-gray-500 mb-4">
          매월 1일, 전월 결제 실적에 따라 베이직/플래티넘 등급이 자동으로 조정됩니다.
          B2B 및 임직원 등급은 어드민에서 수동 부여만 가능합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">플래티넘 승급 기준</span>
            </div>
            <label className="block text-sm text-gray-600 mb-1">전월 결제액 이상</label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.gradeCriteria.platinumThreshold}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    gradeCriteria: {
                      ...localSettings.gradeCriteria,
                      platinumThreshold: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full h-10 px-4 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">원</span>
            </div>
            <p className="text-xs text-purple-700 mt-2">
              전월 {(localSettings.gradeCriteria.platinumThreshold / 10000).toLocaleString()}만원 이상 결제 시 플래티넘으로 승급
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-gray-600 rotate-180" />
              <span className="font-medium text-gray-900">베이직 강등 기준</span>
            </div>
            <label className="block text-sm text-gray-600 mb-1">전월 결제액 미만</label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.gradeCriteria.basicThreshold}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    gradeCriteria: {
                      ...localSettings.gradeCriteria,
                      basicThreshold: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full h-10 px-4 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">원</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              전월 {(localSettings.gradeCriteria.basicThreshold / 10000).toLocaleString()}만원 미만 결제 시 베이직으로 강등
            </p>
          </div>
        </div>
      </div>

      {/* 수동 실행 */}
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">수동 실행</h3>
        <p className="text-sm text-gray-500 mb-4">
          일반적으로 매월 1일 자동 실행되는 작업을 수동으로 실행할 수 있습니다.
          테스트 또는 긴급 상황에서만 사용하세요.
        </p>

        {/* 결과 메시지 */}
        {processResult && (
          <div className={cn(
            'mb-4 p-4 rounded-lg flex items-center gap-3',
            processResult.count > 0 ? 'bg-green-50' : 'bg-gray-50'
          )}>
            <Check className={cn(
              'w-5 h-5',
              processResult.count > 0 ? 'text-green-600' : 'text-gray-600'
            )} />
            <p className={cn(
              'text-sm font-medium',
              processResult.count > 0 ? 'text-green-700' : 'text-gray-700'
            )}>
              {processResult.message}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleMonthlyReset}
            disabled={isProcessing}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors',
              isProcessing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            월간 사용량 리셋
          </button>
          <button
            onClick={handleAutoGradeChange}
            disabled={isProcessing}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
              isProcessing
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            )}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            자동 등급 변경 실행
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">실행 순서 안내</p>
              <p className="text-sm text-blue-700 mt-1">
                1. <strong>월간 사용량 리셋</strong>: 현재 월 사용량 → 전월 결제금액으로 이동, 월 사용량 0으로 초기화<br />
                2. <strong>자동 등급 변경</strong>: 전월 결제금액 기준으로 베이직 ↔ 플래티넘 등급 자동 조정
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 운영 설정
function OperationSettings({
  localSettings,
  setLocalSettings,
}: {
  localSettings: typeof defaultSettings;
  setLocalSettings: (s: typeof defaultSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">점검 모드</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.maintenanceMode}
              onChange={(e) => setLocalSettings({ ...localSettings, maintenanceMode: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
            />
            <div>
              <p className="font-medium text-gray-900">점검 모드 활성화</p>
              <p className="text-sm text-gray-500">활성화하면 사용자가 서비스를 이용할 수 없습니다.</p>
            </div>
          </label>

          {localSettings.maintenanceMode && (
            <div className="ml-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">점검 모드 활성화됨</span>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">점검 메시지</label>
              <textarea
                value={localSettings.maintenanceMessage}
                onChange={(e) => setLocalSettings({ ...localSettings, maintenanceMessage: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">자동 승인</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.autoApprovalEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, autoApprovalEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
            />
            <div>
              <p className="font-medium text-gray-900">자동 승인 활성화</p>
              <p className="text-sm text-gray-500">설정된 금액 이하의 거래는 자동으로 승인됩니다.</p>
            </div>
          </label>

          {localSettings.autoApprovalEnabled && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자동 승인 기준 금액
              </label>
              <div className="relative w-64">
                <input
                  type="number"
                  value={localSettings.autoApprovalThreshold}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, autoApprovalThreshold: parseInt(e.target.value) || 0 })
                  }
                  className="w-full h-10 px-4 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">원</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(localSettings.autoApprovalThreshold / 10000).toLocaleString()}만원 이하 거래 자동 승인
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 알림 설정
function NotificationSettings({
  localSettings,
  setLocalSettings,
}: {
  localSettings: typeof defaultSettings;
  setLocalSettings: (s: typeof defaultSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 채널</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.emailNotificationEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, emailNotificationEnabled: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
            />
            <div>
              <p className="font-medium text-gray-900">이메일 알림</p>
              <p className="text-sm text-gray-500">중요 이벤트 발생 시 이메일로 알림을 받습니다.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.smsNotificationEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, smsNotificationEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
            />
            <div>
              <p className="font-medium text-gray-900">SMS 알림</p>
              <p className="text-sm text-gray-500">긴급 알림 시 SMS로 알림을 받습니다.</p>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Slack 연동</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
          <input
            type="text"
            value={localSettings.slackWebhookUrl}
            onChange={(e) => setLocalSettings({ ...localSettings, slackWebhookUrl: e.target.value })}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            Slack 채널에 알림을 보내려면 Webhook URL을 입력하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

// 보안 설정
function SecuritySettings({
  localSettings,
  setLocalSettings,
}: {
  localSettings: typeof defaultSettings;
  setLocalSettings: (s: typeof defaultSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">세션 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">세션 타임아웃</label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.sessionTimeout}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, sessionTimeout: parseInt(e.target.value) || 0 })
                }
                className="w-full h-10 px-4 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">분</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(localSettings.sessionTimeout / 60)}시간 {localSettings.sessionTimeout % 60}분 후 자동 로그아웃
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              최대 로그인 시도 횟수
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.maxLoginAttempts}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, maxLoginAttempts: parseInt(e.target.value) || 0 })
                }
                className="w-full h-10 px-4 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">회</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">초과 시 계정이 잠깁니다.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 정책</h3>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 만료 기간</label>
          <div className="relative">
            <input
              type="number"
              value={localSettings.passwordExpiryDays}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, passwordExpiryDays: parseInt(e.target.value) || 0 })
              }
              className="w-full h-10 px-4 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">일</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {localSettings.passwordExpiryDays}일마다 비밀번호 변경이 필요합니다.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 요구사항</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              최소 8자 이상
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              대문자 포함
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              소문자 포함
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              숫자 포함
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              특수문자 포함 (!@#$%^&*)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
