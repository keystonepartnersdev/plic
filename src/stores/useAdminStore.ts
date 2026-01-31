// src/stores/useAdminStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IAdmin, IAdminSession, TAdminRole } from '@/types';

interface IAdminState {
  admin: IAdminSession | null;
  isLoggedIn: boolean;
  adminList: IAdmin[];
  currentAdmin: IAdmin | null;

  // 인증
  login: (session: IAdminSession) => void;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>; // ✅ Promise 반환
  logout: () => void;
  setAdmin: (admin: IAdmin | null) => void;

  // 관리자 목록 관리
  addAdmin: (admin: IAdmin) => void;
  updateAdmin: (adminId: string, updates: Partial<IAdmin>) => void;
  deleteAdmin: (adminId: string) => void;
  getAdminById: (adminId: string) => IAdmin | undefined;

  // 권한 체크
  hasPermission: (permission: string) => boolean;
}

// ✅ 비밀번호 필드 제거 (서버 측 인증으로 변경)
const sampleAdmins: IAdmin[] = [
  {
    adminId: 'ADM001',
    email: 'admin',
    name: '관리자',
    role: 'super',
    status: 'active',
    isMaster: true,
    // password 필드 제거됨
    loginFailCount: 0,
    isLocked: false,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    updatedAt: new Date().toISOString(),
  },
  {
    adminId: 'ADM002',
    email: 'admin@plic.kr',
    name: '플릭 관리자',
    role: 'super',
    status: 'active',
    isMaster: true,
    // password 필드 제거됨
    loginFailCount: 0,
    isLocked: false,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    updatedAt: new Date().toISOString(),
  }
];

// 스토어 초기화 시 어드민 계정 병합 및 잠금 해제
const mergeAndUnlockAdmins = (existingAdmins: IAdmin[]): IAdmin[] => {
  const merged = [...existingAdmins];

  // sampleAdmins에 있는 계정이 기존에 없으면 추가
  for (const sample of sampleAdmins) {
    const existing = merged.find(a => a.email === sample.email);
    if (!existing) {
      merged.push(sample);
    } else {
      // 기존 계정 잠금 해제
      const idx = merged.findIndex(a => a.email === sample.email);
      merged[idx] = {
        ...merged[idx],
        isLocked: false,
        loginFailCount: 0,
        status: 'active',
      };
    }
  }

  return merged;
};

export const useAdminStore = create(
  persist<IAdminState>(
    (set, get) => ({
      admin: null,
      isLoggedIn: false,
      adminList: sampleAdmins,
      currentAdmin: null,

      login: (session) => {
        const adminData = get().adminList.find(a => a.adminId === session.adminId);
        set({ admin: session, isLoggedIn: true, currentAdmin: adminData || null });
      },

      loginWithCredentials: async (email, password) => {
        try {
          // ✅ 서버 측 API 호출로 인증 처리
          const response = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            console.error('Admin login failed:', response.statusText);
            return false;
          }

          const { token, admin } = await response.json();

          // 토큰 저장
          localStorage.setItem('adminToken', token);

          // 관리자 정보 업데이트
          set({ currentAdmin: admin, isLoggedIn: true });

          return true;
        } catch (error) {
          console.error('Admin authentication error:', error);
          return false;
        }
      },

      logout: () => {
        set({ admin: null, isLoggedIn: false, currentAdmin: null });
      },

      setAdmin: (admin) => {
        set({ currentAdmin: admin, isLoggedIn: !!admin });
      },

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
      version: 2, // 버전 업그레이드 - 기존 데이터 마이그레이션
      migrate: (persistedState: any, version: number) => {
        // 버전 1 이하에서 오는 경우 어드민 계정 초기화
        if (version < 2) {
          return {
            ...persistedState,
            adminList: sampleAdmins,
            isLoggedIn: false,
            admin: null,
            currentAdmin: null,
          };
        }
        return persistedState;
      },
    }
  )
);
