// src/stores/usePaymentStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IPayment, TPaymentStatus } from '@/types';

const API_BASE_URL = 'https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod';

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

  // API operations
  fetchPayments: (token: string) => Promise<void>;
  createPayment: (token: string, data: { did: string; amount: number; method?: string; metadata?: Record<string, any> }) => Promise<IPayment | null>;
  updatePaymentAPI: (token: string, paymentId: string, updates: { status?: TPaymentStatus; metadata?: Record<string, any> }) => Promise<boolean>;
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

      // Fetch payments from API
      fetchPayments: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/users/me/payments`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (data.success) {
            set({ payments: data.data.payments || [], isLoading: false });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Create payment via API
      createPayment: async (token: string, paymentData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/users/me/payments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
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
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      // Update payment via API
      updatePaymentAPI: async (token: string, paymentId: string, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/users/me/payments/${paymentId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
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
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
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
