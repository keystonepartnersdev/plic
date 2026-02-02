// src/stores/useAdminStore.ts
// Phase 1.1: 보안 강화 - 하드코딩된 비밀번호 제거 (2026-02-02)
// 모든 인증은 서버 사이드 API (adminAPI.login)를 통해 처리됨

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IAdmin, IAdminSession, TAdminRole } from '@/types';

interface IAdminState {
  admin: IAdminSession | null;
  isLoggedIn: boolean;
  adminList: IAdmin[];
  currentAdmin: IAdmin | null;

  // 인증 (서버 사이드 인증 후 세션 관리)
  login: (session: IAdminSession) => void;
  logout: () => void;
  setAdmin: (admin: IAdmin | null) => void;
  setAdminFromResponse: (adminData: any, token: string) => void;

  // 관리자 목록 관리 (서버에서 가져온 데이터)
  setAdminList: (admins: IAdmin[]) => void;
  addAdmin: (admin: IAdmin) => void;
  updateAdmin: (adminId: string, updates: Partial<IAdmin>) => void;
  deleteAdmin: (adminId: string) => void;
  getAdminById: (adminId: string) => IAdmin | undefined;

  // 권한 체크
  hasPermission: (permission: string) => boolean;
}

export const useAdminStore = create(
  persist<IAdminState>(
    (set, get) => ({
      admin: null,
      isLoggedIn: false,
      adminList: [],
      currentAdmin: null,

      // 서버 인증 후 세션 설정
      login: (session) => {
        set({ admin: session, isLoggedIn: true });
      },

      // 서버 API 응답으로 어드민 정보 설정
      setAdminFromResponse: (adminData, token) => {
        const admin: IAdmin = {
          adminId: adminData.adminId || adminData.id,
          email: adminData.email,
          name: adminData.name || '관리자',
          role: adminData.role || 'admin',
          status: adminData.status || 'active',
          isMaster: adminData.isMaster || false,
          loginFailCount: 0,
          isLocked: false,
          createdAt: adminData.createdAt || new Date().toISOString(),
          createdBy: adminData.createdBy || 'system',
          updatedAt: adminData.updatedAt || new Date().toISOString(),
        };

        const session: IAdminSession = {
          adminId: admin.adminId,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          token: token,
          loginAt: new Date().toISOString(),
        };

        set({
          admin: session,
          isLoggedIn: true,
          currentAdmin: admin
        });
      },

      logout: () => {
        // 토큰도 함께 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('plic_admin_token');
        }
        set({ admin: null, isLoggedIn: false, currentAdmin: null });
      },

      setAdmin: (admin) => {
        set({ currentAdmin: admin, isLoggedIn: !!admin });
      },

      // 서버에서 관리자 목록을 가져온 후 설정
      setAdminList: (admins) => set({ adminList: admins }),

      addAdmin: (admin) => set((state) => ({
        adminList: [...state.adminList, admin]
      })),

      updateAdmin: (adminId, updates) => set((state) => ({
        adminList: state.adminList.map((a) =>
          a.adminId === adminId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
        )
      })),

      deleteAdmin: (adminId) => set((state) => ({
        adminList: state.adminList.filter((a) => a.adminId !== adminId)
      })),

      getAdminById: (adminId) => get().adminList.find((a) => a.adminId === adminId),

      hasPermission: (permission) => {
        const admin = get().admin;
        if (!admin) return false;
        if (admin.role === 'super') return true;
        return admin.permissions?.includes(permission) || false;
      },
    }),
    {
      name: 'plic-admin-storage',
      storage: createJSONStorage(() => localStorage),
      version: 3, // 버전 업그레이드 - 하드코딩된 비밀번호 제거
      migrate: (persistedState: any, version: number) => {
        // 이전 버전에서 오는 경우 세션 초기화 (보안 강화)
        if (version < 3) {
          return {
            admin: null,
            isLoggedIn: false,
            adminList: [],
            currentAdmin: null,
          };
        }
        return persistedState;
      },
    }
  )
);
