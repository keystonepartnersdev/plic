// src/app/api/admin/banners/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const endpoint = `/admin/banners${searchParams ? `?${searchParams}` : ''}`;
  return proxyAdminRequest(request, endpoint);
}

export async function POST(request: NextRequest) {
  return proxyAdminRequest(request, '/admin/banners', { method: 'POST' });
}
