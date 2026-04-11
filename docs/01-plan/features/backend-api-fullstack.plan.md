# Backend & API 종합 계획서

> **작성일**: 2026-02-05
> **범위**: 프론트엔드 BFF + AWS Lambda 백엔드 + 외부 API 연동
> **목표**: 프론트엔드 중심 개발에서 벗어나 전체 스택 완성

---

## 1. 현재 상태 분석

### 1.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PLIC 시스템 구조                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [사용자 브라우저]                                                    │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────┐                       │
│  │    Next.js Frontend (Vercel)            │                       │
│  │    ├── pages/ (고객/어드민 UI)           │                       │
│  │    ├── stores/ (Zustand 상태관리)        │                       │
│  │    └── api/ (BFF - 20개 라우트)          │  ◀── 현재 여기       │
│  └─────────────────────────────────────────┘                       │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────┐                       │
│  │    AWS Lambda Backend                   │                       │
│  │    ├── API Gateway                      │  ◀── 별도 저장소       │
│  │    ├── Lambda Functions                 │                       │
│  │    └── DynamoDB                         │                       │
│  └─────────────────────────────────────────┘                       │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────┐                       │
│  │    External APIs                        │                       │
│  │    ├── Softpayment (PG)                │                       │
│  │    ├── Popbill (사업자/계좌 인증)        │                       │
│  │    └── Kakao (OAuth)                   │                       │
│  └─────────────────────────────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 현재 구현 상태

| 레이어 | 상태 | 완성도 |
|--------|------|--------|
| **Frontend UI** | ✅ 완료 | 95% |
| **Frontend BFF (API Routes)** | ⚠️ 부분 | 70% |
| **Backend Lambda** | ❓ 별도 저장소 | 미확인 |
| **외부 API 연동** | ⚠️ 부분 | 60% |
| **API 문서화** | ❌ 미완료 | 0% |

### 1.3 프론트엔드 BFF 현황 (20개 라우트)

| 카테고리 | 라우트 | 상태 | 비고 |
|----------|--------|------|------|
| **결제** | `/api/payments/[trxId]` | ✅ | 결제 조회 |
| | `/api/payments/[trxId]/cancel` | ✅ | 결제 취소 |
| | `/api/payments/billing` | ✅ | 빌링 결제 |
| | `/api/payments/billing-key/create` | ✅ | 빌링키 생성 |
| | `/api/payments/billing-key/callback` | ✅ | 빌링키 콜백 |
| | `/api/payments/billing-key/pay` | ✅ | 빌링키 결제 |
| | `/api/payments/callback` | ✅ | 결제 콜백 |
| **웹훅** | `/api/webhooks/softpayment` | ✅ | PG 웹훅 |
| **인증** | `/api/auth/login` | ✅ | 로그인 프록시 |
| | `/api/auth/logout` | ✅ | 로그아웃 |
| | `/api/auth/refresh` | ✅ | 토큰 갱신 |
| | `/api/auth/me` | ✅ | 내 정보 |
| | `/api/auth/kakao-login` | ✅ | 카카오 로그인 |
| | `/api/auth/test-login` | ⚠️ | 테스트용 (제거 필요) |
| **카카오** | `/api/kakao/auth` | ✅ | OAuth 시작 |
| | `/api/kakao/callback` | ✅ | 콜백 처리 |
| | `/api/kakao/result` | ✅ | 결과 확인 |
| **Popbill** | `/api/popbill/business/verify` | ✅ | 사업자 인증 |
| | `/api/popbill/account/verify` | ✅ | 계좌 실명인증 |
| **어드민** | `/api/admin/faqs/seed` | ⚠️ | 시드 데이터 (제거 필요) |

---

## 2. 개선 필요 사항

### 2.1 프론트엔드 BFF (우선순위: High)

| 항목 | 현재 | 개선 |
|------|------|------|
| **테스트 API 제거** | `test-login` 존재 | 프로덕션 배포 전 제거 |
| **시드 API 제거** | `admin/faqs/seed` 존재 | 프로덕션 배포 전 제거 |
| **에러 핸들링 표준화** | 각 라우트별 다름 | 통합 에러 핸들러 |
| **요청 검증** | 일부만 적용 | Zod 스키마 전면 적용 |
| **Rate Limiting** | 미적용 | API 보호 추가 |
| **CORS 설정** | 기본값 | 명시적 설정 |

### 2.2 백엔드 Lambda (우선순위: High)

| 항목 | 상태 | 필요 작업 |
|------|------|-----------|
| **API 문서** | ❌ | OpenAPI/Swagger 작성 |
| **에러 코드 정의** | ❓ | 표준 에러 코드 체계 |
| **응답 타입 일관성** | ❓ | 프론트와 타입 동기화 |
| **Cold Start 최적화** | ❓ | Provisioned Concurrency |
| **Lambda 로깅** | ❓ | CloudWatch 구조화 로깅 |
| **보안 헤더** | ❓ | CORS, CSP 등 |

### 2.3 외부 API 연동 (우선순위: Medium)

| 서비스 | 현재 | 개선 |
|--------|------|------|
| **Softpayment** | 기본 연동 | 에러 핸들링 강화, 재시도 로직 |
| **Popbill** | 기본 연동 | 타임아웃 처리, 캐싱 |
| **Kakao OAuth** | 완료 | 리프레시 토큰 처리 |

---

## 3. 구체적 실행 계획

### Phase 1: BFF 정리 및 강화 (Day 1)

