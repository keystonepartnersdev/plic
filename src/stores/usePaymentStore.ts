// src/stores/usePaymentStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IPayment, TPaymentStatus } from '@/types';
import { getErrorMessage } from '@/lib/utils';

// Next.js 프록시 사용으로 CORS 우회

interface IPaymentState {
  payments: IPayment[];
  isLoading: boolean;
  error: string | null;

  // Local state management
  setPayments: (payments: IPayment[]) => void;
  addPayment: (payment: IPayment) => void;
  updatePayment: (paymentId: string, updates: Partial<IPayment>) => void;
  getPaymentById: (paymentId: string) => IPayment | undefined;
  getPaymentByDid: (did: string) => IPayment | undefined;
  getPaymentsByUid: (uid: string) => IPayment[];
  getPaymentsByStatus: (status: TPaymentStatus) => IPayment[];

  // API operations (프록시 사용, token은 httpOnly 쿠키로 자동 전송)
  fetchPayments: () => Promise<void>;
  createPayment: (data: { did: string; amount: number; method?: string; metadata?: Record<string, unknown> }) => Promise<IPayment | null>;
  updatePaymentAPI: (paymentId: string, updates: { status?: TPaymentStatus; metadata?: Record<string, unknown> }) => Promise<boolean>;
}

export const usePaymentStore = create(
  persist<IPaymentState>(
    (set, get) => ({
      payments: [],
      isLoading: false,
      error: null,

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

      // Fetch payments from API (프록시 사용)
      fetchPayments: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/users/me/payments', {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          const data = await response.json();
          if (data.success) {
            set({ payments: data.data.payments || [], isLoading: false });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error: unknown) {
          set({ error: getErrorMessage(error), isLoading: false });
        }
      },

      // Create payment via API (프록시 사용)
      createPayment: async (paymentData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/users/me/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(paymentData),
          });
          const data = await response.json();
          if (data.success) {
            const newPayment = data.data.payment;
            set((state) => ({
              payments: [newPayment, ...state.payments],
              isLoading: false,
            }));
            return newPayment;
          } else {
            set({ error: data.error, isLoading: false });
            return null;
          }
        } catch (error: unknown) {
          set({ error: getErrorMessage(error), isLoading: false });
          return null;
        }
      },

      // Update payment via API (프록시 사용)
      updatePaymentAPI: async (paymentId: string, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/users/me/payments/${paymentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates),
          });
          const data = await response.json();
          if (data.success) {
            set((state) => ({
              payments: state.payments.map((p) =>
                p.paymentId === paymentId ? { ...p, ...updates } : p
              ),
              isLoading: false,
            }));
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
      name: 'plic-payment-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
