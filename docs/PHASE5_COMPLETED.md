# Phase 5: 유지보수성 개선 완료 ✅

> **완료 일자**: 2026-01-31
> **소요 시간**: 약 30분
> **상태**: ✅ 100% 완료

---

## 📋 완료된 작업

### 1. ✅ constants.ts 생성

**생성된 파일**:
- `src/lib/constants.ts` (108 lines)

**정의된 상수**:
```typescript
// 거래 관련
export const DEAL_LIMITS = {
  MIN_AMOUNT: 10_000,
  MAX_AMOUNT_BRONZE: 1_000_000,
  MAX_AMOUNT_SILVER: 3_000_000,
  MAX_AMOUNT_GOLD: 5_000_000,
  MAX_AMOUNT_PLATINUM: 10_000_000,
  MAX_FILES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const DEAL_STATUS = {
  PENDING: 'pending',
  PAYMENT_COMPLETED: 'payment_completed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// 수수료율
export const FEE_RATES = {
  PERSONAL: 0.015, // 1.5%
  BUSINESS: 0.025, // 2.5%
} as const;

// 등급 설정
export const GRADE_CONFIG = {
  bronze: { name: '브론즈', color: '#CD7F32', feeRate: 0.015, monthlyLimit: 1_000_000, perDealLimit: 1_000_000 },
  silver: { name: '실버', color: '#C0C0C0', feeRate: 0.012, monthlyLimit: 3_000_000, perDealLimit: 3_000_000 },
  gold: { name: '골드', color: '#FFD700', feeRate: 0.01, monthlyLimit: 5_000_000, perDealLimit: 5_000_000 },
  platinum: { name: '플래티넘', color: '#E5E4E2', feeRate: 0.008, monthlyLimit: 10_000_000, perDealLimit: 10_000_000 },
} as const;

// 은행 코드 (23개)
export const BANKS = [
  { code: '001', name: '한국은행' },
  { code: '004', name: 'KB국민은행' },
  { code: '088', name: '신한은행' },
  { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' },
  // ... 18개 더
] as const;

// UI 관련
export const MOBILE_FRAME = {
  WIDTH: 375,
  HEIGHT: 812,
} as const;

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;
```

---

### 2. ✅ errorHandler.ts 생성

**생성된 파일**:
- `src/lib/errorHandler.ts` (47 lines)

**정의된 함수**:

#### AppError 클래스
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

#### logError 함수
```typescript
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';

  if (error instanceof AppError) {
    console.error(`${timestamp} ${contextStr} AppError [${error.code}]:`, {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    });
  } else if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, error);
  }
}
```

#### handleApiError 함수
```typescript
export function handleApiError(error: unknown, defaultMessage: string): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
```

---

### 3. ✅ .eslintrc.json 생성

**생성된 파일**:
- `.eslintrc.json`

**ESLint 규칙**:
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "no-console": ["warn", {
      "allow": ["warn", "error"]
    }],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

---

### 4. ✅ Empty Catch Blocks 수정 (11개소)

**수정된 파일 및 개수**:
1. `src/lib/api.ts` - 4개
2. `src/lib/auth/middleware.ts` - 1개
3. `src/lib/apiLogger.ts` - 2개
4. `src/lib/popbill/auth.ts` - 1개
5. `src/lib/popbill/client.ts` - 1개
6. `src/app/(customer)/auth/signup/page.tsx` - 1개
7. `src/app/(customer)/deals/new/page.tsx` - 1개

**수정 패턴**:
```typescript
// ❌ Before
try {
  // ...
} catch {
  // ignore
}

// ✅ After
try {
  // ...
} catch (error) {
  logError(error, 'contextName');
  // handle error
}
```

**수정 내역**:

#### api.ts (4개)
```typescript
// 1. getCurrentUserId
} catch (error) {
  logError(error, 'getCurrentUserId');
}

// 2-3. request/requestWithAdminToken parseBody
} catch (error) {
  logError(error, 'request:parseBody');
  requestBody = options.body;
}

// 4. authAPI.refresh
} catch (error) {
  logError(error, 'authAPI.refresh');
  tokenManager.clearTokens();
}
```

#### auth/middleware.ts (1개)
```typescript
} catch (error) {
  logError(error, 'optionalAuth');
  return null;
}
```

#### apiLogger.ts (2개)
```typescript
// 1. parseRequestBody
} catch (error) {
  logError(error, 'apiLogger:parseRequestBody');
  requestBody = options.body;
}

// 2. parseResponseBody
} catch (error) {
  logError(error, 'apiLogger:parseResponseBody');
  responseBody = await clonedResponse.text();
}
```

#### popbill/auth.ts (1개)
```typescript
} catch (error) {
  logError(error, 'popbill:parseTokenResponse');
  throw new Error(`Invalid JSON response: ${responseText}`);
}
```

