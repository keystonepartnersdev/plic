// src/app/api/content/banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${LAMBDA_URL}/content/banners`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403 || response.status === 404) {
      // Lambda not available, return empty data
      return NextResponse.json({ success: true, data: { banners: [] } }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[content/banners] Error:', error);
    return NextResponse.json({ success: true, data: { banners: [] } }, { status: 200 });
  }
}
