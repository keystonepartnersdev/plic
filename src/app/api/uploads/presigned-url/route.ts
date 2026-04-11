/**
 * 파일 업로드 Presigned URL 생성
 * POST /api/uploads/presigned-url
 *
 * Next.js API route에서 직접 S3 presigned URL을 생성합니다.
 * business-license 업로드는 인증 없이 허용 (회원가입 중 사용).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plic-attachments-804887692492';

const s3Client = new S3Client({ region: REGION });

// 허용되는 MIME 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

// 업로드 타입별 경로 매핑
const UPLOAD_PATH_MAP: Record<string, string> = {
  'business-license': 'users/{uid}/business-license',
  'contract': 'deals/{entityId}/contracts',
  'bank-statement': 'deals/{entityId}/bank-statements',
  'attachment': 'deals/{entityId}/attachments',
  'temp': 'temp',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('plic_access_token')?.value;

    const body = await request.json();
    const { fileName, fileType, fileSize, uploadType, entityId } = body;

    // business-license, temp 는 인증 없이 허용
    const isAuthFree = uploadType === 'business-license' || uploadType === 'temp';

    if (!accessToken && !isAuthFree) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    // 필수 필드 검증
    if (!fileName || !fileType || !fileSize || !uploadType) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '필수 필드가 누락되었습니다: fileName, fileType, fileSize, uploadType' } },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `지원하지 않는 파일 형식입니다.` } },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `파일 크기가 최대 허용 크기(50MB)를 초과합니다.` } },
        { status: 400 }
      );
    }

    // 업로드 경로 검증
    const pathTemplate = UPLOAD_PATH_MAP[uploadType];
    if (!pathTemplate) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `지원하지 않는 업로드 타입입니다: ${uploadType}` } },
        { status: 400 }
      );
    }

    // entityId 검증 (business-license, temp 제외)
    if (uploadType !== 'business-license' && uploadType !== 'temp' && !entityId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'entityId가 필요합니다.' } },
        { status: 400 }
      );
    }

    // uid 결정: 인증된 사용자 또는 anonymous
    const uid = accessToken ? `authenticated` : `anonymous-${uuidv4().slice(0, 8)}`;

    // 파일 경로 생성
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = pathTemplate
      .replace('{uid}', uid)
      .replace('{entityId}', entityId || '');
    const fileKey = `${filePath}/${uniqueFileName}`;

    // S3 Presigned URL 생성
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        'original-filename': encodeURIComponent(fileName),
        'uploaded-by': uid,
        'upload-type': uploadType,
      },
    });

    const expiresIn = 60 * 5; // 5분
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return NextResponse.json({
      success: true,
      data: { uploadUrl, fileKey, expiresIn },
    });
  } catch (error) {
    console.error('[API] /uploads/presigned-url POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
