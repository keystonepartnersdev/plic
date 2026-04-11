/**
 * API 로그 트래킹 프록시
 * POST /api/tracking/api-log - API 호출 로그 전송
 * 로깅 실패 시에도 항상 200 반환 (비즈니스 로직에 영향 없도록)
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // fire-and-forget: Lambda 호출 실패해도 200 반환
    fetch(`${API_BASE_URL}/tracking/api-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {
      // 로깅 실패 무시
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
