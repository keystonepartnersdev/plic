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
