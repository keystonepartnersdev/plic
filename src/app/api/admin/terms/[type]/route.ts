// src/app/api/admin/terms/[type]/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  return proxyAdminRequest(request, `/admin/terms/${type}`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  return proxyAdminRequest(request, `/admin/terms/${type}`, { method: 'PUT' });
}
