// src/stores/useDealStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDeal, TDealStatus } from '@/types';
import { dealsAPI } from '@/lib/api';

interface IDealState {
  deals: IDeal[];
  isLoading: boolean;
  apiError: string | null;

  // API 연동 메서드
  fetchDeals: (params?: { status?: string; limit?: number }) => Promise<void>;
  fetchDealById: (did: string) => Promise<IDeal | null>;
  createDealWithAPI: (data: {
    dealName: string;
    dealType: string;
    amount: number;
    recipient: { bank: string; accountNumber: string; accountHolder: string };
    senderName: string;
    attachments?: string[];
  }) => Promise<IDeal>;
  updateDealWithAPI: (did: string, updates: Partial<IDeal>) => Promise<void>;
  cancelDealWithAPI: (did: string) => Promise<void>;
  applyDiscountWithAPI: (did: string, discountId: string) => Promise<void>;

  // 로컬 메서드 (기존 호환용)
  addDeal: (deal: IDeal) => void;
  updateDeal: (did: string, updates: Partial<IDeal>) => void;
  deleteDeal: (did: string) => void;
  getDealById: (did: string) => IDeal | undefined;
  getDealsByStatus: (status: string) => IDeal[];
  getDealsByUserId: (uid: string) => IDeal[];
  setDeals: (deals: IDeal[]) => void;
  clearDeals: () => void;
  clearApiError: () => void;
}

export const useDealStore = create(
  persist<IDealState>(
    (set, get) => ({
      deals: [],
      isLoading: false,
      apiError: null,

      // ============================================
      // API 연동 메서드
      // ============================================

      fetchDeals: async (params) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await dealsAPI.list(params);
          set({
            deals: result.deals,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            apiError: error.message || '거래 목록을 불러오는데 실패했습니다.',
          });
        }
      },

      fetchDealById: async (did) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await dealsAPI.get(did);
          const deal = result.deal;

          // 로컬 캐시 업데이트
          const existingIndex = get().deals.findIndex(d => d.did === did);
          if (existingIndex >= 0) {
            set((state) => ({
              deals: state.deals.map(d => d.did === did ? deal : d),
            }));
          } else {
            set((state) => ({
              deals: [deal, ...state.deals],
            }));
          }

          set({ isLoading: false });
          return deal;
        } catch (error: any) {
          set({
            isLoading: false,
            apiError: error.message || '거래 정보를 불러오는데 실패했습니다.',
          });
          return null;
        }
      },

      createDealWithAPI: async (data) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await dealsAPI.create({
            dealName: data.dealName,
            dealType: data.dealType,
            amount: data.amount,
            recipient: data.recipient,
            senderName: data.senderName,
            attachments: data.attachments,
          });

          // 로컬 캐시에 추가
          set((state) => ({
            deals: [result.deal, ...state.deals],
            isLoading: false,
          }));

          return result.deal;
        } catch (error: any) {
          set({
            isLoading: false,
            apiError: error.message || '거래 생성에 실패했습니다.',
          });
          throw error;
        }
      },

      updateDealWithAPI: async (did, updates) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await dealsAPI.update(did, updates);

          // 로컬 캐시 업데이트
          set((state) => ({
            deals: state.deals.map(deal =>
              deal.did === did ? result.deal : deal
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            apiError: error.message || '거래 수정에 실패했습니다.',
          });
          throw error;
        }
      },

      cancelDealWithAPI: async (did) => {
        set({ isLoading: true, apiError: null });
        try {
          await dealsAPI.cancel(did);

          // 로컬 캐시 업데이트
          set((state) => ({
            deals: state.deals.map(deal =>
              deal.did === did
                ? { ...deal, status: 'cancelled' as TDealStatus, updatedAt: new Date().toISOString() }
                : deal
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            apiError: error.message || '거래 취소에 실패했습니다.',
          });
          throw error;
        }
      },

      applyDiscountWithAPI: async (did, discountId) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await dealsAPI.applyDiscount(did, discountId);

          // 로컬 캐시 업데이트
          set((state) => ({
            deals: state.deals.map(deal =>
              deal.did === did ? result.deal : deal
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            apiError: error.message || '할인 적용에 실패했습니다.',
          });
          throw error;
        }
      },

      clearApiError: () => set({ apiError: null }),

      // ============================================
      // 로컬 메서드 (기존 호환용)
      // ============================================

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

      getDealById: (did) => get().deals.find((deal) => deal.did === did),

      getDealsByStatus: (status) => get().deals.filter((deal) => deal.status === status),

      getDealsByUserId: (uid) => get().deals.filter((deal) => deal.uid === uid),

      setDeals: (deals) => set({ deals }),

      clearDeals: () => set({ deals: [] }),
    }),
    {
      name: 'plic-deal-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
