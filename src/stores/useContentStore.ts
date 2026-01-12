// src/stores/useContentStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IHomeBanner, INotice, IFAQ } from '@/types';

interface IContentState {
  banners: IHomeBanner[];
  notices: INotice[];
  faqs: IFAQ[];

  // 배너
  addBanner: (banner: IHomeBanner) => void;
  updateBanner: (id: string, updates: Partial<IHomeBanner>) => void;
  deleteBanner: (id: string) => void;
  getVisibleBanners: () => IHomeBanner[];

  // 공지사항
  addNotice: (notice: INotice) => void;
  updateNotice: (id: string, updates: Partial<INotice>) => void;
  deleteNotice: (id: string) => void;
  getVisibleNotices: () => INotice[];

  // FAQ
  addFAQ: (faq: IFAQ) => void;
  updateFAQ: (id: string, updates: Partial<IFAQ>) => void;
  deleteFAQ: (id: string) => void;
  getVisibleFAQs: () => IFAQ[];
  getHomeFeaturedFAQs: () => IFAQ[];
  getFAQsByCategory: (category: string) => IFAQ[];
}

export const useContentStore = create(
  persist<IContentState>(
    (set, get) => ({
      banners: [],
      notices: [],
      faqs: [],

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

      getHomeFeaturedFAQs: () => get().faqs.filter((f) => f.isVisible && f.isHomeFeatured).sort((a, b) => a.priority - b.priority),

      getFAQsByCategory: (category) => get().faqs.filter((f) => f.isVisible && f.category === category),
    }),
    {
      name: 'plic-content-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
