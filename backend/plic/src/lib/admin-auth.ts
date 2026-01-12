import * as crypto from 'crypto';
import { getItem, queryItems, Tables } from './dynamodb';
import { IAdmin } from '../types';

// 비밀번호 해시
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 비밀번호 검증
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// 간단한 JWT 생성 (실제 운영에서는 jsonwebtoken 사용 권장)
export function generateAdminToken(admin: IAdmin): string {
  const payload = {
    adminId: admin.adminId,
    email: admin.email,
    role: admin.role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24시간
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', 'plic-admin-secret').update(base64).digest('hex');
  return `${base64}.${signature}`;
}

// 관리자 토큰 검증
export function verifyAdminToken(token: string): { adminId: string; email: string; role: string } | null {
  try {
    const [base64, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', 'plic-admin-secret').update(base64).digest('hex');
    
    if (signature !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// Authorization 헤더에서 토큰 추출
export function extractAdminToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}

// 관리자 조회
export async function getAdminFromToken(authHeader?: string): Promise<IAdmin | null> {
  const token = extractAdminToken(authHeader);
  if (!token) return null;

  const payload = verifyAdminToken(token);
  if (!payload) return null;

  const admin = await getItem<IAdmin>(Tables.ADMINS, { adminId: payload.adminId });
  return admin;
}
