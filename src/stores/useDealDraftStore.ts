// src/stores/useDealDraftStore.ts
// Phase 2.1: 환경 설정 중앙화 - API_BASE_URL을 config에서 가져옴

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDealDraft, TDealStep, TDealType, IDraftDocument } from '@/types';
import { API_CONFIG } from '@/lib/config';
import { getErrorMessage } from '@/lib/utils';

const API_BASE_URL = API_CONFIG.BASE_URL;

// API 응답 타입
interface IApiDraft {
  draftId: string;
  uid: string;
  dealType: TDealType;
  amount: number;
  recipientBank?: string;
  recipientAccount?: string;
  recipientName?: string;
  senderName?: string;
  step: number;
  createdAt: string;
  updatedAt: string;
}

interface IDealDraftState {
  // 현재 작성중인 송금
  currentDraft: IDealDraft | null;

  // 모든 작성중 송금 목록
  drafts: IDealDraft[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewDraft: (uid: string) => string;
  updateDraft: (data: Partial<IDealDraft>) => void;
  setCurrentStep: (step: TDealStep) => void;
  loadDraft: (id: string) => boolean;
  deleteDraft: (id: string) => void;
  submitDraft: () => IDealDraft | null;
  clearCurrentDraft: () => void;
  getDraftsByUid: (uid: string) => IDealDraft[];

  // API operations
  fetchDrafts: (token: string) => Promise<void>;
  saveDraftToAPI: (token: string) => Promise<boolean>;
  deleteDraftFromAPI: (token: string, draftId: string) => Promise<boolean>;
}

export const useDealDraftStore = create(
  persist<IDealDraftState>(
    (set, get) => ({
      currentDraft: null,
      drafts: [],
      isLoading: false,
      error: null,

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

      // Fetch drafts from API
      fetchDrafts: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/users/me/drafts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (data.success) {
            // Map API response to local draft format
            const stepToName: Record<number, TDealStep> = {
              1: 'type',
              2: 'amount',
              3: 'recipient',
              4: 'docs',
              5: 'confirm',
            };
            const drafts: IDealDraft[] = (data.data.drafts || []).map((d: IApiDraft) => ({
              id: d.draftId,
              uid: d.uid,
              dealType: d.dealType,
              amount: d.amount,
              recipient: {
                bank: d.recipientBank || '',
                accountNumber: d.recipientAccount || '',
                accountHolder: d.recipientName || '',
              },
              senderName: d.senderName || '',
              currentStep: stepToName[d.step] || 'type',
              status: 'draft' as const,
              createdAt: d.createdAt,
              lastUpdatedAt: d.updatedAt,
            }));
            set({ drafts, isLoading: false });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error: unknown) {
          set({ error: getErrorMessage(error), isLoading: false });
        }
      },

      // Save current draft to API
      saveDraftToAPI: async (token: string) => {
        const { currentDraft } = get();
        if (!currentDraft) return false;

        set({ isLoading: true, error: null });
        try {
          const stepMap: Record<TDealStep, number> = {
            type: 1,
            amount: 2,
            recipient: 3,
            docs: 4,
            confirm: 5,
          };

          const body = {
            dealType: currentDraft.dealType || 'send',
            amount: currentDraft.amount || 0,
            recipientBank: currentDraft.recipient?.bank || '',
            recipientAccount: currentDraft.recipient?.accountNumber || '',
            recipientName: currentDraft.recipient?.accountHolder || '',
            senderName: currentDraft.senderName || '',
            step: stepMap[currentDraft.currentStep] || 1,
            metadata: {
              discountCode: currentDraft.discountCode,
              dealTypeLabel: currentDraft.dealTypeLabel,
            },
          };

          // Check if draft exists on server (by checking if id starts with 'DRF')
          const isServerDraft = currentDraft.id.startsWith('DRF');
          const url = isServerDraft
            ? `${API_BASE_URL}/users/me/drafts/${currentDraft.id}`
            : `${API_BASE_URL}/users/me/drafts`;
          const method = isServerDraft ? 'PUT' : 'POST';

          const response = await fetch(url, {
            method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
          const data = await response.json();
          if (data.success) {
            // If new draft, update local draft with server ID
            if (!isServerDraft && data.data?.draft?.draftId) {
              set((state) => ({
                currentDraft: state.currentDraft ? {
                  ...state.currentDraft,
                  id: data.data.draft.draftId,
                } : null,
                drafts: state.drafts.map((d) =>
                  d.id === currentDraft.id ? { ...d, id: data.data.draft.draftId } : d
                ),
                isLoading: false,
              }));
            } else {
              set({ isLoading: false });
            }
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

      // Delete draft from API
      deleteDraftFromAPI: async (token: string, draftId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/users/me/drafts/${draftId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (data.success) {
            set((state) => ({
              drafts: state.drafts.filter((d) => d.id !== draftId),
              currentDraft: state.currentDraft?.id === draftId ? null : state.currentDraft,
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
      name: 'plic-deal-draft-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
