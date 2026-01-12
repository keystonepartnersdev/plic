// src/classes/AdminHelper.ts

import { IAdmin, TAdminRole } from '@/types/admin';

interface IRoleConfig {
  name: string;
  description: string;
  permissions: string[];
}

export class AdminHelper {
  // 역할별 권한 설정
  static ROLE_CONFIG: Record<TAdminRole, IRoleConfig> = {
    super: {
      name: '슈퍼관리자',
      description: '모든 기능에 대한 접근 권한',
      permissions: [
        'admin.view', 'admin.create', 'admin.edit', 'admin.delete',
        'settings.view', 'settings.edit',
        'user.view', 'user.edit', 'user.delete',
        'deal.view', 'deal.approve', 'deal.reject',
        'code.view', 'code.create', 'code.edit', 'code.delete',
        'content.view', 'content.banner.manage', 'content.notice.manage', 'content.faq.manage',
        'inquiry.view', 'inquiry.reply',
      ],
    },
    operator: {
      name: '운영팀',
      description: '일상적인 운영 업무 담당',
      permissions: [
        'user.view', 'user.edit',
        'deal.view', 'deal.approve', 'deal.reject',
        'code.view', 'code.create', 'code.edit',
        'content.view', 'content.banner.manage', 'content.notice.manage', 'content.faq.manage',
        'inquiry.view', 'inquiry.reply',
      ],
    },
    cs: {
      name: 'CS팀',
      description: '고객 문의 응대 담당',
      permissions: [
        'user.view',
        'deal.view',
        'inquiry.view', 'inquiry.reply',
      ],
    },
  };

  // 마스터 계정 정보
  static MASTER_ADMIN: IAdmin = {
    adminId: 'MASTER',
    email: 'admin',
    name: '마스터관리자',
    phone: '',
    role: 'super',
    status: 'active',
    isMaster: true,
    password: 'admin',
    loginFailCount: 0,
    isLocked: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  // Admin ID 생성
  static generateAdminId(): string {
    return `ADM${Date.now().toString(36).toUpperCase()}`;
  }

  // 권한 체크
  static hasPermission(role: TAdminRole, permission: string): boolean {
    return this.ROLE_CONFIG[role].permissions.includes(permission);
  }

  // 역할별 설정 반환
  static getRoleConfig(role: TAdminRole): IRoleConfig {
    return this.ROLE_CONFIG[role];
  }

  // 비밀번호 유효성 검사
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push('비밀번호는 8자 이상이어야 합니다.');
    if (!/[A-Z]/.test(password)) errors.push('대문자를 포함해야 합니다.');
    if (!/[a-z]/.test(password)) errors.push('소문자를 포함해야 합니다.');
    if (!/[0-9]/.test(password)) errors.push('숫자를 포함해야 합니다.');
    if (!/[!@#$%^&*]/.test(password)) errors.push('특수문자를 포함해야 합니다.');
    return { valid: errors.length === 0, errors };
  }

  // 신규 어드민 생성
  static createNewAdmin(
    email: string,
    name: string,
    role: TAdminRole,
    password: string,
    createdBy: string,
    phone?: string
  ): IAdmin {
    const now = new Date().toISOString();
    return {
      adminId: this.generateAdminId(),
      email,
      name,
      phone,
      role,
      status: 'active',
      isMaster: false,
      password,
      loginFailCount: 0,
      isLocked: false,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }
}
