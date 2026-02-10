// src/stores/useContentStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IHomeBanner, INotice, IFAQ } from '@/types';
import { contentAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { DEFAULT_FAQS, DEFAULT_HOME_FAQS } from '@/lib/defaultFaqs';

interface IContentState {
  banners: IHomeBanner[];
  notices: INotice[];
  faqs: IFAQ[];
  faqsByCategory: Record<string, IFAQ[]>;
  isLoading: boolean;
  apiError: string | null;

  // API 연동 메서드
  fetchBanners: () => Promise<void>;
  fetchNotices: (limit?: number) => Promise<void>;
  fetchNoticeDetail: (id: string) => Promise<INotice | null>;
  fetchFaqs: (category?: string) => Promise<void>;

  // 로컬 메서드 (기존 호환용 + 관리자)
  addBanner: (banner: IHomeBanner) => void;
  updateBanner: (id: string, updates: Partial<IHomeBanner>) => void;
  deleteBanner: (id: string) => void;
  getVisibleBanners: () => IHomeBanner[];

  addNotice: (notice: INotice) => void;
  updateNotice: (id: string, updates: Partial<INotice>) => void;
  deleteNotice: (id: string) => void;
  getVisibleNotices: () => INotice[];

  addFAQ: (faq: IFAQ) => void;
  updateFAQ: (id: string, updates: Partial<IFAQ>) => void;
  deleteFAQ: (id: string) => void;
  getVisibleFAQs: () => IFAQ[];
  getHomeFeaturedFAQs: () => IFAQ[];
  getFAQsByCategory: (category: string) => IFAQ[];

  clearApiError: () => void;
}

export const useContentStore = create(
  persist<IContentState>(
    (set, get) => ({
      banners: [],
      notices: [],
      faqs: [],
      faqsByCategory: {},
      isLoading: false,
      apiError: null,

      // ============================================
      // API 연동 메서드
      // ============================================

      fetchBanners: async () => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await contentAPI.getBanners();
          set({
            banners: result.banners,
            isLoading: false,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            apiError: getErrorMessage(error) || '배너를 불러오는데 실패했습니다.',
          });
        }
      },

      fetchNotices: async (limit) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await contentAPI.getNotices(limit);
          set({
            notices: result.notices,
            isLoading: false,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            apiError: getErrorMessage(error) || '공지사항을 불러오는데 실패했습니다.',
          });
        }
      },

      fetchNoticeDetail: async (id) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await contentAPI.getNoticeDetail(id);
          const notice = result.notice;

          // 로컬 캐시 업데이트
          const existingIndex = get().notices.findIndex(n => n.noticeId === id);
          if (existingIndex >= 0) {
            set((state) => ({
              notices: state.notices.map(n => n.noticeId === id ? notice : n),
            }));
          } else {
            set((state) => ({
              notices: [notice, ...state.notices],
            }));
          }

          set({ isLoading: false });
          return notice;
        } catch (error: unknown) {
          set({
            isLoading: false,
            apiError: getErrorMessage(error) || '공지사항을 불러오는데 실패했습니다.',
          });
          return null;
        }
      },

      fetchFaqs: async (category) => {
        set({ isLoading: true, apiError: null });
        try {
          const result = await contentAPI.getFaqs(category);
          const apiFaqs = result.faqs || [];

          if (category) {
            // 특정 카테고리만 업데이트
            const categoryFaqs = apiFaqs.length > 0 ? apiFaqs : DEFAULT_FAQS.filter(f => f.category === category);
            set((state) => ({
              faqsByCategory: {
                ...state.faqsByCategory,
                [category]: categoryFaqs,
              },
              isLoading: false,
            }));
          } else {
            // 전체 FAQ 업데이트 (API 결과 없으면 기본 데이터 사용)
            const finalFaqs = apiFaqs.length > 0 ? apiFaqs : DEFAULT_FAQS;
            set({
              faqs: finalFaqs,
              faqsByCategory: result.grouped || {},
              isLoading: false,
            });
          }
        } catch {
          // API 실패 시 기본 데이터 사용
          set({
            faqs: DEFAULT_FAQS,
            isLoading: false,
            apiError: null, // 기본 데이터로 표시하므로 에러 메시지 숨김
          });
        }
      },

      clearApiError: () => set({ apiError: null }),

      // ============================================
      // 로컬 메서드 (기존 호환용 + 관리자)
      // ============================================

      // 배너
      addBanner: (banner) => set((state) => ({
        banners: [...state.banners, banner]
      })),

      updateBanner: (id, updates) => set((state) => ({
        banners: state.banners.map((b) =>
          b.bannerId === id ? { ...b, ...updates } : b
        )
      })),

      deleteBanner: (id) => set((state) => ({
        banners: state.banners.filter((b) => b.bannerId !== id)
      })),

      getVisibleBanners: () => get().banners.filter((b) => b.isVisible).sort((a, b) => a.priority - b.priority),

      // 공지사항
      addNotice: (notice) => set((state) => ({
        notices: [notice, ...state.notices]
      })),

      updateNotice: (id, updates) => set((state) => ({
        notices: state.notices.map((n) =>
          n.noticeId === id ? { ...n, ...updates } : n
        )
      })),

      deleteNotice: (id) => set((state) => ({
        notices: state.notices.filter((n) => n.noticeId !== id)
      })),

      getVisibleNotices: () => get().notices.filter((n) => n.isVisible),

      // FAQ
      addFAQ: (faq) => set((state) => ({
        faqs: [...state.faqs, faq]
      })),

      updateFAQ: (id, updates) => set((state) => ({
        faqs: state.faqs.map((f) =>
          f.faqId === id ? { ...f, ...updates } : f
        )
      })),

      deleteFAQ: (id) => set((state) => ({
        faqs: state.faqs.filter((f) => f.faqId !== id)
      })),

      getVisibleFAQs: () => get().faqs.filter((f) => f.isVisible).sort((a, b) => a.priority - b.priority),

      getHomeFeaturedFAQs: () => {
        const apiFaqs = get().faqs.filter((f) => f.isVisible && f.isHomeFeatured).sort((a, b) => a.priority - b.priority);
        // API에서 가져온 FAQ가 없으면 기본 FAQ 반환
        return apiFaqs.length > 0 ? apiFaqs : DEFAULT_HOME_FAQS;
      },

      getFAQsByCategory: (category) => {
        // API에서 불러온 faqsByCategory가 있으면 사용, 없으면 로컬 faqs 필터링
        const fromAPI = get().faqsByCategory[category];
        if (fromAPI && fromAPI.length > 0) {
          return fromAPI.filter(f => f.isVisible);
        }
        return get().faqs.filter((f) => f.isVisible && f.category === category);
      },
    }),
    {
      name: 'plic-content-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
