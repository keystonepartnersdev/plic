// src/app/api/admin/business-analytics/route.ts
// Proxy API route for business analytics (CORS bypass)

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/admin/business-analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Business Analytics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business analytics' },
      { status: 500 }
    );
  }
}
