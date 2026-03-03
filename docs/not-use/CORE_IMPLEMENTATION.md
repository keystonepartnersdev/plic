# PLIC 프로젝트 핵심 구현 코드

> 생성일: 2024-12-22
> 이 문서는 PLIC 프로젝트의 핵심 구현 코드를 문서화합니다.

---

## 목차

1. [스토어 전체 코드](#1-스토어-전체-코드)
2. [클래스 전체 코드](#2-클래스-전체-코드)
3. [타입 전체 코드](#3-타입-전체-코드)
4. [유틸리티 전체 코드](#4-유틸리티-전체-코드)
5. [공통 컴포넌트 코드](#5-공통-컴포넌트-코드)
6. [핵심 페이지 코드](#6-핵심-페이지-코드)

---

## 1. 스토어 전체 코드

### 1.1 src/stores/index.ts

```typescript
// src/stores/index.ts

export { useUserStore } from './useUserStore';
export { useDealStore } from './useDealStore';
export { useDealDraftStore } from './useDealDraftStore';
export { usePaymentStore } from './usePaymentStore';
export { useAdminStore } from './useAdminStore';
export { useContentStore } from './useContentStore';
export { useDiscountStore } from './useDiscountStore';
export { useAdminUserStore } from './useAdminUserStore';
export { useSettingsStore, defaultSettings } from './useSettingsStore';
export type { ISystemSettings, IGradeSettings, IGradeCriteria } from './useSettingsStore';
```

### 1.2 src/stores/useUserStore.ts

```typescript
// src/stores/useUserStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser, TUserGrade, IGradeChangeResult } from '@/types';
import { IRegisteredCard } from '@/types/payment';
import {
  processAutoGradeChange as processGradeChange,
  resetMonthlyUsage as resetUsage,
} from '@/lib/gradeUtils';

// 샘플 사용자 데이터 (어드민 회원관리용)
const sampleUsers: IUser[] = [];

interface IUserState {
  // 현재 로그인한 사용자
  currentUser: IUser | null;
  isLoggedIn: boolean;
  registeredCards: IRegisteredCard[];

  // 모든 가입된 사용자 목록 (어드민 회원관리용)
  users: IUser[];

  // 현재 사용자 관련
  setUser: (user: IUser | null) => void;
  updateUser: (updates: Partial<IUser>) => void;
  logout: () => void;

  // 카드 관련
  addCard: (card: IRegisteredCard) => void;
  updateCard: (cardId: string, updates: Partial<IRegisteredCard>) => void;
  removeCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;

  // 사용자 목록 관리 (어드민용)
  addUserToList: (user: IUser) => void;
  updateUserInList: (uid: string, updates: Partial<IUser>) => void;
  deleteUserFromList: (uid: string) => void;
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

export const useUserStore = create(
  persist<IUserState>(
    (set, get) => ({
      currentUser: null,
      isLoggedIn: false,
      registeredCards: [],
      users: sampleUsers,

      setUser: (user) => {
        // 사용자가 로그인하면 users 목록에도 추가/업데이트
        set((state) => {
          if (user) {
            const existingIndex = state.users.findIndex(u => u.uid === user.uid);
            let updatedUsers = state.users;
            if (existingIndex >= 0) {
              // 기존 사용자 업데이트
              updatedUsers = [...state.users];
              updatedUsers[existingIndex] = user;
            } else {
              // 새 사용자 추가
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

        // users 목록에서도 업데이트
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

      // 어드민용: 사용자 목록에 추가
      addUserToList: (user) => set((state) => {
        const existingIndex = state.users.findIndex(u => u.uid === user.uid);
        if (existingIndex >= 0) {
          const updatedUsers = [...state.users];
          updatedUsers[existingIndex] = user;
          return { users: updatedUsers };
        }
        return { users: [...state.users, user] };
      }),

      // 어드민용: 사용자 정보 업데이트
      updateUserInList: (uid, updates) => set((state) => {
        const updatedUsers = state.users.map(user =>
          user.uid === uid
            ? { ...user, ...updates, updatedAt: new Date().toISOString() }
            : user
        );

        // 현재 로그인한 사용자와 동일한 uid면 currentUser도 업데이트
        let updatedCurrentUser = state.currentUser;
        let isLoggedIn = state.isLoggedIn;

        if (state.currentUser?.uid === uid) {
          const updatedUser = updatedUsers.find(u => u.uid === uid);

          // 탈퇴 상태로 변경되면 강제 로그아웃
          if (updatedUser && updatedUser.status === 'withdrawn') {
            updatedCurrentUser = null;
            isLoggedIn = false;
          } else {
            updatedCurrentUser = updatedUser || state.currentUser;
          }
        }

        return {
          users: updatedUsers,
          currentUser: updatedCurrentUser,
          isLoggedIn
        };
      }),

      // 어드민용: uid로 사용자 조회
      getUserById: (uid) => get().users.find(u => u.uid === uid),

      // 어드민용: 사용자 삭제
      deleteUserFromList: (uid) => set((state) => ({
        users: state.users.filter(user => user.uid !== uid)
      })),

      // 어드민용: 등급별 사용자 조회
      getUsersByGrade: (grade) => get().users.filter(user => user.grade === grade),

      // 어드민용: 사용자 검색
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
      name: 'plic-user-storage',
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        // localStorage를 완전히 초기화
        return {
          currentUser: null,
          isLoggedIn: false,
          registeredCards: [],
          users: [],
        } as unknown as IUserState;
      },
    }
  )
);
```

### 1.3 src/stores/useDealStore.ts

```typescript
// src/stores/useDealStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDeal, TDealStatus } from '@/types';

interface IDealState {
  deals: IDeal[];

  setDeals: (deals: IDeal[]) => void;
  addDeal: (deal: IDeal) => void;
  updateDeal: (did: string, updates: Partial<IDeal>) => void;
  deleteDeal: (did: string) => void;
  getDealsByStatus: (statuses: TDealStatus[]) => IDeal[];
  getDealsByUid: (uid: string) => IDeal[];
  getDealById: (did: string) => IDeal | undefined;
}

export const useDealStore = create(
  persist<IDealState>(
    (set, get) => ({
      deals: [],

      setDeals: (deals) => set({ deals }),

      addDeal: (deal) => set((state) => ({
        deals: [deal, ...state.deals]
      })),

      updateDeal: (did, updates) => set((state) => ({
        deals: state.deals.map((deal) =>
          deal.did === did
            ? { ...deal, ...updates, updatedAt: new Date().toISOString() }
            : deal
        )
      })),

      deleteDeal: (did) => set((state) => ({
        deals: state.deals.filter((deal) => deal.did !== did)
      })),

      getDealsByStatus: (statuses) => {
        return get().deals.filter((deal) => statuses.includes(deal.status));
      },

      getDealsByUid: (uid) => {
        return get().deals.filter((deal) => deal.uid === uid);
      },

      getDealById: (did) => {
        return get().deals.find((deal) => deal.did === did);
      },
    }),
    {
      name: 'plic-deal-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 1.4 src/stores/useDealDraftStore.ts

```typescript
// src/stores/useDealDraftStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDealDraft, TDealStep, TDealType, IDraftDocument } from '@/types';

interface IDealDraftState {
  // 현재 작성중인 송금
  currentDraft: IDealDraft | null;

  // 모든 작성중 송금 목록
  drafts: IDealDraft[];

  // Actions
  startNewDraft: (uid: string) => string;
  updateDraft: (data: Partial<IDealDraft>) => void;
  setCurrentStep: (step: TDealStep) => void;
  loadDraft: (id: string) => boolean;
  deleteDraft: (id: string) => void;
  submitDraft: () => IDealDraft | null;
  clearCurrentDraft: () => void;
  getDraftsByUid: (uid: string) => IDealDraft[];
}

export const useDealDraftStore = create(
  persist<IDealDraftState>(
    (set, get) => ({
      currentDraft: null,
      drafts: [],

      startNewDraft: (uid: string) => {
        const newDraft: IDealDraft = {
          id: crypto.randomUUID(),
          uid,
          status: 'draft',
          currentStep: 'type',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        };

        set((state) => ({
          currentDraft: newDraft,
          drafts: [...state.drafts, newDraft],
        }));

        return newDraft.id;
      },

      updateDraft: (data) => {
        set((state) => {
          if (!state.currentDraft) return state;

          const updated: IDealDraft = {
            ...state.currentDraft,
            ...data,
            lastUpdatedAt: new Date().toISOString(),
          };

          return {
            currentDraft: updated,
            drafts: state.drafts.map((d) =>
              d.id === updated.id ? updated : d
            ),
          };
        });
      },

      setCurrentStep: (step) => {
        get().updateDraft({ currentStep: step });
      },

      loadDraft: (id) => {
        const draft = get().drafts.find((d) => d.id === id);
        if (draft && draft.status === 'draft') {
          set({ currentDraft: draft });
          return true;
        }
        return false;
      },

      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
        }));
      },

      submitDraft: () => {
        const { currentDraft } = get();
        if (!currentDraft) return null;

        // 제출 완료 후 drafts에서 제거
        set((state) => ({
          currentDraft: null,
          drafts: state.drafts.filter((d) => d.id !== currentDraft.id),
        }));

        return currentDraft;
      },

      clearCurrentDraft: () => {
        set({ currentDraft: null });
      },

      getDraftsByUid: (uid) => {
        return get().drafts.filter((d) => d.uid === uid && d.status === 'draft');
      },
    }),
    {
      name: 'plic-deal-draft-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 1.5 src/stores/usePaymentStore.ts

```typescript
// src/stores/usePaymentStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IPayment, TPaymentStatus } from '@/types';

interface IPaymentState {
  payments: IPayment[];

  setPayments: (payments: IPayment[]) => void;
  addPayment: (payment: IPayment) => void;
  updatePayment: (paymentId: string, updates: Partial<IPayment>) => void;
  getPaymentById: (paymentId: string) => IPayment | undefined;
  getPaymentByDid: (did: string) => IPayment | undefined;
  getPaymentsByUid: (uid: string) => IPayment[];
  getPaymentsByStatus: (status: TPaymentStatus) => IPayment[];
}

export const usePaymentStore = create(
  persist<IPaymentState>(
    (set, get) => ({
      payments: [],

      setPayments: (payments) => set({ payments }),

      addPayment: (payment) => set((state) => ({
        payments: [payment, ...state.payments]
      })),

      updatePayment: (paymentId, updates) => set((state) => ({
        payments: state.payments.map((payment) =>
          payment.paymentId === paymentId
            ? { ...payment, ...updates }
            : payment
        )
      })),

      getPaymentById: (paymentId) => {
        return get().payments.find((payment) => payment.paymentId === paymentId);
      },

      getPaymentByDid: (did) => {
        return get().payments.find((payment) => payment.did === did);
      },

      getPaymentsByUid: (uid) => {
        return get().payments.filter((payment) => payment.uid === uid);
      },

      getPaymentsByStatus: (status) => {
        return get().payments.filter((payment) => payment.status === status);
      },
    }),
    {
      name: 'plic-payment-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 1.6 src/stores/useAdminStore.ts

```typescript
// src/stores/useAdminStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IAdmin, IAdminSession } from '@/types';
import { AdminHelper } from '@/classes';


interface IAdminState {
  currentAdmin: IAdminSession | null;
  isLoggedIn: boolean;
  adminList: IAdmin[];

  login: (session: IAdminSession) => void;
  logout: () => void;
  setAdminList: (admins: IAdmin[]) => void;
  addAdmin: (admin: IAdmin) => void;
  updateAdmin: (adminId: string, updates: Partial<IAdmin>) => void;
  deleteAdmin: (adminId: string) => void;
  getAdminById: (adminId: string) => IAdmin | undefined;
  getAdminByEmail: (email: string) => IAdmin | undefined;

  hasPermission: (permission: string) => boolean;
}

export const useAdminStore = create(
  persist<IAdminState>(
    (set, get) => ({
      currentAdmin: null,
      isLoggedIn: false,
      adminList: [AdminHelper.MASTER_ADMIN],  // 마스터 계정 기본 포함

      login: (session) => set({ currentAdmin: session, isLoggedIn: true }),
      logout: () => set({ currentAdmin: null, isLoggedIn: false }),

      setAdminList: (admins) => set({ adminList: admins }),

      addAdmin: (admin) => set((state) => ({
        adminList: [...state.adminList, admin]
      })),

      updateAdmin: (adminId, updates) => set((state) => ({
        adminList: state.adminList.map((admin) =>
          admin.adminId === adminId
            ? { ...admin, ...updates, updatedAt: new Date().toISOString() }
            : admin
        )
      })),

      deleteAdmin: (adminId) => set((state) => ({
        adminList: state.adminList.filter((admin) =>
          admin.adminId !== adminId && !admin.isMaster  // 마스터는 삭제 불가
        )
      })),

      getAdminById: (adminId) => {
        return get().adminList.find((admin) => admin.adminId === adminId);
      },

      getAdminByEmail: (email) => {
        return get().adminList.find((admin) => admin.email === email);
      },

      hasPermission: (permission) => {
        const { currentAdmin } = get();
        if (!currentAdmin) return false;
        return currentAdmin.permissions.includes(permission);
      },
    }),
    {
      name: 'plic-admin-storage',
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        // localStorage를 완전히 초기화
        return {
          currentAdmin: null,
          isLoggedIn: false,
          adminList: [AdminHelper.MASTER_ADMIN],
          login: (session: IAdminSession) => {},
          logout: () => {},
          setAdminList: (admins: IAdmin[]) => {},
          addAdmin: (admin: IAdmin) => {},
          updateAdmin: (adminId: string, updates: Partial<IAdmin>) => {},
          deleteAdmin: (adminId: string) => {},
          getAdminById: (adminId: string) => undefined,
          getAdminByEmail: (email: string) => undefined,
          hasPermission: (permission: string) => false,
        } as unknown as IAdminState;
      },
    }
  )
);
```

### 1.7 src/stores/useAdminUserStore.ts

```typescript
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
      migrate: (persistedState: any, version: number) => {
        // localStorage를 완전히 초기화
        return {
          users: [],
          setUsers: persistedState?.setUsers || (() => {}),
          addUser: persistedState?.addUser || (() => {}),
          updateUser: persistedState?.updateUser || (() => {}),
          deleteUser: persistedState?.deleteUser || (() => {}),
          getUserById: persistedState?.getUserById || (() => undefined),
          getUsersByGrade: persistedState?.getUsersByGrade || (() => []),
          searchUsers: persistedState?.searchUsers || (() => []),
          processAutoGradeChange: persistedState?.processAutoGradeChange || (() => []),
          resetMonthlyUsage: persistedState?.resetMonthlyUsage || (() => {}),
        } as unknown as IAdminUserState;
      },
    }
  )
);
```

### 1.8 src/stores/useContentStore.ts

```typescript
// src/stores/useContentStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IHomeBanner, INotice, IFAQ } from '@/types';

interface IContentState {
  banners: IHomeBanner[];
  notices: INotice[];
  faqs: IFAQ[];

  // Banner actions
  setBanners: (banners: IHomeBanner[]) => void;
  addBanner: (banner: IHomeBanner) => void;
  updateBanner: (bannerId: string, updates: Partial<IHomeBanner>) => void;
  deleteBanner: (bannerId: string) => void;

  // Notice actions
  setNotices: (notices: INotice[]) => void;
  addNotice: (notice: INotice) => void;
  updateNotice: (noticeId: string, updates: Partial<INotice>) => void;
  deleteNotice: (noticeId: string) => void;
  incrementNoticeViewCount: (noticeId: string) => void;

  // FAQ actions
  setFAQs: (faqs: IFAQ[]) => void;
  addFAQ: (faq: IFAQ) => void;
  updateFAQ: (faqId: string, updates: Partial<IFAQ>) => void;
  deleteFAQ: (faqId: string) => void;

  // Getters
  getVisibleBanners: () => IHomeBanner[];
  getVisibleNotices: () => INotice[];
  getVisibleFAQs: () => IFAQ[];
  getFAQsByCategory: (category: string) => IFAQ[];
  getHomeFeaturedFAQs: () => IFAQ[]; // 홈 화면에 노출되는 FAQ
}

export const useContentStore = create(
  persist<IContentState>(
    (set, get) => ({
      banners: [],
      notices: [],
      faqs: [],

      // Banner
      setBanners: (banners) => set({ banners }),
      addBanner: (banner) => set((state) => ({ banners: [...state.banners, banner] })),
      updateBanner: (bannerId, updates) => set((state) => ({
        banners: state.banners.map((b) =>
          b.bannerId === bannerId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        )
      })),
      deleteBanner: (bannerId) => set((state) => ({
        banners: state.banners.filter((b) => b.bannerId !== bannerId)
      })),

      // Notice
      setNotices: (notices) => set({ notices }),
      addNotice: (notice) => set((state) => ({ notices: [...state.notices, notice] })),
      updateNotice: (noticeId, updates) => set((state) => ({
        notices: state.notices.map((n) =>
          n.noticeId === noticeId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        )
      })),
      deleteNotice: (noticeId) => set((state) => ({
        notices: state.notices.filter((n) => n.noticeId !== noticeId)
      })),
      incrementNoticeViewCount: (noticeId) => set((state) => ({
        notices: state.notices.map((n) =>
          n.noticeId === noticeId ? { ...n, viewCount: n.viewCount + 1 } : n
        )
      })),

      // FAQ
      setFAQs: (faqs) => set({ faqs }),
      addFAQ: (faq) => set((state) => ({ faqs: [...state.faqs, faq] })),
      updateFAQ: (faqId, updates) => set((state) => ({
        faqs: state.faqs.map((f) =>
          f.faqId === faqId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
        )
      })),
      deleteFAQ: (faqId) => set((state) => ({
        faqs: state.faqs.filter((f) => f.faqId !== faqId)
      })),

      // Getters
      getVisibleBanners: () => {
        const now = new Date();
        return get().banners
          .filter((b) => {
            if (!b.isVisible) return false;
            if (b.startDate && new Date(b.startDate) > now) return false;
            if (b.endDate && new Date(b.endDate) < now) return false;
            return true;
          })
          .sort((a, b) => a.priority - b.priority);
      },

      getVisibleNotices: () => {
        return get().notices
          .filter((n) => n.isVisible)
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return a.priority - b.priority;
          });
      },

      getVisibleFAQs: () => {
        return get().faqs
          .filter((f) => f.isVisible)
          .sort((a, b) => a.priority - b.priority);
      },

      getFAQsByCategory: (category) => {
        return get().faqs
          .filter((f) => f.isVisible && f.category === category)
          .sort((a, b) => a.priority - b.priority);
      },

      getHomeFeaturedFAQs: () => {
        return get().faqs
          .filter((f) => f.isVisible && f.isHomeFeatured)
          .sort((a, b) => a.priority - b.priority);
      },
    }),
    {
      name: 'plic-content-storage',
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        // localStorage를 완전히 초기화
        return {
          banners: [],
          notices: [],
          faqs: [],
          setBanners: () => {},
          addBanner: () => {},
          updateBanner: () => {},
          deleteBanner: () => {},
          setNotices: () => {},
          addNotice: () => {},
          updateNotice: () => {},
          deleteNotice: () => {},
          incrementNoticeViewCount: () => {},
          setFAQs: () => {},
          addFAQ: () => {},
          updateFAQ: () => {},
          deleteFAQ: () => {},
          getVisibleBanners: () => [],
          getVisibleNotices: () => [],
          getVisibleFAQs: () => [],
          getFAQsByCategory: () => [],
          getHomeFeaturedFAQs: () => [],
        } as unknown as IContentState;
      },
    }
  )
);
```

### 1.9 src/stores/useDiscountStore.ts

```typescript
// src/stores/useDiscountStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDiscount, IDiscountCreateInput, TDiscountType, TUserGrade } from '@/types';

