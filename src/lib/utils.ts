import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @example formatPrice(1000000) => "1,000,000"
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/**
 * 현재 시간을 ISO 문자열로 반환
 */
export function getNow(): string {
  return new Date().toISOString();
}

/**
 * ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 * @example formatDate("2024-01-15T09:00:00Z") => "2024.01.15"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * ISO 날짜 문자열을 YYYY.MM.DD HH:mm 형식으로 변환
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ============================================
// Phase 4: 추가 유틸리티 함수
// ============================================

/**
 * 전화번호 포맷팅 (01012345678 -> 010-1234-5678)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * 계좌번호 마스킹 (123456789012 -> 1234****9012)
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 8) return accountNumber;
  const start = accountNumber.slice(0, 4);
  const end = accountNumber.slice(-4);
  return `${start}****${end}`;
}

/**
 * 사업자등록번호 포맷팅 (1234567890 -> 123-45-67890)
 */
export function formatBusinessNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return num;
}

/**
 * 금액을 한글로 변환 (10000 -> "1만원")
 */
export function formatPriceKorean(amount: number): string {
  if (amount >= 100000000) {
    const billions = Math.floor(amount / 100000000);
    const millions = Math.floor((amount % 100000000) / 10000);
    return millions > 0 ? `${billions}억 ${millions.toLocaleString()}만원` : `${billions}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

/**
 * 문자열 말줄임 (긴 텍스트를 지정 길이로 자름)
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * 빈 값 체크 (null, undefined, 빈 문자열)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * File을 Base64 문자열로 변환
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Base64 문자열을 File 객체로 변환
 */
export function base64ToFile(base64Data: string, fileName: string, mimeType: string): File {
  const arr = base64Data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mimeType });
}

/**
 * unknown 타입 에러에서 메시지 추출
 * TypeScript strict 모드 호환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
