// src/app/api/admin/analytics/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const endpoint = `/admin/analytics${searchParams ? `?${searchParams}` : ''}`;
  return proxyAdminRequest(request, endpoint);
}
