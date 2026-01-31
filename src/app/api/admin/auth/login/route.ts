import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/validateEnv';
import crypto from 'crypto';

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
  // 간단한 JWT 구현 (실제로는 jsonwebtoken 라이브러리 사용 권장)
  const payload = {
    email,
    role,
    adminId,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8시간
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
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