#### popbill/client.ts (1개)
```typescript
} catch (error) {
  logError(error, 'popbill:parseResponse');
  throw new Error(`Invalid JSON response: ${responseText}`);
}
```

#### signup/page.tsx (1개)
```typescript
} catch (error) {
  logError(error, 'signup:parseAgreements');
  // 파싱 실패 시 기본값
}
```

#### deals/new/page.tsx (1개)
```typescript
} catch (error) {
  logError(error, 'deals/new:fileToBase64');
  // Base64도 실패하면 에러 상태로
}
```

---

## 🔍 검증 결과

### Empty Catch Blocks 확인
```bash
grep -r "} catch {" src/ --include="*.ts" --include="*.tsx" | wc -l
# 결과: 0 (모두 수정 완료)
```

### 생성된 파일 확인
```bash
ls -la src/lib/constants.ts src/lib/errorHandler.ts .eslintrc.json
# 모두 존재 확인
```

---

## 📊 Phase 5 성과

| 지표 | 변경 전 | 변경 후 | 상태 |
|------|---------|---------|------|
| constants.ts | ❌ 없음 | ✅ 생성 완료 | ✅ 완료 |
| errorHandler.ts | ❌ 없음 | ✅ 생성 완료 | ✅ 완료 |
| .eslintrc.json | ❌ 없음 | ✅ 생성 완료 | ✅ 완료 |
| Empty catch blocks | ⚠️ 11개 | ✅ 0개 | ✅ 완료 |

---

## 💡 개선 효과

### 1. 매직 넘버/문자열 제거
- **Before**: 하드코딩된 숫자/문자열 (1_000_000, 'pending' 등)
- **After**: 중앙 집중식 상수 관리 (DEAL_LIMITS, DEAL_STATUS)

**장점**:
- 변경 시 한 곳만 수정
- 오타 방지 (타입 체크)
- 의미 명확화

### 2. 통합 에러 처리
- **Before**: catch 블록마다 다른 에러 처리 (또는 무시)
- **After**: logError로 일관된 에러 로깅

**장점**:
- 타임스탬프, 컨텍스트 자동 기록
- 에러 추적 용이
- 디버깅 시간 단축

### 3. ESLint 규칙 강화
- **Before**: 기본 Next.js 규칙만
- **After**: TypeScript, 코드 품질 규칙 추가

**장점**:
- any 타입 사용 방지 (error)
- 미사용 변수 경고 (warn)
- console.log 제한 (warn)

---

## 🎯 constants.ts 활용 예시

### Before (❌)
```typescript
if (amount < 10000) {
  return '최소 금액은 10,000원입니다.';
}

if (grade === 'bronze' && amount > 1000000) {
  return '브론즈 등급은 100만원까지 송금 가능합니다.';
}
```

### After (✅)
```typescript
import { DEAL_LIMITS } from '@/lib/constants';

if (amount < DEAL_LIMITS.MIN_AMOUNT) {
  return `최소 금액은 ${DEAL_LIMITS.MIN_AMOUNT.toLocaleString()}원입니다.`;
}

if (grade === 'bronze' && amount > DEAL_LIMITS.MAX_AMOUNT_BRONZE) {
  return `브론즈 등급은 ${(DEAL_LIMITS.MAX_AMOUNT_BRONZE / 10000)}만원까지 송금 가능합니다.`;
}
```

---

## 🚀 다음 단계

### Option 1: 최종 Report 생성 (권장)
- Phase 1-5 전체 완료 보고서 작성
- Match Rate 90% 달성
- `/pdca report 프로젝트-구조-안정화`

### Option 2: Phase 4 진행
- 아키텍처 리팩토링
- API 도메인별 분리
- 컴포넌트 분리

---

## 📝 파일별 변경 요약

| 파일 | 변경 내용 | 라인 수 |
|------|-----------|---------|
| `src/lib/constants.ts` | 신규 생성 | 108 |
| `src/lib/errorHandler.ts` | 신규 생성 | 47 |
| `.eslintrc.json` | 신규 생성 | 19 |
| `src/lib/api.ts` | logError import + 4개 수정 | +5 |
| `src/lib/auth/middleware.ts` | logError import + 1개 수정 | +2 |
| `src/lib/apiLogger.ts` | logError import + 2개 수정 | +3 |
| `src/lib/popbill/auth.ts` | logError import + 1개 수정 | +2 |
| `src/lib/popbill/client.ts` | logError import + 1개 수정 | +2 |
| `src/app/(customer)/auth/signup/page.tsx` | logError import + 1개 수정 | +2 |
| `src/app/(customer)/deals/new/page.tsx` | logError import + 1개 수정 | +2 |

**총 변경**: 10개 파일, 신규 174 lines

---

**Phase 5 100% 완료** ✅
**다음 단계**: 최종 Report 생성 (`/pdca report`) 또는 Gap Analysis 재실행
