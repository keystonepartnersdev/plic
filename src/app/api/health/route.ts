// src/app/api/health/route.ts
// 헬스체크 엔드포인트

import { NextResponse } from 'next/server';
import { APP_CONFIG, API_CONFIG } from '@/lib/config';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  environment: string;
  services: {
    frontend: 'ok' | 'error';
    backend?: 'ok' | 'error' | 'unknown';
  };
  uptime?: number;
}

// 서버 시작 시간 기록
const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const status: HealthStatus = {
    status: 'healthy',
    version: APP_CONFIG.APP_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      frontend: 'ok',
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // 백엔드 헬스체크 (선택적)
  try {
    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });

    status.services.backend = backendResponse.ok ? 'ok' : 'error';

    if (!backendResponse.ok) {
      status.status = 'degraded';
    }
  } catch {
    status.services.backend = 'unknown';
    // 백엔드 실패해도 프론트엔드는 정상
  }

  return NextResponse.json(status, {
    status: status.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
