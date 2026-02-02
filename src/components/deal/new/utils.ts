// src/components/deal/new/utils.ts
// Phase 3.1: 거래 생성 위저드 유틸리티 분리

/**
 * File을 Base64 문자열로 변환
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Base64 문자열을 File 객체로 변환
 */
export const base64ToFile = (base64Data: string, fileName: string, mimeType: string): File => {
  const arr = base64Data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mimeType });
};

/**
 * 금액 포맷팅 (1000 -> "1,000")
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('ko-KR');
};

/**
 * 금액 문자열에서 숫자 추출 ("1,000" -> 1000)
 */
export const parseAmount = (amountStr: string): number => {
  return parseInt(amountStr.replace(/,/g, ''), 10) || 0;
};

/**
 * 계좌번호 마스킹 (123456789012 -> 1234****9012)
 */
export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length < 8) return accountNumber;
  const start = accountNumber.slice(0, 4);
  const end = accountNumber.slice(-4);
  return `${start}****${end}`;
};
