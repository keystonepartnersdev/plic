import { NextRequest, NextResponse } from 'next/server';
import { logError } from '../errorHandler';
import jwt from 'jsonwebtoken';

/**
 * JWT 토큰 페이로드 인터페이스
 */
interface TokenPayload {
  userId?: string;
  email?: string;
  role?: string;
  adminId?: string;
  exp: number;
}

/**
 * JWT 토큰 검증 미들웨어
 *
 * @param request - Next.js API 요청
 * @param handler - 인증 성공 시 실행할 핸들러 (userId 전달)
 * @returns API 응답
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  try {
    const userId = await verifyToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }

    // 인증 성공 - 원래 핸들러 실행
    return await handler(request, userId);
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { error: 'Unauthorized: Token verification failed' },
      { status: 401 }
    );
  }
}

/**
 * 관리자 인증 미들웨어
 *
 * @param request - Next.js API 요청
 * @param handler - 인증 성공 시 실행할 핸들러 (adminId, role 전달)
 * @returns API 응답
 */
export async function requireAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, adminId: string, role: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyAdminToken(token);

    if (!payload || !payload.adminId || !payload.role) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin token' },
        { status: 401 }
      );
    }

    // 관리자 인증 성공
    return await handler(request, payload.adminId, payload.role);
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return NextResponse.json(
      { error: 'Unauthorized: Admin token verification failed' },
      { status: 401 }
    );
  }
}

/**
 * 일반 사용자 토큰 검증
 *
 * @param token - JWT 토큰
 * @returns userId or null
 */
async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }

    // ✅ Proper JWT signature verification
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // 토큰 만료는 jwt.verify()가 자동으로 확인
    return decoded.userId || null;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token signature:', error.message);
    } else {
      console.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * 관리자 토큰 검증
 *
 * @param token - JWT 토큰
 * @returns TokenPayload or null
 */
async function verifyAdminToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.ADMIN_JWT_SECRET;

    if (!secret) {
      console.error('ADMIN_JWT_SECRET is not defined in environment variables');
      return null;
    }

    // ✅ Proper JWT signature verification for admin tokens
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // 관리자 토큰 확인
    if (!decoded.adminId || !decoded.role) {
      console.warn('Invalid admin token: missing adminId or role');
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('Admin token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid admin token signature:', error.message);
    } else {
      console.error('Admin token verification error:', error);
    }
    return null;
  }
}

/**
 * 선택적 인증 (토큰이 있으면 userId 반환, 없으면 null)
 *
 * @param request - Next.js API 요청
 * @returns userId or null
 */
export async function optionalAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    return await verifyToken(token);
  } catch (error) {
    logError(error, 'optionalAuth');
    return null;
  }
}