interface IDiscountState {
  discounts: IDiscount[];

  // CRUD
  setDiscounts: (discounts: IDiscount[]) => void;
  addDiscount: (input: IDiscountCreateInput) => IDiscount;
  updateDiscount: (id: string, updates: Partial<IDiscount>) => void;
  deleteDiscount: (id: string) => void;

  // 조회
  getDiscountById: (id: string) => IDiscount | undefined;
  getDiscountByCode: (code: string) => IDiscount | undefined;
  getDiscountsByType: (type: TDiscountType) => IDiscount[];
  getActiveDiscounts: () => IDiscount[];
  getActiveCodes: () => IDiscount[];
  getActiveCoupons: () => IDiscount[];

  // 사용자별 조회 (등급 및 개별 지급 기반)
  getAvailableCodesForUser: (userGrade: TUserGrade) => IDiscount[];
  getAvailableCouponsForUser: (userId: string, userGrade: TUserGrade) => IDiscount[];

  // 쿠폰 사용자 지급 관리
  addUserToCoupon: (discountId: string, userId: string) => void;
  removeUserFromCoupon: (discountId: string, userId: string) => void;

  // 사용 기록
  markAsUsed: (id: string) => void;
  incrementUsageCount: (id: string) => void;

  // 활성화/비활성화
  toggleActive: (id: string) => void;
}

