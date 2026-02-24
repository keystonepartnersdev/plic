// src/app/api/content/notices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/content/notices${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(`${LAMBDA_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403 || response.status === 404) {
      return NextResponse.json({ success: true, data: { notices: [], total: 0 } }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[content/notices] Error:', error);
    return NextResponse.json({ success: true, data: { notices: [], total: 0 } }, { status: 200 });
  }
}
