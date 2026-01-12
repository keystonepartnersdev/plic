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
  loginWithCredentials: (email: string, password: string) => boolean;
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

const sampleAdmins: IAdmin[] = [
  {
    adminId: 'ADM001',
    email: 'admin',
    name: '관리자',
    role: 'super',
    status: 'active',
    isMaster: true,
    password: 'admin1234',
    loginFailCount: 0,
    isLocked: false,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    updatedAt: new Date().toISOString(),
  }
];

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

      loginWithCredentials: (email, password) => {
        const admin = get().adminList.find(a => a.email === email);
        if (!admin) return false;
        if (admin.status !== 'active') return false;
        if (admin.isLocked) return false;
        if (admin.password !== password) return false;

        set({ currentAdmin: admin, isLoggedIn: true });
        return true;
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
    }
  )
);
