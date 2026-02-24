// src/lib/admin-proxy.ts
// Proxy utility for admin API routes to avoid CORS issues

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from './config';

const LAMBDA_URL = API_CONFIG.LAMBDA_URL;

export async function proxyAdminRequest(
  request: NextRequest,
  endpoint: string,
  options?: {
    method?: string;
    body?: unknown;
  }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    const method = options?.method || request.method;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    };

    if (options?.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    } else if (method !== 'GET' && request.body) {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON
      }
    }

    const url = `${LAMBDA_URL}${endpoint}`;
    console.log(`[Admin Proxy] ${method} ${url}`);

    const response = await fetch(url, fetchOptions);

    // If Lambda returns error, return mock/empty data
    if (response.status === 403 || response.status === 404) {
      console.log(`[Admin Proxy] Lambda returned ${response.status}, returning empty response`);
      return NextResponse.json({ success: true, data: [], count: 0 }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Admin Proxy] Error:', error);
    return NextResponse.json(
      { success: true, data: [], count: 0, error: 'Proxy error' },
      { status: 200 }
    );
  }
}
