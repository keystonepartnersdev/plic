// src/stores/useAdminUserStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser, TUserGrade, IGradeChangeResult } from '@/types';
import {
  processAutoGradeChange as processGradeChange,
  resetMonthlyUsage as resetUsage,
} from '@/lib/gradeUtils';

interface IAdminUserState {
  users: IUser[];

  // CRUD
  setUsers: (users: IUser[]) => void;
  addUser: (user: IUser) => void;
  updateUser: (uid: string, updates: Partial<IUser>) => void;
  deleteUser: (uid: string) => void;

  // 조회
  getUserById: (uid: string) => IUser | undefined;
  getUsersByGrade: (grade: TUserGrade) => IUser[];
  searchUsers: (query: string) => IUser[];

  // 자동 등급 변경 (베이직/플래티넘만 대상)
  processAutoGradeChange: (
    platinumThreshold: number,
    basicThreshold: number,
    gradeSettings: Record<TUserGrade, { feeRate: number; monthlyLimit: number }>
  ) => IGradeChangeResult[];

  // 월간 리셋 (매월 1일 실행)
  resetMonthlyUsage: () => void;
}

// 샘플 어드민 관리자 데이터
const sampleUsers: IUser[] = [];

export const useAdminUserStore = create(
  persist<IAdminUserState>(
    (set, get) => ({
      users: sampleUsers,

      setUsers: (users) => set({ users }),

      addUser: (user) =>
        set((state) => ({
          users: [user, ...state.users],
        })),

      updateUser: (uid, updates) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.uid === uid
              ? { ...user, ...updates, updatedAt: new Date().toISOString() }
              : user
          ),
        })),

      deleteUser: (uid) =>
        set((state) => ({
          users: state.users.filter((user) => user.uid !== uid),
        })),

      getUserById: (uid) => {
        return get().users.find((user) => user.uid === uid);
      },

      getUsersByGrade: (grade) => {
        return get().users.filter((user) => user.grade === grade);
      },

      searchUsers: (query) => {
        const searchLower = query.toLowerCase();
        return get().users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.phone.includes(query) ||
            user.uid.toLowerCase().includes(searchLower)
        );
      },

      // 자동 등급 변경 처리 (베이직/플래티넘만 대상)
      processAutoGradeChange: (platinumThreshold, basicThreshold, gradeSettings) => {
        const { results, updatedUsers } = processGradeChange(
          get().users,
          platinumThreshold,
          basicThreshold,
          gradeSettings
        );
        set({ users: updatedUsers });
        return results;
      },

      // 월간 사용량 리셋 (매월 1일 실행)
      resetMonthlyUsage: () => {
        set({ users: resetUsage(get().users) });
      },
    }),
    {
      name: 'plic-admin-user-storage',
      storage: createJSONStorage(() => localStorage),
      migrate: () => {
        // localStorage를 완전히 초기화 - 새 버전에서는 빈 상태로 시작
        return {
          users: [],
        } as unknown as IAdminUserState;
      },
    }
  )
);
