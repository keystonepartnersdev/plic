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
  },
  {
    adminId: 'ADM002',
    email: 'admin@plic.kr',
    name: '플릭 관리자',
    role: 'super',
    status: 'active',
    isMaster: true,
    password: 'admin123',
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
      // 기존 계정의 비밀번호 업데이트 및 잠금 해제
      const idx = merged.findIndex(a => a.email === sample.email);
      merged[idx] = {
        ...merged[idx],
        password: sample.password,
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
      onRehydrateStorage: () => (state, error) => {
        // localStorage에서 복원 후 어드민 계정 병합 및 잠금 해제
        if (state && !error) {
          const mergedAdmins = mergeAndUnlockAdmins(state.adminList);
          // 직접 set 호출하여 상태 업데이트
          useAdminStore.setState({ adminList: mergedAdmins });
        }
      },
    }
  )
);

// 초기화 시 어드민 계정 병합 실행 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  const currentState = useAdminStore.getState();
  const mergedAdmins = mergeAndUnlockAdmins(currentState.adminList);
  useAdminStore.setState({ adminList: mergedAdmins });
}
