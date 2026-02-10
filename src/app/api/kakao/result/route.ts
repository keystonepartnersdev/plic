import { NextRequest, NextResponse } from 'next/server';
import { getVerificationResult } from '@/lib/kakao';
import { handleApiError, successResponse, Errors } from '@/lib/api-error';

/**
 * 카카오 본인인증 결과 조회
 * GET /api/kakao/result?key=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return Errors.inputMissingField('key').toResponse();
    }

    const result = await getVerificationResult(key);

    if (!result) {
      return Errors.notFound('인증 결과').toResponse();
    }

    // DynamoDB TTL로 자동 정리됨

    return successResponse(result);
  } catch (error: unknown) {
    console.error('인증 결과 조회 오류:', error);
    return handleApiError(error);
  }
}
