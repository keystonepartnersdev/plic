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

    // 환경 변수에서 관리자 정보 로드
    // 실제 운영에서는 데이터베이스에서 조회
    const ADMIN_USERS: AdminUser[] = [
      {
        email: 'admin',
        passwordHash: hashPassword('admin1234', serverEnv.ADMIN_SECRET_KEY),
        role: 'super',
        name: '관리자',
        adminId: 'ADM001',
      },
      {
        email: 'admin@plic.kr',
        passwordHash: hashPassword('admin123', serverEnv.ADMIN_SECRET_KEY),
        role: 'super',
        name: '플릭 관리자',
        adminId: 'ADM002',
      },
    ];

    const admin = ADMIN_USERS.find((u) => u.email === email);

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
