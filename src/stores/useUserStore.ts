// src/stores/useUserStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser, TUserGrade, IGradeChangeResult } from '@/types';
import { IRegisteredCard } from '@/types/payment';
import {
  processAutoGradeChange as processGradeChange,
  resetMonthlyUsage as resetUsage,
} from '@/lib/gradeUtils';

const sampleUsers: IUser[] = [];

interface IUserState {
  currentUser: IUser | null;
  isLoggedIn: boolean;
  registeredCards: IRegisteredCard[];
  users: IUser[];

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
}

export const useUserStore = create(
  persist<IUserState>(
    (set, get) => ({
      currentUser: null,
      isLoggedIn: false,
      registeredCards: [],
      users: sampleUsers,

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

      logout: () => set({
        currentUser: null,
        isLoggedIn: false,
        registeredCards: []
      }),

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
