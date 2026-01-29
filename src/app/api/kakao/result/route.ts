import { NextRequest, NextResponse } from 'next/server';
import { getVerificationResult, deleteVerificationResult } from '@/lib/kakao';

/**
 * 카카오 본인인증 결과 조회
 * GET /api/kakao/result?key=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: '인증 키가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await getVerificationResult(key);

    if (!result) {
      return NextResponse.json(
        { error: '인증 결과를 찾을 수 없거나 만료되었습니다.' },
        { status: 404 }
      );
    }

    // DynamoDB TTL로 자동 정리됨

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('인증 결과 조회 오류:', error);
    return NextResponse.json(
      { error: '인증 결과 조회에 실패했습니다.', message: error.message },
      { status: 500 }
    );
  }
}
