// src/stores/useUserStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser, TUserGrade, IGradeChangeResult } from '@/types';
import { IRegisteredCard } from '@/types/payment';
import { usersAPI, authAPI, tokenManager } from '@/lib/api';
import {
  processAutoGradeChange as processGradeChange,
  resetMonthlyUsage as resetUsage,
} from '@/lib/gradeUtils';
import { getErrorMessage } from '@/lib/utils';
import { secureAuth } from '@/lib/auth';

const sampleUsers: IUser[] = [];

interface IUserState {
  currentUser: IUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  apiError: string | null;
  registeredCards: IRegisteredCard[];
  users: IUser[];

  // API 연동 메서드
  login: (email: string, password: string) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateCurrentUser: (updates: Partial<IUser>) => Promise<void>;
  logoutWithAPI: () => Promise<void>;

  // 로컬 메서드 (기존 호환용)
  setUser: (user: IUser | null) => void;
  updateUser: (updates: Partial<IUser>) => void;
  logout: () => void;

  addCard: (card: IRegisteredCard) => void;
  updateCard: (cardId: string, updates: Partial<IRegisteredCard>) => void;
  removeCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;

  addUserToList: (user: IUser) => void;
  updateUserInList: (uid: string, updates: Partial<IUser>) => void;
  deleteUserFromList: (uid: string) => void;
  getUserById: (uid: string) => IUser | undefined;
  getUsersByGrade: (grade: TUserGrade) => IUser[];
  searchUsers: (query: string) => IUser[];

  processAutoGradeChange: (
    platinumThreshold: number,
    basicThreshold: number,
    gradeSettings: Record<TUserGrade, { feeRate: number; monthlyLimit: number }>
  ) => IGradeChangeResult[];

  resetMonthlyUsage: () => void;
  clearApiError: () => void;
}