// ID 생성 함수
const generateDiscountId = (type: TDiscountType): string => {
  const prefix = type === 'code' ? 'DC' : 'CP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// 샘플 데이터
const sampleDiscounts: IDiscount[] = [];

export const useDiscountStore = create(
  persist<IDiscountState>(
    (set, get) => ({
      discounts: sampleDiscounts,

      setDiscounts: (discounts) => set({ discounts }),

      addDiscount: (input) => {
        const now = new Date().toISOString();
        const newDiscount: IDiscount = {
          id: generateDiscountId(input.type),
          ...input,
          isUsed: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
        };

        set((state) => ({
          discounts: [newDiscount, ...state.discounts],
        }));

        return newDiscount;
      },

      updateDiscount: (id, updates) =>
        set((state) => ({
          discounts: state.discounts.map((discount) =>
            discount.id === id
              ? { ...discount, ...updates, updatedAt: new Date().toISOString() }
              : discount
          ),
        })),

      deleteDiscount: (id) =>
        set((state) => ({
          discounts: state.discounts.filter((discount) => discount.id !== id),
        })),

      getDiscountById: (id) => {
        return get().discounts.find((d) => d.id === id);
      },

      getDiscountByCode: (code) => {
        return get().discounts.find(
          (d) => d.type === 'code' && d.code?.toUpperCase() === code.toUpperCase()
        );
      },

      getDiscountsByType: (type) => {
        return get().discounts.filter((d) => d.type === type);
      },

      getActiveDiscounts: () => {
        const now = new Date();
        return get().discounts.filter(
          (d) => d.isActive && new Date(d.expiry) >= now
        );
      },

      getActiveCodes: () => {
        const now = new Date();
        return get().discounts.filter(
          (d) => d.type === 'code' && d.isActive && new Date(d.expiry) >= now
        );
      },

      getActiveCoupons: () => {
        const now = new Date();
        return get().discounts.filter(
          (d) => d.type === 'coupon' && d.isActive && new Date(d.expiry) >= now
        );
      },

      // 사용자 등급 기반 사용 가능한 할인코드 조회
      getAvailableCodesForUser: (userGrade: TUserGrade) => {
        const now = new Date();
        return get().discounts.filter((d) => {
          if (d.type !== 'code' || !d.isActive || new Date(d.expiry) < now) {
            return false;
          }
          // allowedGrades가 없거나 비어있으면 모든 등급 사용 가능
          if (!d.allowedGrades || d.allowedGrades.length === 0) {
            return true;
          }
          return d.allowedGrades.includes(userGrade);
        });
      },

      // 사용자 ID 및 등급 기반 사용 가능한 쿠폰 조회
      getAvailableCouponsForUser: (userId: string, userGrade: TUserGrade) => {
        const now = new Date();
        return get().discounts.filter((d) => {
          if (d.type !== 'coupon' || !d.isActive || new Date(d.expiry) < now) {
            return false;
          }
          // 개별 지급된 사용자인지 확인
          const isTargetUser = d.targetUserIds?.includes(userId) ?? false;
          // 등급 기반 지급 대상인지 확인
          const isTargetGrade = d.targetGrades?.includes(userGrade) ?? false;
          // targetGrades와 targetUserIds 모두 없으면 모든 사용자에게 지급
          const isOpenToAll = (!d.targetGrades || d.targetGrades.length === 0) &&
                              (!d.targetUserIds || d.targetUserIds.length === 0);

          return isTargetUser || isTargetGrade || isOpenToAll;
        });
      },

      // 쿠폰에 사용자 추가 (개별 지급)
      addUserToCoupon: (discountId: string, userId: string) =>
        set((state) => ({
          discounts: state.discounts.map((discount) =>
            discount.id === discountId
              ? {
                  ...discount,
                  targetUserIds: discount.targetUserIds
                    ? [...new Set([...discount.targetUserIds, userId])]
                    : [userId],
                  updatedAt: new Date().toISOString(),
                }
              : discount
          ),
        })),

      // 쿠폰에서 사용자 제거
      removeUserFromCoupon: (discountId: string, userId: string) =>
        set((state) => ({
          discounts: state.discounts.map((discount) =>
            discount.id === discountId
              ? {
                  ...discount,
                  targetUserIds: discount.targetUserIds?.filter((id) => id !== userId) ?? [],
                  updatedAt: new Date().toISOString(),
                }
              : discount
          ),
        })),

      markAsUsed: (id) =>
        set((state) => ({
          discounts: state.discounts.map((discount) =>
            discount.id === id
              ? {
                  ...discount,
                  isUsed: true,
                  usageCount: discount.usageCount + 1,
                  updatedAt: new Date().toISOString(),
                }
              : discount
          ),
        })),

      incrementUsageCount: (id) =>
        set((state) => ({
          discounts: state.discounts.map((discount) =>
            discount.id === id
              ? {
                  ...discount,
                  usageCount: discount.usageCount + 1,
                  updatedAt: new Date().toISOString(),
                }
              : discount
          ),
        })),

      toggleActive: (id) =>
        set((state) => ({
          discounts: state.discounts.map((discount) =>
            discount.id === id
              ? {
                  ...discount,
                  isActive: !discount.isActive,
                  updatedAt: new Date().toISOString(),
                }
              : discount
          ),
        })),
    }),
    {
      name: 'plic-discount-storage',
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        // localStorage를 완전히 초기화
        return {
          discounts: [],
        } as unknown as IDiscountState;
      },
    }
  )
);
```

### 1.10 src/stores/useSettingsStore.ts

```typescript
// src/stores/useSettingsStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TUserGrade } from '@/types';

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
    basic: { feeRate: 4.0, monthlyLimit: 10000000 },
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
  updateSettings: (newSettings: Partial<ISystemSettings>) => void;
  updateGradeSettings: (grade: TUserGrade, gradeSettings: Partial<IGradeSettings>) => void;
  updateGradeCriteria: (criteria: Partial<IGradeCriteria>) => void;
  resetSettings: () => void;
  getGradeSettings: (grade: TUserGrade) => IGradeSettings;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: { ...defaultSettings },

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
    }),
    {
      name: 'plic-settings',
      storage: createJSONStorage(() => localStorage),
      // 데이터 마이그레이션: gradeSettings가 없거나 불완전한 경우 기본값으로 채움
      migrate: (persistedState: any, version: number) => {
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
```

---

## 2. 클래스 전체 코드

### 2.1 src/classes/index.ts

```typescript
// src/classes/index.ts

export { UserHelper } from './UserHelper';
export { DealHelper } from './DealHelper';
export { PaymentHelper } from './PaymentHelper';
export { AdminHelper } from './AdminHelper';
export { ContentHelper } from './ContentHelper';
```

### 2.2 src/classes/UserHelper.ts

```typescript
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
    return this.GRADE_CONFIG[grade];
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
    agreements: IUser['agreements']
  ): IUser {
    const gradeConfig = this.GRADE_CONFIG['basic'];
    const now = new Date().toISOString();

    return {
      uid: this.generateUID(),
      name,
      phone,
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
```

### 2.3 src/classes/DealHelper.ts

```typescript
// src/classes/DealHelper.ts

import { IDeal, TDealType, TDealStatus } from '@/types/deal';

interface IDealTypeConfig {
  name: string;
  icon: string;
  requiredDocs: string[];
  optionalDocs: string[];
  description: string;
}

interface IStatusConfig {
  name: string;
  color: string;
  tab: 'progress' | 'revision' | 'completed';
}

export class DealHelper {
  // 거래 종류 설정
  static DEAL_TYPE_CONFIG: Record<TDealType, IDealTypeConfig> = {
    product_purchase: {
      name: '물품매입',
      icon: 'Package',
      requiredDocs: ['세금계산서 또는 거래명세서'],
      optionalDocs: ['물품 사진', '발주서'],
      description: '물품 구매를 증명할 수 있는 서류를 첨부해주세요.',
    },
    labor_cost: {
      name: '인건비',
      icon: 'Users',
      requiredDocs: ['급여명세서 또는 인건비 지급 내역서'],
      optionalDocs: ['근로계약서', '4대보험 가입증명원'],
      description: '인건비 지급 대상과 금액을 확인할 수 있는 서류를 첨부해주세요.',
    },
    service_fee: {
      name: '용역대금',
      icon: 'FileText',
      requiredDocs: ['용역계약서 또는 세금계산서'],
      optionalDocs: ['용역 완료 보고서', '견적서'],
      description: '용역 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    construction: {
      name: '공사대금',
      icon: 'HardHat',
      requiredDocs: ['공사계약서 또는 세금계산서'],
      optionalDocs: ['공사 견적서', '공정표', '현장 사진'],
      description: '공사 계약 및 진행 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    rent: {
      name: '임대료',
      icon: 'Building2',
      requiredDocs: ['임대차계약서'],
      optionalDocs: ['사업자등록증', '임대료 청구서'],
      description: '임대차 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    monthly_rent: {
      name: '월세',
      icon: 'Home',
      requiredDocs: ['임대차계약서'],
      optionalDocs: ['월세 납부 영수증'],
      description: '월세 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    maintenance: {
      name: '관리비',
      icon: 'Wrench',
      requiredDocs: ['관리비 고지서 또는 청구서'],
      optionalDocs: ['관리비 내역서'],
      description: '관리비 청구 내역을 확인할 수 있는 서류를 첨부해주세요.',
    },
    deposit: {
      name: '보증금',
      icon: 'ShieldCheck',
      requiredDocs: ['임대차계약서 또는 보증금 약정서'],
      optionalDocs: ['부동산 등기부등본'],
      description: '보증금 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    advertising: {
      name: '광고비',
      icon: 'Megaphone',
      requiredDocs: ['광고계약서 또는 세금계산서'],
      optionalDocs: ['광고 시안', '매체 게재 확인서'],
      description: '광고 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    shipping: {
      name: '운송비',
      icon: 'Truck',
      requiredDocs: ['운송계약서 또는 운송장'],
      optionalDocs: ['화물 인수증'],
      description: '운송 내역을 확인할 수 있는 서류를 첨부해주세요.',
    },
    rental: {
      name: '렌트/렌탈',
      icon: 'Car',
      requiredDocs: ['렌탈계약서 또는 리스계약서'],
      optionalDocs: ['렌탈료 청구서'],
      description: '렌탈/리스 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    etc: {
      name: '기타',
      icon: 'MoreHorizontal',
      requiredDocs: ['거래 증빙 서류'],
      optionalDocs: ['계약서', '청구서', '세금계산서'],
      description: '거래 내용을 증명할 수 있는 관련 서류를 첨부해주세요.',
    },
  };

  // 거래 상태 설정
  static STATUS_CONFIG: Record<TDealStatus, IStatusConfig> = {
    draft: { name: '작성중', color: 'orange', tab: 'progress' },
    awaiting_payment: { name: '결제대기', color: 'orange', tab: 'progress' },
    pending: { name: '진행중', color: 'blue', tab: 'progress' },
    reviewing: { name: '검토중', color: 'yellow', tab: 'progress' },
    hold: { name: '보류', color: 'orange', tab: 'progress' },
    need_revision: { name: '보완필요', color: 'red', tab: 'revision' },
    cancelled: { name: '거래취소', color: 'gray', tab: 'completed' },
    completed: { name: '거래완료', color: 'green', tab: 'completed' },
  };

  // DID 생성
  static generateDID(): string {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `D${yy}${mm}${dd}${random}`;
  }

  // 파일 -> Blob URL 변환 (업로드 시뮬레이션)
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Blob URL 해제 (메모리 관리)
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  // 수수료 및 총액 계산
  static calculateTotal(amount: number, feeRate: number, discountAmount: number = 0) {
    const feeAmount = Math.floor(amount * (feeRate / 100));
    const totalAmount = amount + feeAmount;
    const finalAmount = totalAmount - discountAmount;
    return { feeAmount, totalAmount, finalAmount };
  }

  // 히스토리 추가
  static addHistory(
    deal: IDeal,
    action: string,
    description: string,
    actor: 'user' | 'system' | 'admin',
    actorId?: string
  ): IDeal {
    return {
      ...deal,
      history: [
        {
          timestamp: new Date().toISOString(),
          action,
          description,
          actor,
          actorId,
        },
        ...deal.history,
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  // 거래 종류 설정 반환
  static getDealTypeConfig(dealType: TDealType): IDealTypeConfig {
    return this.DEAL_TYPE_CONFIG[dealType];
  }

  // 거래 상태 설정 반환
  static getStatusConfig(status: TDealStatus): IStatusConfig {
    return this.STATUS_CONFIG[status];
  }
}
```

### 2.4 src/classes/PaymentHelper.ts

```typescript
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
```

### 2.5 src/classes/AdminHelper.ts

```typescript
// src/classes/AdminHelper.ts

import { IAdmin, TAdminRole } from '@/types/admin';

interface IRoleConfig {
  name: string;
  description: string;
  permissions: string[];
}

export class AdminHelper {
  // 역할별 권한 설정
  static ROLE_CONFIG: Record<TAdminRole, IRoleConfig> = {
    super: {
      name: '슈퍼관리자',
      description: '모든 기능에 대한 접근 권한',
      permissions: [
        'admin.view', 'admin.create', 'admin.edit', 'admin.delete',
        'settings.view', 'settings.edit',
        'user.view', 'user.edit', 'user.delete',
        'deal.view', 'deal.approve', 'deal.reject',
        'code.view', 'code.create', 'code.edit', 'code.delete',
        'content.view', 'content.banner.manage', 'content.notice.manage', 'content.faq.manage',
        'inquiry.view', 'inquiry.reply',
      ],
    },
    operator: {
      name: '운영팀',
      description: '일상적인 운영 업무 담당',
      permissions: [
        'user.view', 'user.edit',
        'deal.view', 'deal.approve', 'deal.reject',
        'code.view', 'code.create', 'code.edit',
        'content.view', 'content.banner.manage', 'content.notice.manage', 'content.faq.manage',
        'inquiry.view', 'inquiry.reply',
      ],
    },
    cs: {
      name: 'CS팀',
      description: '고객 문의 응대 담당',
      permissions: [
        'user.view',
        'deal.view',
        'inquiry.view', 'inquiry.reply',
      ],
    },
  };

  // 마스터 계정 정보
  static MASTER_ADMIN: IAdmin = {
    adminId: 'MASTER',
    email: 'admin',
    name: '마스터관리자',
    phone: '',
    role: 'super',
    status: 'active',
    isMaster: true,
    password: 'admin',
    loginFailCount: 0,
    isLocked: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  // Admin ID 생성
  static generateAdminId(): string {
    return `ADM${Date.now().toString(36).toUpperCase()}`;
  }

  // 권한 체크
  static hasPermission(role: TAdminRole, permission: string): boolean {
    return this.ROLE_CONFIG[role].permissions.includes(permission);
  }

  // 역할별 설정 반환
  static getRoleConfig(role: TAdminRole): IRoleConfig {
    return this.ROLE_CONFIG[role];
  }

  // 비밀번호 유효성 검사
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push('비밀번호는 8자 이상이어야 합니다.');
    if (!/[A-Z]/.test(password)) errors.push('대문자를 포함해야 합니다.');
    if (!/[a-z]/.test(password)) errors.push('소문자를 포함해야 합니다.');
    if (!/[0-9]/.test(password)) errors.push('숫자를 포함해야 합니다.');
    if (!/[!@#$%^&*]/.test(password)) errors.push('특수문자를 포함해야 합니다.');
    return { valid: errors.length === 0, errors };
  }

  // 신규 어드민 생성
  static createNewAdmin(
    email: string,
    name: string,
    role: TAdminRole,
    password: string,
    createdBy: string,
    phone?: string
  ): IAdmin {
    const now = new Date().toISOString();
    return {
      adminId: this.generateAdminId(),
      email,
      name,
      phone,
      role,
      status: 'active',
      isMaster: false,
      password,
      loginFailCount: 0,
      isLocked: false,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }
}
```

### 2.6 src/classes/ContentHelper.ts

```typescript
// src/classes/ContentHelper.ts

import { IHomeBanner, INotice, IFAQ } from '@/types/content';

export class ContentHelper {
  static generateBannerId(): string {
    return `BNR${Date.now().toString(36).toUpperCase()}`;
  }

  static generateNoticeId(): string {
    return `NTC${Date.now().toString(36).toUpperCase()}`;
  }

  static generateFAQId(): string {
    return `FAQ${Date.now().toString(36).toUpperCase()}`;
  }

  static FAQ_CATEGORIES = [
    { id: 'service', name: '서비스 이용' },
    { id: 'payment', name: '결제/수수료' },
    { id: 'account', name: '계정/회원' },
    { id: 'transfer', name: '송금/입금' },
    { id: 'etc', name: '기타' },
  ];

  // 신규 배너 생성
  static createNewBanner(
    title: string,
    imageUrl: string,
    linkUrl: string,
    createdBy: string,
    options?: {
      linkTarget?: '_self' | '_blank';
      priority?: number;
      startDate?: string;
      endDate?: string;
    }
  ): IHomeBanner {
    const now = new Date().toISOString();
    return {
      bannerId: this.generateBannerId(),
      title,
      imageUrl,
      linkUrl,
      linkTarget: options?.linkTarget || '_self',
      isVisible: true,
      priority: options?.priority || 0,
      startDate: options?.startDate,
      endDate: options?.endDate,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }

  // 신규 공지사항 생성
  static createNewNotice(
    title: string,
    content: string,
    createdBy: string,
    options?: {
      isPinned?: boolean;
      priority?: number;
    }
  ): INotice {
    const now = new Date().toISOString();
    return {
      noticeId: this.generateNoticeId(),
      title,
      content,
      isVisible: true,
      isPinned: options?.isPinned || false,
      priority: options?.priority || 0,
      viewCount: 0,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }

  // 신규 FAQ 생성
  static createNewFAQ(
    question: string,
    answer: string,
    createdBy: string,
    options?: {
      category?: string;
      priority?: number;
      isHomeFeatured?: boolean;
    }
  ): IFAQ {
    const now = new Date().toISOString();
    return {
      faqId: this.generateFAQId(),
      question,
      answer,
      category: options?.category,
      isVisible: true,
      isHomeFeatured: options?.isHomeFeatured || false,
      priority: options?.priority || 0,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }
}
```

---

## 3. 타입 전체 코드

### 3.1 src/types/index.ts

```typescript
// src/types/index.ts

export * from './user';
export * from './deal';
export * from './payment';
export * from './admin';
export * from './content';
export * from './discount';
```

### 3.2 src/types/user.ts

```typescript
// src/types/user.ts

export type TUserStatus = 'active' | 'suspended' | 'pending' | 'withdrawn';
export type TUserGrade = 'basic' | 'platinum' | 'b2b' | 'employee';

/**
 * 등급 변경 처리 결과
 */
export interface IGradeChangeResult {
  uid: string;
  name: string;
  prevGrade: TUserGrade;
  newGrade: TUserGrade;
  lastMonthPaymentAmount: number;
}
export type TSocialProvider = 'kakao' | 'naver' | 'google' | 'apple' | null;

// 히스토리 변경 주체
export type THistoryActor = 'member' | 'admin' | 'system';

// 히스토리 변경 항목 타입
export type THistoryField =
  | 'signup'           // 회원가입
  | 'status'           // 계정상태
  | 'grade'            // 회원 등급
  | 'feeRate'          // 수수료율
  | 'monthlyLimit'     // 월 한도
  | 'name'             // 이름
  | 'email'            // 이메일
  | 'phone'            // 연락처
  | 'thirdParty'       // 제3자 정보제공 동의
  | 'marketing';       // 마케팅 수신 동의

// 회원 히스토리 항목
export interface IUserHistory {
  id: string;
  field: THistoryField;
  fieldLabel: string;
  prevValue: string | null;
  newValue: string | null;
  actor: THistoryActor;
  actorLabel: string;
  memo?: string;         // 정책 변경 등 추가 설명
  timestamp: string;     // ISO Date String
}

export interface IUser {
  uid: string;
  name: string;
  phone: string;
  email?: string;

  // 인증 관련
  authType: 'direct' | 'social';
  socialProvider: TSocialProvider;
  socialId?: string;
  isVerified: boolean;
  verifiedAt?: string;  // ISO Date String (localStorage 호환)

  // 상태 및 등급
  status: TUserStatus;
  grade: TUserGrade;
  feeRate: number;
  isGradeManual: boolean;  // 수동 등급 부여 여부 (true면 자동 등급 변경 제외)

  // 한도
  monthlyLimit: number;
  usedAmount: number;

  // 동의 항목
  agreements: {
    service: boolean;
    privacy: boolean;
    thirdParty: boolean;
    marketing: boolean;
  };

  // 누적 정보
  totalPaymentAmount: number;
  totalDealCount: number;

  // 전월 결제 금액 (자동 등급 산정용)
  lastMonthPaymentAmount: number;

  // 히스토리
  history: IUserHistory[];

  // 일시 정보 (ISO Date String)
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

### 3.3 src/types/deal.ts

```typescript
// src/types/deal.ts

export type TDealStatus =
  | 'draft'            // 작성중 (임시저장)
  | 'awaiting_payment' // 결제대기
  | 'pending'          // 진행중
  | 'reviewing'        // 검토중
  | 'hold'             // 보류
  | 'need_revision'    // 보완필요
  | 'cancelled'        // 거래취소
  | 'completed';       // 거래완료

export type TDealStep = 'type' | 'amount' | 'recipient' | 'docs' | 'confirm';

export type TDealType =
  | 'product_purchase'  // 물품매입
  | 'labor_cost'        // 인건비
  | 'service_fee'       // 용역대금
  | 'construction'      // 공사대금
  | 'rent'              // 임대료
  | 'monthly_rent'      // 월세
  | 'maintenance'       // 관리비
  | 'deposit'           // 보증금
  | 'advertising'       // 광고비
  | 'shipping'          // 운송비
  | 'rental'            // 렌트/렌탈
  | 'etc';              // 기타

export interface IRecipientAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface IDealHistory {
  timestamp: string;
  action: string;
  description: string;
  actor: 'user' | 'system' | 'admin';
  actorId?: string;
}

export interface IDeal {
  did: string;
  uid: string;

  // 거래 기본 정보
  dealName: string;
  dealType: TDealType;
  status: TDealStatus;
  revisionType?: 'documents' | 'recipient'; // 보완 요청 유형 (서류보완 또는 수취인정보보완)
  revisionMemo?: string; // 운영팀의 보완 요청 메모

  // 금액 정보
  amount: number;
  feeRate: number;
  feeAmount: number;
  totalAmount: number;

  // 할인 정보
  discountCode?: string;
  discountAmount: number;
  finalAmount: number;

  // 상대방 정보
  recipient: IRecipientAccount;
  senderName: string;

  // 첨부 서류 (Blob URL 배열)
  attachments: string[];

  // 결제 정보
  paymentId?: string;
  isPaid: boolean;
  paidAt?: string;

  // 송금 정보
  isTransferred: boolean;
  transferredAt?: string;

  // 이력
  history: IDealHistory[];

  // 일시 정보
  createdAt: string;
  updatedAt: string;
}

// 임시저장 서류 정보
export interface IDraftDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data?: string; // Base64 인코딩된 파일 데이터
}

// 송금 임시저장 (작성중)
export interface IDealDraft {
  id: string;
  uid: string;
  status: 'draft';
  currentStep: TDealStep;
  lastUpdatedAt: string;
  createdAt: string;

  // Step 1: type (거래 유형)
  dealType?: TDealType;
  dealTypeLabel?: string;

  // Step 2: amount (금액)
  amount?: number;
  discountCode?: string;

  // Step 3: recipient (수취인)
  recipient?: {
    bank?: string;
    accountNumber?: string;
    accountHolder?: string;
    isVerified?: boolean;
  };
  senderName?: string;

  // Step 4: docs (서류)
  documents?: IDraftDocument[];
}
```

### 3.4 src/types/payment.ts

```typescript
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
```

### 3.5 src/types/admin.ts

```typescript
// src/types/admin.ts

export type TAdminRole = 'super' | 'operator' | 'cs';
export type TAdminStatus = 'active' | 'inactive' | 'suspended';

export interface IAdmin {
  adminId: string;
  email: string;
  name: string;
  phone?: string;
  role: TAdminRole;
  status: TAdminStatus;
  isMaster: boolean;  // 마스터 계정 여부 (삭제 불가)
  password?: string;  // Mock용
  loginFailCount: number;
  isLocked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface IAdminSession {
  adminId: string;
  email: string;
  name: string;
  role: TAdminRole;
  permissions: string[];
  loginAt: string;
  expiresAt: string;
}
```

### 3.6 src/types/content.ts

```typescript
// src/types/content.ts

export interface IHomeBanner {
  bannerId: string;
  title: string;
  imageUrl: string;  // Blob URL
  linkUrl: string;
  linkTarget: '_self' | '_blank';
  isVisible: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface INotice {
  noticeId: string;
  title: string;
  content: string;
  isVisible: boolean;
  isPinned: boolean;
  priority: number;
  viewCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface IFAQ {
  faqId: string;
  question: string;
  answer: string;
  category?: string;
  isVisible: boolean;
  isHomeFeatured?: boolean; // 홈 화면에 노출 여부
  priority: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
```

### 3.7 src/types/discount.ts

```typescript
// src/types/discount.ts

import { TUserGrade } from './user';

export type TDiscountType = 'code' | 'coupon';
export type TDiscountValueType = 'amount' | 'feePercent';

export interface IDiscount {
  id: string;              // 고유 ID
  name: string;            // 운영팀 지정 이름 (사용자에게 노출)
  code?: string;           // 할인코드 (type이 'code'인 경우 사용자가 입력하는 코드)
  type: TDiscountType;     // 'code' | 'coupon'
  discountType: TDiscountValueType; // 금액 할인 or 수수료 % 할인
  discountValue: number;   // amount면 금액, feePercent면 퍼센트
  minAmount: number;       // 최소 주문 금액
  startDate: string;       // 적용 시작일 (ISO string)
  expiry: string;          // 유효기간/종료일 (ISO string)
  canStack: boolean;       // 중복 사용 가능 여부
  isReusable: boolean;     // 재사용 가능 여부
  isUsed?: boolean;        // 이미 사용했는지 여부 (비재사용 항목용)
  isActive: boolean;       // 활성화 여부
  createdAt: string;       // 생성일
  updatedAt: string;       // 수정일
  usageCount: number;      // 사용 횟수
  description?: string;    // 설명 (선택)

  // 할인코드: 사용 가능 등급 (복수 선택 가능)
  allowedGrades?: TUserGrade[];

  // 쿠폰: 지급 대상 등급 (복수 선택 가능)
  targetGrades?: TUserGrade[];

  // 쿠폰: 개별 지급된 사용자 UID 목록
  targetUserIds?: string[];
}

export interface IDiscountCreateInput {
  name: string;
  code?: string;
  type: TDiscountType;
  discountType: TDiscountValueType;
  discountValue: number;
  minAmount: number;
  startDate: string;
  expiry: string;
  canStack: boolean;
  isReusable: boolean;
  description?: string;

  // 할인코드: 사용 가능 등급 (복수 선택 가능)
  allowedGrades?: TUserGrade[];

  // 쿠폰: 지급 대상 등급 (복수 선택 가능)
  targetGrades?: TUserGrade[];

  // 쿠폰: 개별 지급된 사용자 UID 목록
  targetUserIds?: string[];
}
```

---

## 4. 유틸리티 전체 코드

### 4.1 src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @example formatPrice(1000000) => "1,000,000"
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/**
 * 현재 시간을 ISO 문자열로 반환
 */
export function getNow(): string {
  return new Date().toISOString();
}

/**
 * ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 * @example formatDate("2024-01-15T09:00:00Z") => "2024.01.15"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * ISO 날짜 문자열을 YYYY.MM.DD HH:mm 형식으로 변환
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
```

### 4.2 src/lib/gradeUtils.ts

```typescript
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
```

---

## 5. 공통 컴포넌트 코드

### 5.1 src/components/common/index.ts

```typescript
// src/components/common/index.ts

export { default as MobileLayout } from './MobileLayout';
export { default as LeftPanel } from './LeftPanel';
export { default as Header } from './Header';
export { default as BottomNav } from './BottomNav';
export { BannerSlider } from './BannerSlider';
export { Modal } from './Modal';
```

### 5.2 src/components/common/MobileLayout.tsx

```tsx
'use client';

import { ReactNode } from 'react';
import LeftPanel from './LeftPanel';

interface MobileLayoutProps {
  children: ReactNode;
  showLeftPanel?: boolean;
}

export default function MobileLayout({
  children,
  showLeftPanel = true
}: MobileLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex lg:flex-row">
      {/* PC: 좌측 마케팅 패널 (1024px 이상일 때만 노출, 고정) */}
      {showLeftPanel && (
        <aside className="
          hidden lg:flex lg:w-1/2 h-screen
          bg-gradient-to-b from-primary-50 to-white
          flex-col justify-center items-center
          p-10
          flex-shrink-0 overflow-hidden
        ">
          <LeftPanel />
        </aside>
      )}

      {/* 우측 50% 영역: 모바일 UI */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-start flex-shrink-0">
        {/* 모바일 프레임 - relative로 내부 요소 기준점 */}
        <main
          id="mobile-frame"
          className="
          relative
          w-full lg:w-[390px] h-screen
          bg-white
          lg:shadow-[-4px_0_24px_rgba(0,0,0,0.08)]
          overflow-hidden
          flex flex-col
        ">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 5.3 src/components/common/LeftPanel.tsx

```tsx
'use client';

import { Zap, ShieldCheck, CreditCard } from 'lucide-react';

export default function LeftPanel() {
  return (
    <div className="text-center">
      {/* 로고 */}
      <h1 className="text-5xl font-bold text-primary-400 mb-4">PLIC</h1>

      {/* 태그라인 */}
      <p className="text-xl text-gray-600 mb-12">카드로 결제, 계좌로 송금</p>

      {/* 주요 혜택 */}
      <div className="flex gap-6 mb-12">
        <div className="flex flex-col items-center">
          <Zap className="w-8 h-8 text-primary-400 mb-2" />
          <span className="text-sm text-gray-600">즉시 송금</span>
        </div>
        <div className="flex flex-col items-center">
          <ShieldCheck className="w-8 h-8 text-primary-400 mb-2" />
          <span className="text-sm text-gray-600">안전한 거래</span>
        </div>
        <div className="flex flex-col items-center">
          <CreditCard className="w-8 h-8 text-primary-400 mb-2" />
          <span className="text-sm text-gray-600">모든 카드</span>
        </div>
      </div>

      {/* QR 코드 (추후) */}
      <div className="w-32 h-32 bg-gray-100 rounded-xl mb-4 mx-auto flex items-center justify-center">
        <span className="text-gray-400 text-sm">앱 다운로드</span>
      </div>

      {/* 하단 링크 */}
      <div className="mt-12 text-sm text-gray-500 space-x-4">
        <a href="mailto:ads@plic.co.kr" className="hover:text-gray-700">광고 문의</a>
        <span>|</span>
        <a href="mailto:biz@plic.co.kr" className="hover:text-gray-700">제휴 문의</a>
      </div>

      {/* 저작권 */}
      <div className="mt-4 text-xs text-gray-400">
        © 2025 PLIC. All rights reserved.
      </div>
    </div>
  );
}
```

### 5.4 src/components/common/Header.tsx

```tsx
'use client';

import { ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
  className?: string;
}

export default function Header({
  title,
  showBack = false,
  showClose = false,
  onBack,
  onClose,
  rightAction,
  transparent = false,
  className = '',
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-50
        h-14 px-4
        flex items-center justify-between
        ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-100'}
        ${className}
      `}
    >
      {/* 좌측 영역 */}
      <div className="w-10 flex items-center">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>

      {/* 중앙 타이틀 */}
      <h1 className="flex-1 text-center font-semibold text-gray-900 truncate">
        {title}
      </h1>

      {/* 우측 영역 */}
      <div className="w-10 flex items-center justify-end">
        {showClose && (
          <button
            onClick={handleClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        )}
        {rightAction}
      </div>
    </header>
  );
}
```

### 5.5 src/components/common/BottomNav.tsx

```tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, FileText, HelpCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/deals', icon: FileText, label: '거래내역' },
  { href: '/guide', icon: HelpCircle, label: '이용안내' },
  { href: '/mypage', icon: User, label: '내정보' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="
      flex-shrink-0
      bg-white border-t border-gray-100
      pb-safe
      z-50
    ">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                active ? 'text-primary-400' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon className={cn('w-6 h-6', active && 'stroke-[2.5]')} />
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 5.6 src/components/common/Modal.tsx

```tsx
// src/components/common/Modal.tsx
'use client';

import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = '확인',
  onConfirm,
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 - 모바일 프레임 기준 중앙 배치 */}
      <div className="relative bg-white rounded-2xl w-[calc(100%-2rem)] max-w-sm p-6 shadow-xl">
        {/* 닫기 버튼 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 제목 */}
        <h2 className="text-lg font-bold text-gray-900 mb-4 pr-6">{title}</h2>

        {/* 내용 */}
        <div className="text-gray-600 text-sm leading-relaxed mb-6">
          {children}
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handleConfirm}
          className="w-full h-12 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
```

### 5.7 src/components/common/BannerSlider.tsx

> 코드가 길어 핵심 부분만 포함합니다. 전체 코드는 소스 파일 참조.

```tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useContentStore } from '@/stores';
import { cn } from '@/lib/utils';

export function BannerSlider() {
  const { getVisibleBanners } = useContentStore();
  const banners = getVisibleBanners();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // store의 배너 데이터만 사용
  const displayBanners = banners;
  const sortedBanners = [...displayBanners].sort((a, b) => a.priority - b.priority);

  const bannerWidth = 300;
  const bannerHeight = 250;

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (sortedBanners.length <= 1) return;
    const timer = setInterval(() => {
      if (!isDragging) {
        setCurrentIndex((prev) => (prev + 1) % sortedBanners.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [isDragging, sortedBanners.length]);

  // ... 드래그 핸들러 및 렌더링 로직

  if (sortedBanners.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* 배너 슬라이더 컨테이너 */}
      {/* ... */}
    </div>
  );
}
```

---

## 6. 핵심 페이지 코드

> 핵심 페이지 코드는 분량이 많아 별도 문서로 분리하거나 요약본을 참조하세요.

### 6.1 src/app/(customer)/page.tsx (홈)

**파일 위치**: `src/app/(customer)/page.tsx`
**라인 수**: 약 333줄

주요 기능:
- 금액 입력 및 수수료 미리보기
- 작성중/결제대기 송금 알림 배너
- 배너 슬라이더
- FAQ 아코디언
- 계정 상태 모달

### 6.2 src/app/(customer)/deals/new/page.tsx (송금 신청)

**파일 위치**: `src/app/(customer)/deals/new/page.tsx`
**라인 수**: 약 1,120줄

주요 기능:
- 5단계 송금 신청 플로우 (type → amount → recipient → docs → confirm)
- Draft 임시저장/복원
- 기존 거래 내역 조회
- 파일 첨부 및 Base64 인코딩
- 계좌 인증 시뮬레이션

### 6.3 src/app/(customer)/deals/[did]/page.tsx (거래 상세)

**파일 위치**: `src/app/(customer)/deals/[did]/page.tsx`
**라인 수**: 약 1,345줄

주요 기능:
- 거래 상태 표시
- 할인코드/쿠폰 적용
- 보완 요청 처리 (서류/수취인)
- 첨부파일 미리보기
- 거래 이력 타임라인
- 거래 취소

### 6.4 src/app/(customer)/payment/[did]/page.tsx (결제)

**파일 위치**: `src/app/(customer)/payment/[did]/page.tsx`
**라인 수**: 약 496줄

주요 기능:
- 카드 등록/삭제
- 기본 카드 설정
- 할부 선택
- 결제 처리

### 6.5 src/app/admin/deals/page.tsx (관리자 거래 관리)

**파일 위치**: `src/app/admin/deals/page.tsx`
**라인 수**: 약 247줄

주요 기능:
- 거래 목록 테이블
- 검색 및 필터
- 통계 카드
- 상태별 색상 표시

---

## 문서 정보

| 항목 | 값 |
|------|-----|
| 생성일 | 2024-12-22 |
| 스토어 파일 수 | 10개 |
| 클래스 파일 수 | 6개 |
| 타입 파일 수 | 7개 |
| 유틸리티 파일 수 | 2개 |
| 공통 컴포넌트 수 | 7개 |
| 핵심 페이지 수 | 5개 |
