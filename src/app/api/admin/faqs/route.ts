// src/app/api/admin/faqs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/admin/faqs${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(`${LAMBDA_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    if (response.status === 403 || response.status === 404) {
      return NextResponse.json({ success: true, data: { faqs: [], count: 0 } }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[FAQ API] GET error:', error);
    return NextResponse.json({ success: true, data: { faqs: [], count: 0 } }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    let body;
    try {
      body = await request.json();
    } catch {
      // no body
    }

    const response = await fetch(`${LAMBDA_URL}/admin/faqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[FAQ API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'FAQ 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
