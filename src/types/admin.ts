// src/types/admin.ts

export type TAdminRole = 'super' | 'operator' | 'cs';
export type TAdminStatus = 'active' | 'inactive' | 'suspended';

export interface IAdmin {
  adminId: string;
  email: string;
  name: string;
  phone?: string;
  role: TAdminRole;
  status: TAdminStatus;
  isMaster: boolean;  // 마스터 계정 여부 (삭제 불가)
  loginFailCount: number;
  isLocked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface IAdminSession {
  adminId: string;
  email: string;
  name: string;
  role: TAdminRole;
  token: string;       // JWT 토큰
  permissions?: string[];
  loginAt: string;
  expiresAt?: string;
}
