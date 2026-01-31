import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/validateEnv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * 관리자 로그인 API
 *
 * 보안 설계:
 * 1. 비밀번호는 환경 변수에서 해시값으로 저장
 * 2. JWT 토큰 발급 (유효기간 8시간)
 * 3. Rate Limiting (IP당 분당 5회) - TODO: 추후 구현
 */

interface AdminUser {
  email: string;
  passwordHash: string;
  role: 'super' | 'manager' | 'viewer';
  name: string;
  adminId: string;
}

function hashPassword(password: string, secretKey: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(password)
    .digest('hex');
}

function generateToken(email: string, role: string, adminId: string): string {
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET is not defined in environment variables');
  }

  // ✅ Proper JWT with signature
  const payload = {
    email,
    role,
    adminId,
  };

  // exp는 jwt.sign()의 expiresIn 옵션으로 자동 처리
  return jwt.sign(payload, secret, {
    expiresIn: '8h', // 8시간
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const serverEnv = getServerEnv();

    // ✅ 환경 변수에서 관리자 정보 로드 (하드코딩 제거)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminName = process.env.ADMIN_NAME || 'Administrator';
    const adminId = process.env.ADMIN_ID || 'ADM001';
    const adminRole = (process.env.ADMIN_ROLE as 'super' | 'manager' | 'viewer') || 'super';

    if (!adminEmail || !adminPasswordHash) {
      console.error('Admin credentials not configured in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const admin: AdminUser | null =
      email === adminEmail
        ? {
            email: adminEmail,
            passwordHash: adminPasswordHash,
            role: adminRole,
            name: adminName,
            adminId: adminId,
          }
        : null;

    if (!admin || hashPassword(password, serverEnv.ADMIN_SECRET_KEY) !== admin.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(admin.email, admin.role, admin.adminId);

    return NextResponse.json({
      token,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        adminId: admin.adminId,
        status: 'active',
        isMaster: true,
        loginFailCount: 0,
        isLocked: false,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
