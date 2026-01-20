// backend/functions/uploads/presigned-url.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plic-uploads-prod';

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

// 최대 파일 크기 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'business-license' | 'contract' | 'bank-statement' | 'attachment' | 'temp';
  entityId?: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    // 요청 바디 파싱
    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      });
    }

    const body: PresignedUrlRequest = JSON.parse(event.body);
    const { fileName, fileType, fileSize, uploadType, entityId } = body;

    // 필수 필드 검증
    if (!fileName || !fileType || !fileSize || !uploadType) {
      return response(400, {
        success: false,
        error: '필수 필드가 누락되었습니다: fileName, fileType, fileSize, uploadType',
      });
    }

    // 인증 확인 (temp 업로드는 인증 불필요)
    const authHeader = event.headers.Authorization || event.headers.authorization;
    let uid: string | undefined;

    if (authHeader) {
      // JWT에서 사용자 ID 추출 시도 (Cognito authorizer에서 제공)
      const claims = event.requestContext.authorizer?.claims;
      uid = claims?.sub || claims?.['cognito:username'];
    }

    // temp, business-license 외에는 인증 필수
    if (uploadType !== 'temp' && uploadType !== 'business-license' && !uid) {
      return response(401, {
        success: false,
        error: '인증이 필요합니다.',
      });
    }

    // temp 업로드의 경우 anonymous ID 생성
    if (!uid) {
      uid = `anonymous-${uuidv4().slice(0, 8)}`;
    }

    // 파일 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return response(400, {
        success: false,
        error: `지원하지 않는 파일 형식입니다. 허용: ${ALLOWED_MIME_TYPES.join(', ')}`,
      });
    }

    // 파일 크기 검증
    if (fileSize > MAX_FILE_SIZE) {
      return response(400, {
        success: false,
        error: `파일 크기가 최대 허용 크기(${MAX_FILE_SIZE / 1024 / 1024}MB)를 초과합니다.`,
      });
    }

    // 업로드 경로 검증
    const pathTemplate = UPLOAD_PATH_MAP[uploadType];
    if (!pathTemplate) {
      return response(400, {
        success: false,
        error: `지원하지 않는 업로드 타입입니다: ${uploadType}`,
      });
    }

    // entityId 검증 (business-license, temp 제외)
    if (uploadType !== 'business-license' && uploadType !== 'temp' && !entityId) {
      return response(400, {
        success: false,
        error: 'entityId가 필요합니다.',
      });
    }

    // 파일 경로 생성
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    let filePath = pathTemplate
      .replace('{uid}', uid)
      .replace('{entityId}', entityId || '');

    const fileKey = `${filePath}/${uniqueFileName}`;

    // Presigned URL 생성
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

    const responseData: PresignedUrlResponse = {
      uploadUrl,
      fileKey,
      expiresIn,
    };

    return response(200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Presigned URL 생성 오류:', error);

    return response(500, {
      success: false,
      error: '파일 업로드 URL 생성에 실패했습니다.',
    });
  }
};