#### 1.1 테스트/시드 API 제거
```
삭제 대상:
├── src/app/api/auth/test-login/route.ts
└── src/app/api/admin/faqs/seed/route.ts
```

#### 1.2 통합 에러 핸들러 생성
```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const errorCodes = {
  AUTH_REQUIRED: 'AUTH_001',
  AUTH_EXPIRED: 'AUTH_002',
  INVALID_INPUT: 'INPUT_001',
  NOT_FOUND: 'NOT_FOUND_001',
  PAYMENT_FAILED: 'PAYMENT_001',
  // ...
} as const;
```

#### 1.3 요청 검증 스키마 (Zod)
```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});

// src/lib/validations/payment.ts
export const paymentSchema = z.object({
  amount: z.number().min(10000).max(50000000),
  dealId: z.string().uuid(),
  // ...
});
```

### Phase 2: API 문서화 (Day 2)

#### 2.1 OpenAPI 스펙 작성
```yaml
# docs/api/openapi.yaml
openapi: 3.0.3
info:
  title: PLIC API
  version: 1.0.0
  description: PLIC 카드 송금 서비스 API

paths:
  /auth/login:
    post:
      summary: 로그인
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        200:
          description: 로그인 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
```

#### 2.2 API 레지스트리 업데이트
- 백엔드 Lambda 엔드포인트 전체 목록
- 요청/응답 타입 정의
- 에러 코드 목록

### Phase 3: 백엔드 Lambda 확인 및 동기화 (Day 3)

#### 3.1 백엔드 저장소 확인
```
필요 확인 사항:
├── Lambda 함수 목록
├── API Gateway 설정
├── DynamoDB 테이블 구조
├── 환경 변수 관리
└── 배포 파이프라인
```

#### 3.2 타입 동기화
```typescript
// shared-types 패키지 또는 src/types/api-contracts.ts
// 프론트/백엔드 공유 타입 정의

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Phase 4: 통합 테스트 (Day 4)

#### 4.1 API 통합 테스트
```typescript
// tests/integration/api.spec.ts
test.describe('API Integration', () => {
  test('로그인 → 거래 생성 → 결제 플로우', async () => {
    // 실제 API 호출 테스트
  });
});
```

#### 4.2 에러 시나리오 테스트
- 네트워크 타임아웃
- 백엔드 5xx 에러
- 인증 만료
- Rate Limiting

### Phase 5: 모니터링 및 운영 (Day 5)

#### 5.1 프론트엔드 에러 모니터링
```typescript
// Sentry 설정
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [new Sentry.BrowserTracing()],
});
```

#### 5.2 API 헬스체크
```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    version: APP_CONFIG.APP_VERSION,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 4. 파일 구조 계획

### 신규 생성 파일

```
src/
├── lib/
│   ├── api-error.ts           # 통합 에러 클래스
│   ├── api-middleware.ts      # 요청 검증, 인증 미들웨어
│   └── validations/           # Zod 스키마
│       ├── auth.ts
│       ├── deal.ts
│       ├── payment.ts
│       └── index.ts
├── app/api/
│   └── health/
│       └── route.ts           # 헬스체크 엔드포인트

docs/
├── api/
│   ├── openapi.yaml           # OpenAPI 스펙
│   ├── error-codes.md         # 에러 코드 문서
│   └── endpoints.md           # 엔드포인트 상세
└── 01-plan/features/
    └── backend-api-fullstack.plan.md (현재 파일)
```

### 삭제 예정 파일

```
삭제:
├── src/app/api/auth/test-login/route.ts
└── src/app/api/admin/faqs/seed/route.ts
```

---

## 5. 체크리스트

### Phase 1: BFF 정리 ⬜
- [ ] test-login API 제거
- [ ] admin/faqs/seed API 제거
- [ ] ApiError 클래스 생성
- [ ] 에러 코드 상수 정의
- [ ] Zod 스키마 작성 (auth, deal, payment)
- [ ] API 라우트에 검증 적용

### Phase 2: 문서화 ⬜
- [ ] OpenAPI 스펙 작성
- [ ] 에러 코드 문서 작성
- [ ] REGISTRY.md 백엔드 섹션 추가

### Phase 3: 백엔드 동기화 ⬜
- [ ] Lambda 함수 목록 확인
- [ ] DynamoDB 테이블 구조 문서화
- [ ] 타입 동기화 확인/수정
- [ ] 환경 변수 검토

### Phase 4: 통합 테스트 ⬜
- [ ] API 통합 테스트 작성
- [ ] 에러 시나리오 테스트
- [ ] E2E 테스트 실제 API 연동

### Phase 5: 모니터링 ⬜
- [ ] Sentry 설정
- [ ] 헬스체크 엔드포인트
- [ ] 알림 설정

---

## 6. 의존성

### 추가 필요 패키지
```json
{
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@sentry/nextjs": "^7.0.0"
  }
}
```

---

## 7. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| 백엔드 저장소 접근 불가 | 동기화 불가 | API 문서 기반 작업 |
| Lambda Cold Start | 첫 요청 지연 | 프로비저닝 또는 warming |
| PG 연동 이슈 | 결제 실패 | 재시도 로직, 폴백 |
| 외부 API 장애 | 서비스 중단 | Circuit Breaker 패턴 |

---

## 8. 다음 단계

1. **즉시 실행**: Phase 1 - BFF 정리 시작
2. **확인 필요**: 백엔드 Lambda 저장소 접근 권한
3. **결정 필요**: Sentry vs 자체 에러 수집

---

**작성자**: Claude (AI Assistant)
**상태**: 계획 수립 완료
