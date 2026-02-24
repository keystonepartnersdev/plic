// src/app/api/admin/api-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const endpoint = `/admin/api-logs${searchParams ? `?${searchParams}` : ''}`;
  return proxyAdminRequest(request, endpoint);
}