export const useUserStore = create(
  persist<IUserState>(
    (set, get) => ({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      apiError: null,
      registeredCards: [],
      users: sampleUsers,

      // ============================================
      // API 연동 메서드
      // ============================================

      login: async (email, password) => {
        set({ isLoading: true, apiError: null });
        try {
          // httpOnly 쿠키 기반 보안 로그인 사용
          const result = await secureAuth.login(email, password);

          // API에서 받은 사용자 정보로 상태 업데이트
          const user: IUser = {
            uid: result.user.uid,
            name: result.user.name,
            phone: result.user.phone,
            email: result.user.email,
            userType: result.user.userType || 'personal',
            businessInfo: result.user.businessInfo,
            authType: result.user.authType || 'direct',
            socialProvider: result.user.socialProvider || null,
            isVerified: result.user.isVerified ?? true,
            verifiedAt: result.user.verifiedAt,
            status: result.user.status || 'active',
            grade: result.user.grade || 'basic',
            feeRate: result.user.feeRate ?? 2.5,
            isGradeManual: result.user.isGradeManual ?? false,
            monthlyLimit: result.user.monthlyLimit ?? 5000000,
            usedAmount: result.user.usedAmount ?? 0,
            agreements: result.user.agreements || { service: true, privacy: true, thirdParty: true, marketing: false },
            totalPaymentAmount: result.user.totalPaymentAmount ?? 0,
            totalDealCount: result.user.totalDealCount ?? 0,
            lastMonthPaymentAmount: result.user.lastMonthPaymentAmount ?? 0,
            history: result.user.history || [],
            createdAt: result.user.createdAt || new Date().toISOString(),
            updatedAt: result.user.updatedAt || new Date().toISOString(),
          };

          // users 배열에도 추가/업데이트
          const existingIndex = get().users.findIndex(u => u.uid === user.uid);
          let updatedUsers = get().users;
          if (existingIndex >= 0) {
            updatedUsers = [...get().users];
            updatedUsers[existingIndex] = user;
          } else {
            updatedUsers = [...get().users, user];
          }

          set({
            currentUser: user,
            isLoggedIn: true,
            isLoading: false,
            users: updatedUsers,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            apiError: getErrorMessage(error) || '로그인에 실패했습니다.',
          });
          throw error;
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true, apiError: null });
        try {
          // httpOnly 쿠키로 인증 상태 확인
          const meResult = await secureAuth.getMe();
          if (!meResult.success) {
            set({ isLoading: false });
            return;
          }
          const userData = meResult.user;

          const user: IUser = {
            uid: userData.uid,
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            userType: userData.userType || 'personal',
            businessInfo: userData.businessInfo,
            authType: userData.authType || 'direct',
            socialProvider: userData.socialProvider || null,
            isVerified: userData.isVerified ?? true,
            verifiedAt: userData.verifiedAt,
            status: userData.status || 'active',
            grade: userData.grade || 'basic',
            feeRate: userData.feeRate ?? 2.5,
            isGradeManual: userData.isGradeManual ?? false,
            monthlyLimit: userData.monthlyLimit ?? 5000000,
            usedAmount: userData.usedAmount ?? 0,
            agreements: userData.agreements || { service: true, privacy: true, thirdParty: true, marketing: false },
            totalPaymentAmount: userData.totalPaymentAmount ?? 0,
            totalDealCount: userData.totalDealCount ?? 0,
            lastMonthPaymentAmount: userData.lastMonthPaymentAmount ?? 0,
            history: userData.history || [],
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: userData.updatedAt || new Date().toISOString(),
          };

          // users 배열에도 추가/업데이트
          const existingIndex = get().users.findIndex(u => u.uid === user.uid);
          let updatedUsers = get().users;
          if (existingIndex >= 0) {
            updatedUsers = [...get().users];
            updatedUsers[existingIndex] = user;
          } else {
            updatedUsers = [...get().users, user];
          }

          set({
            currentUser: user,
            isLoggedIn: true,
            isLoading: false,
            users: updatedUsers,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            apiError: getErrorMessage(error) || '사용자 정보를 불러오는데 실패했습니다.',
          });
        }
      },

      updateCurrentUser: async (updates) => {
        set({ isLoading: true, apiError: null });
        try {
          // API 호출
          const result = await usersAPI.updateMe({
            name: updates.name,
            phone: updates.phone,
            agreements: updates.agreements ? { marketing: updates.agreements.marketing } : undefined,
          });

          // 로컬 상태 업데이트
          const currentUser = get().currentUser;
          const updatedUser: IUser | null = currentUser
            ? { ...currentUser, ...updates, updatedAt: new Date().toISOString() } as IUser
            : null;

          let updatedUsers = get().users;
          if (updatedUser) {
            const existingIndex = get().users.findIndex(u => u.uid === updatedUser.uid);
            if (existingIndex >= 0) {
              updatedUsers = [...get().users];
              updatedUsers[existingIndex] = updatedUser;
            }
          }

          set({
            currentUser: updatedUser,
            users: updatedUsers,
            isLoading: false,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            apiError: getErrorMessage(error) || '사용자 정보 업데이트에 실패했습니다.',
          });
          throw error;
        }
      },

      logoutWithAPI: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('로그아웃 API 오류:', error);
        } finally {
          tokenManager.clearTokens();
          set({
            currentUser: null,
            isLoggedIn: false,
            registeredCards: [],
          });
        }
      },

      clearApiError: () => set({ apiError: null }),

      // ============================================
      // 로컬 메서드 (기존 호환용)
      // ============================================

      setUser: (user) => {
        set((state) => {
          if (user) {
            const existingIndex = state.users.findIndex(u => u.uid === user.uid);
            let updatedUsers = state.users;
            if (existingIndex >= 0) {
              updatedUsers = [...state.users];
              updatedUsers[existingIndex] = user;
            } else {
              updatedUsers = [...state.users, user];
            }
            return { currentUser: user, isLoggedIn: true, users: updatedUsers };
          }
          return { currentUser: null, isLoggedIn: false };
        });
      },

      updateUser: (updates) => set((state) => {
        const updatedUser = state.currentUser
          ? { ...state.currentUser, ...updates, updatedAt: new Date().toISOString() }
          : null;

        let updatedUsers = state.users;
        if (updatedUser) {
          const existingIndex = state.users.findIndex(u => u.uid === updatedUser.uid);
          if (existingIndex >= 0) {
            updatedUsers = [...state.users];
            updatedUsers[existingIndex] = updatedUser;
          }
        }

        return { currentUser: updatedUser, users: updatedUsers };
      }),

      logout: () => {
        tokenManager.clearTokens();
        set({
          currentUser: null,
          isLoggedIn: false,
          registeredCards: []
        });
      },

      addCard: (card) => set((state) => ({
        registeredCards: [...state.registeredCards, card]
      })),

      updateCard: (cardId, updates) => set((state) => ({
        registeredCards: state.registeredCards.map((card) =>
          card.cardId === cardId ? { ...card, ...updates } : card
        )
      })),

      removeCard: (cardId) => set((state) => ({
        registeredCards: state.registeredCards.filter((card) => card.cardId !== cardId)
      })),

      setDefaultCard: (cardId) => set((state) => ({
        registeredCards: state.registeredCards.map((card) => ({
          ...card,
          isDefault: card.cardId === cardId
        }))
      })),

      addUserToList: (user) => set((state) => {
        const existingIndex = state.users.findIndex(u => u.uid === user.uid);
        if (existingIndex >= 0) {
          const updatedUsers = [...state.users];
          updatedUsers[existingIndex] = user;
          return { users: updatedUsers };
        }
        return { users: [...state.users, user] };
      }),

      updateUserInList: (uid, updates) => set((state) => {
        const updatedUsers = state.users.map(user =>
          user.uid === uid
            ? { ...user, ...updates, updatedAt: new Date().toISOString() }
            : user
        );

        let updatedCurrentUser = state.currentUser;
        let isLoggedIn = state.isLoggedIn;

        if (state.currentUser?.uid === uid) {
          const updatedUser = updatedUsers.find(u => u.uid === uid);
          if (updatedUser && updatedUser.status === 'withdrawn') {
            updatedCurrentUser = null;
            isLoggedIn = false;
          } else {
            updatedCurrentUser = updatedUser || state.currentUser;
          }
        }

        return { users: updatedUsers, currentUser: updatedCurrentUser, isLoggedIn };
      }),

      getUserById: (uid) => get().users.find(u => u.uid === uid),

      deleteUserFromList: (uid) => set((state) => ({
        users: state.users.filter(user => user.uid !== uid)
      })),

      getUsersByGrade: (grade) => get().users.filter(user => user.grade === grade),

      searchUsers: (query) => {
        const searchLower = query.toLowerCase();
        return get().users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.phone.includes(query) ||
            user.uid.toLowerCase().includes(searchLower)
        );
      },

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

      resetMonthlyUsage: () => {
        set({ users: resetUsage(get().users) });
      },
    }),
    {
      name: 'plic-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
