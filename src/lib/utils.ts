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
