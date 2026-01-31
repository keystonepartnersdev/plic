// src/stores/useDiscountStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDiscount } from '@/types';
import { discountsAPI } from '@/lib/api';

interface IDiscountState {
  discounts: IDiscount[];
  userCoupons: IDiscount[]; // API에서 가져온 사용자 쿠폰
  isLoading: boolean;
  apiError: string | null;

  // API 연동 메서드
  fetchUserCoupons: () => Promise<void>;
  validateDiscountCode: (code: string, amount: number) => Promise<IDiscount | null>;
  clearApiError: () => void;

  // 로컬 메서드 (기존 호환용 + 관리자)
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
      userCoupons: [],
      isLoading: false,
      apiError: null,

      // ============================================
      // API 연동 메서드
      // ============================================

      fetchUserCoupons: async () => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await discountsAPI.getCoupons();
          const coupons = (result.coupons || []).map((coupon: any) => ({
            ...coupon,
            type: 'coupon' as const,
          }));
          set({
            userCoupons: coupons,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            apiError: errorMessage || '쿠폰 목록을 불러오는데 실패했습니다.',
          });
        }
      },

      validateDiscountCode: async (code: string, amount: number) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await discountsAPI.validate({ code, amount });
          set({ isLoading: false });

          if (result.valid && result.discount) {
            return {
              ...result.discount,
              type: 'code' as const,
            } as IDiscount;
          }
          return null;
        } catch (error) {
          set({
            isLoading: false,
            apiError: errorMessage || '할인코드 검증에 실패했습니다.',
          });
          return null;
        }
      },

      clearApiError: () => set({ apiError: null }),

      // ============================================
      // 로컬 메서드 (기존 호환용 + 관리자)
      // ============================================

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

      getActiveCoupons: () => {
        // API에서 가져온 쿠폰과 로컬 쿠폰 합치기 (중복 제거)
        const localCoupons = get().discounts.filter((d) => d.type === 'coupon' && d.isActive);
        const apiCoupons = get().userCoupons.filter((c) => c.isActive);

        // ID 기준 중복 제거
        const allCoupons = [...apiCoupons];
        localCoupons.forEach((local) => {
          if (!allCoupons.some((c) => c.id === local.id)) {
            allCoupons.push(local);
          }
        });

        return allCoupons;
      },
    }),
    {
      name: 'plic-discount-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
