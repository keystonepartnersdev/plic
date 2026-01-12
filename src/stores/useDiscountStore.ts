// src/stores/useDiscountStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDiscount } from '@/types';

interface IDiscountState {
  discounts: IDiscount[];

  addDiscount: (discount: Partial<IDiscount> & { name: string; type: 'code' | 'coupon' }) => void;
  updateDiscount: (id: string, updates: Partial<IDiscount>) => void;
  deleteDiscount: (id: string) => void;
  toggleActive: (id: string) => void;
  markAsUsed: (id: string) => void;

  getDiscountById: (id: string) => IDiscount | undefined;
  getDiscountByCode: (code: string) => IDiscount | undefined;
  getDiscountsByType: (type: 'code' | 'coupon') => IDiscount[];
  getActiveCodes: () => IDiscount[];
  getActiveCoupons: () => IDiscount[];
}

const generateId = () => `DSC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

export const useDiscountStore = create(
  persist<IDiscountState>(
    (set, get) => ({
      discounts: [],

      addDiscount: (discount) => {
        const now = new Date().toISOString();
        const newDiscount: IDiscount = {
          id: generateId(),
          name: discount.name,
          type: discount.type,
          code: discount.code || '',
          discountType: discount.discountType || 'amount',
          discountValue: discount.discountValue || 0,
          minAmount: discount.minAmount || 0,
          startDate: discount.startDate || now.split('T')[0],
          expiry: discount.expiry || '',
          canStack: discount.canStack ?? true,
          isReusable: discount.isReusable ?? true,
          isActive: true,
          isUsed: false,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
          allowedGrades: discount.allowedGrades || [],
          targetGrades: discount.targetGrades || [],
          targetUserIds: discount.targetUserIds || [],
          description: discount.description,
        };
        
        set((state) => ({
          discounts: [newDiscount, ...state.discounts]
        }));
      },

      updateDiscount: (id, updates) => set((state) => ({
        discounts: state.discounts.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
        )
      })),

      deleteDiscount: (id) => set((state) => ({
        discounts: state.discounts.filter((d) => d.id !== id)
      })),

      toggleActive: (id) => set((state) => ({
        discounts: state.discounts.map((d) =>
          d.id === id ? { ...d, isActive: !d.isActive } : d
        )
      })),

      markAsUsed: (id) => set((state) => ({
        discounts: state.discounts.map((d) =>
          d.id === id ? { ...d, isUsed: true } : d
        )
      })),

      getDiscountById: (id) => get().discounts.find((d) => d.id === id),

      getDiscountByCode: (code) => get().discounts.find((d) => d.code === code && d.type === 'code'),

      getDiscountsByType: (type) => get().discounts.filter((d) => d.type === type),

      getActiveCodes: () => get().discounts.filter((d) => d.type === 'code' && d.isActive),

      getActiveCoupons: () => get().discounts.filter((d) => d.type === 'coupon' && d.isActive),
    }),
    {
      name: 'plic-discount-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
