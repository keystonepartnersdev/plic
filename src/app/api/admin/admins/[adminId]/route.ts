// src/app/api/admin/admins/[adminId]/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  return proxyAdminRequest(request, `/admin/admins/${adminId}`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  return proxyAdminRequest(request, `/admin/admins/${adminId}`, { method: 'PUT' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  return proxyAdminRequest(request, `/admin/admins/${adminId}`, { method: 'DELETE' });
}
