// src/stores/useSettingsStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TUserGrade } from '@/types';
import { getErrorMessage } from '@/lib/utils';

const API_BASE_URL = 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

// 등급별 설정
export interface IGradeSettings {
  feeRate: number;
  monthlyLimit: number;
}

// 자동 등급 기준 (베이직/플래티넘만 해당)
export interface IGradeCriteria {
  // 플래티넘 승급 기준 (전월 결제액 이상)
  platinumThreshold: number;
  // 베이직 강등 기준 (전월 결제액 미만)
  basicThreshold: number;
}

export interface ISystemSettings {
  // 등급별 수수료/한도 설정
  gradeSettings: Record<TUserGrade, IGradeSettings>;

  // 자동 등급 기준 (베이직 ↔ 플래티넘)
  gradeCriteria: IGradeCriteria;

  // 운영 설정
  maintenanceMode: boolean;
  maintenanceMessage: string;
  autoApprovalEnabled: boolean;
  autoApprovalThreshold: number;

  // 알림 설정
  emailNotificationEnabled: boolean;
  smsNotificationEnabled: boolean;
  slackWebhookUrl: string;

  // 보안 설정
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiryDays: number;
}

export const defaultSettings: ISystemSettings = {
  gradeSettings: {
    basic: { feeRate: 4.5, monthlyLimit: 20000000 },
    platinum: { feeRate: 3.5, monthlyLimit: 30000000 },
    b2b: { feeRate: 3.0, monthlyLimit: 100000000 },
    employee: { feeRate: 1.0, monthlyLimit: 100000000 },
  },
  gradeCriteria: {
    platinumThreshold: 10000000,  // 전월 1천만원 이상 → 플래티넘
    basicThreshold: 5000000,      // 전월 5백만원 미만 → 베이직
  },
  maintenanceMode: false,
  maintenanceMessage: '시스템 점검 중입니다. 잠시 후 다시 이용해주세요.',
  autoApprovalEnabled: false,
  autoApprovalThreshold: 100000,
  emailNotificationEnabled: true,
  smsNotificationEnabled: false,
  slackWebhookUrl: '',
  sessionTimeout: 480,
  maxLoginAttempts: 5,
  passwordExpiryDays: 90,
};

interface SettingsStore {
  settings: ISystemSettings;
  isLoading: boolean;
  error: string | null;

  updateSettings: (newSettings: Partial<ISystemSettings>) => void;
  updateGradeSettings: (grade: TUserGrade, gradeSettings: Partial<IGradeSettings>) => void;
  updateGradeCriteria: (criteria: Partial<IGradeCriteria>) => void;
  resetSettings: () => void;
  getGradeSettings: (grade: TUserGrade) => IGradeSettings;

  // API operations (admin only)
  fetchSettings: () => Promise<void>;
  saveSettings: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: { ...defaultSettings },
      isLoading: false,
      error: null,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...defaultSettings,
            ...state.settings,
            ...newSettings,
            gradeSettings: {
              ...defaultSettings.gradeSettings,
              ...(state.settings?.gradeSettings || {}),
              ...(newSettings.gradeSettings || {}),
            },
          },
        })),

      updateGradeSettings: (grade, gradeSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            gradeSettings: {
              ...state.settings.gradeSettings,
              [grade]: {
                ...state.settings.gradeSettings[grade],
                ...gradeSettings,
              },
            },
          },
        })),

      updateGradeCriteria: (criteria) =>
        set((state) => ({
          settings: {
            ...state.settings,
            gradeCriteria: {
              ...state.settings.gradeCriteria,
              ...criteria,
            },
          },
        })),

      resetSettings: () => set({ settings: defaultSettings }),

      getGradeSettings: (grade) => {
        const currentSettings = get().settings;
        // gradeSettings 객체가 없거나 해당 등급이 없으면 기본값 반환
        if (!currentSettings?.gradeSettings?.[grade]) {
          return defaultSettings.gradeSettings[grade] || { feeRate: 0, monthlyLimit: 0 };
        }
        return currentSettings.gradeSettings[grade];
      },

      // Fetch settings from API (admin)
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/admin/settings`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (data.success) {
            set({
              settings: {
                ...defaultSettings,
                ...data.data.settings,
                gradeSettings: {
                  ...defaultSettings.gradeSettings,
                  ...(data.data.settings?.gradeSettings || {}),
                },
              },
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error: unknown) {
          set({ error: getErrorMessage(error), isLoading: false });
        }
      },

      // Save settings to API (admin)
      saveSettings: async () => {
        const { settings } = get();
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/admin/settings`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ settings }),
          });
          const data = await response.json();
          if (data.success) {
            set({ isLoading: false });
            return true;
          } else {
            set({ error: data.error, isLoading: false });
            return false;
          }
        } catch (error: unknown) {
          set({ error: getErrorMessage(error), isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'plic-settings',
      storage: createJSONStorage(() => localStorage),
      // 데이터 마이그레이션: gradeSettings가 없거나 불완전한 경우 기본값으로 채움
      migrate: (persistedState) => {
        if (persistedState && typeof persistedState === 'object') {
          const state = persistedState as { settings?: ISystemSettings };
          if (state.settings) {
            // gradeSettings가 없거나 불완전하면 기본값으로 채움
            if (!state.settings.gradeSettings || typeof state.settings.gradeSettings !== 'object') {
              state.settings.gradeSettings = { ...defaultSettings.gradeSettings };
            } else {
              // 각 등급이 없으면 기본값 추가
              const grades: TUserGrade[] = ['basic', 'platinum', 'b2b', 'employee'];
              grades.forEach((grade) => {
                if (!state.settings!.gradeSettings[grade]) {
                  state.settings!.gradeSettings[grade] = { ...defaultSettings.gradeSettings[grade] };
                }
              });
            }
          }
        }
        return persistedState as SettingsStore;
      },
    }
  )
);
