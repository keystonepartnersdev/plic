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
