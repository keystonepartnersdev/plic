// src/app/api/admin/deals/[did]/status/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  return proxyAdminRequest(request, `/admin/deals/${did}/status`, { method: 'PUT' });
}
