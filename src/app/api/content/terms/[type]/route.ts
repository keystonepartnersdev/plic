// src/app/api/content/terms/[type]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    const response = await fetch(`${LAMBDA_URL}/content/terms/${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403 || response.status === 404) {
      return NextResponse.json({ success: false, error: 'Terms not found' }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[content/terms/[type]] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
