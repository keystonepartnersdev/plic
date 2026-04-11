/**
 * 결제 내역 프록시
 * GET /api/users/me/payments - 결제 내역 조회
 * POST /api/users/me/payments - 결제 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

async function proxyRequest(request: NextRequest, method: 'GET' | 'POST') {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('plic_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST') {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}/users/me/payments`, fetchOptions);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API Proxy] /users/me/payments ${method} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}
