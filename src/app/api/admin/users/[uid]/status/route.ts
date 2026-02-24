// src/app/api/admin/users/[uid]/status/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  return proxyAdminRequest(request, `/admin/users/${uid}/status`, { method: 'PUT' });
}
