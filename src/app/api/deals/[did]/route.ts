/**
 * 거래 상세 조회/수정/취소
 * GET /api/deals/[did] - 거래 상세 조회 (Lambda 프록시)
 * PUT /api/deals/[did] - 거래 수정 (Lambda 프록시 - /admin/deals/{did}/update)
 * DELETE /api/deals/[did] - 거래 취소 (Lambda 프록시)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

async function proxyToLambda(
  request: NextRequest,
  method: 'GET' | 'DELETE',
  did: string
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('plic_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
      { status: 401 }
    );
  }

  const response = await fetch(`${API_BASE_URL}/deals/${did}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    return await proxyToLambda(request, 'GET', did);
  } catch (error) {
    console.error(`[API] GET /deals/${did} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('plic_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(`[API] PUT /deals/${did} body:`, JSON.stringify(body));

    // Lambda 백엔드의 /admin/deals/{did}/update 호출
    const updateResponse = await fetch(`${API_BASE_URL}/admin/deals/${did}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const updateData = await updateResponse.json();
    console.log(`[API] PUT /deals/${did} Lambda response:`, updateResponse.status, JSON.stringify(updateData));

    return NextResponse.json(updateData, { status: updateResponse.status });
  } catch (error) {
    console.error(`[API] PUT /deals/${did} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    return await proxyToLambda(request, 'DELETE', did);
  } catch (error) {
    console.error(`[API] DELETE /deals/${did} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
