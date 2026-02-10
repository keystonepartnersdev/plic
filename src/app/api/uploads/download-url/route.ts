/**
 * S3 파일 다운로드/조회용 Presigned URL 생성
 * POST /api/uploads/download-url
 *
 * 어드민(Bearer 토큰) 또는 로그인 유저(쿠키)가 S3 파일을 조회/다운로드할 때 사용합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plic-uploads-prod';

const s3Client = new S3Client({ region: REGION });

export async function POST(request: NextRequest) {
  try {
    // 인증 확인: 어드민 토큰 또는 유저 쿠키
    const authHeader = request.headers.get('Authorization');
    const adminToken = authHeader?.replace('Bearer ', '');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('plic_access_token')?.value;

    if (!adminToken && !accessToken) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileKey } = body;

    if (!fileKey) {
      return NextResponse.json(
        { success: false, error: 'fileKey가 필요합니다.' },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const expiresIn = 60 * 30; // 30분
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return NextResponse.json({
      success: true,
      data: { downloadUrl, expiresIn },
    });
  } catch (error) {
    console.error('[API] /uploads/download-url POST error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
