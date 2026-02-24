// src/app/api/content/terms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${LAMBDA_URL}/content/terms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403 || response.status === 404) {
      return NextResponse.json({ success: true, data: { terms: [] } }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[content/terms] Error:', error);
    return NextResponse.json({ success: true, data: { terms: [] } }, { status: 200 });
  }
}
