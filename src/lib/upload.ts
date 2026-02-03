// src/lib/upload.ts

import { uploadsAPI } from './api';

export type UploadType = 'business-license' | 'contract' | 'bank-statement' | 'attachment' | 'temp';

export interface UploadResult {
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
}

/**
 * 단일 파일을 S3에 업로드
 */
export async function uploadFile(
  file: File,
  uploadType: UploadType,
  entityId?: string,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    // 1. Presigned URL 요청
    const { uploadUrl, fileKey } = await uploadsAPI.getPresignedUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadType,
      entityId,
    });

    // 2. S3에 직접 업로드
    await uploadToS3(uploadUrl, file, options);

    // 3. 결과 반환
    return {
      fileKey,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  } catch (error) {
    const uploadError = error instanceof Error ? error : new Error('파일 업로드에 실패했습니다.');
    options?.onError?.(uploadError);
    throw uploadError;
  }
}

/**
 * 여러 파일을 병렬로 S3에 업로드
 */
export async function uploadMultipleFiles(
  files: File[],
  uploadType: UploadType,
  entityId?: string,
  options?: {
    onProgress?: (fileIndex: number, progress: UploadProgress) => void;
    onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    onError?: (fileIndex: number, error: Error) => void;
  }
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const errors: { index: number; error: Error }[] = [];

  // 병렬 업로드 (최대 3개씩)
  const batchSize = 3;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map((file, batchIndex) => {
      const fileIndex = i + batchIndex;
      return uploadFile(file, uploadType, entityId, {
        onProgress: (progress) => options?.onProgress?.(fileIndex, progress),
      })
        .then((result) => {
          options?.onFileComplete?.(fileIndex, result);
          return result;
        })
        .catch((error: Error): null => {
          options?.onError?.(fileIndex, error);
          errors.push({ index: fileIndex, error });
          return null;
        });
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is UploadResult => r !== null));
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`모든 파일 업로드에 실패했습니다.`);
  }

  return results;
}

/**
 * S3 Presigned URL로 파일 업로드
 */
async function uploadToS3(
  presignedUrl: string,
  file: File,
  options?: UploadOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 진행률 추적
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    // 완료 처리
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`));
      }
    });

    // 에러 처리
    xhr.addEventListener('error', () => {
      reject(new Error('네트워크 오류로 업로드에 실패했습니다.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('업로드가 취소되었습니다.'));
    });

    // 요청 시작
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * S3 파일 URL 생성 (공개 URL 또는 서명된 URL 필요)
 */
export function getS3FileUrl(fileKey: string): string {
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'plic-uploads-prod';
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2';
  return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
}

/**
 * 파일 확장자 검증
 */
export function isAllowedFileType(file: File): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ];
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기 검증 (기본 50MB)
 */
export function isAllowedFileSize(file: File, maxSizeBytes = 50 * 1024 * 1024): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * 파일 검증 (타입 + 크기)
 */
export function validateFile(
  file: File,
  maxSizeBytes = 50 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!isAllowedFileType(file)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WEBP, HEIC, PDF만 허용)',
    };
  }

  if (!isAllowedFileSize(file, maxSizeBytes)) {
    const maxSizeMB = Math.round(maxSizeBytes / 1024 / 1024);
    return {
      valid: false,
      error: `파일 크기가 ${maxSizeMB}MB를 초과합니다.`,
    };
  }

  return { valid: true };
}
