// src/stores/useDealStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDeal } from '@/types';

interface IDealState {
  deals: IDeal[];
  
  addDeal: (deal: IDeal) => void;
  updateDeal: (did: string, updates: Partial<IDeal>) => void;
  deleteDeal: (did: string) => void;
  getDealById: (did: string) => IDeal | undefined;
  getDealsByStatus: (status: string) => IDeal[];
  getDealsByUserId: (uid: string) => IDeal[];
}

export const useDealStore = create(
  persist<IDealState>(
    (set, get) => ({
      deals: [],

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
    }),
    {
      name: 'plic-deal-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
