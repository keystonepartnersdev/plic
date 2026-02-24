// src/app/api/admin/terms/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  return proxyAdminRequest(request, '/admin/terms');
}
