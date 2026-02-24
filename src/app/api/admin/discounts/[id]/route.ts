// src/app/api/admin/discounts/[id]/route.ts
import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '@/lib/admin-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/discounts/${id}`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/discounts/${id}`, { method: 'PUT' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/discounts/${id}`, { method: 'DELETE' });
}
