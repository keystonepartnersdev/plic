# PLIC 프로젝트 리팩토링 계획서 v1.0

> **작성일**: 2026-02-02
> **상태**: Draft
> **품질점수**: 62/100 → 목표 85/100

---

## 1. 개요

### 1.1 목적
코드 리뷰 결과 발견된 보안 취약점, 아키텍처 이슈, 코드 품질 문제를 체계적으로 개선하여 프로덕션 안정성을 확보한다.

### 1.2 범위
- 보안 취약점 수정
- 대형 컴포넌트 분할
- 중복 코드 제거
- TypeScript 타입 안전성 강화
- 코드 구조 개선

### 1.3 제외 범위
- 새로운 기능 추가
- UI/UX 변경
- 백엔드 API 변경 (인증 제외)

---

## 2. 현재 문제점 요약

| 우선순위 | 카테고리 | 문제 | 영향도 |
|---------|---------|------|--------|
| P0 | 보안 | 어드민 비밀번호 하드코딩 | Critical |
| P0 | 보안 | 클라이언트 사이드 인증 | Critical |
| P1 | 보안 | JWT 토큰 localStorage 저장 | High |
| P1 | 타입 | TypeScript strict 모드 비활성화 | High |
| P2 | 구조 | 대형 컴포넌트 (1000줄+) 3개 | Medium |
| P2 | 중복 | 중복 코드 다수 | Medium |
| P3 | 타입 | any 타입 161개 | Medium |
| P3 | 품질 | useEffect 의존성 누락 | Low |

---

## 3. 리팩토링 단계

### Phase 1: 보안 강화 (Critical)

#### 1.1 어드민 인증 재구현
**대상 파일**: `src/stores/useAdminStore.ts`

**현재 문제**:
```typescript
// 하드코딩된 비밀번호
{ email: 'admin@plic.kr', password: 'admin1234' }
```

**변경 계획**:
1. 하드코딩된 비밀번호/어드민 목록 제거
2. 백엔드 API 인증으로 전환
3. 클라이언트에서 비밀번호 비교 로직 제거

**예상 변경 파일**:
- `src/stores/useAdminStore.ts` - 전면 수정
- `src/app/admin/login/page.tsx` - API 호출로 변경

#### 1.2 토큰 저장 방식 개선
**대상 파일**: `src/lib/api.ts`

**변경 계획**:
1. localStorage → httpOnly 쿠키로 전환
2. API Route를 통한 토큰 관리
3. 리프레시 토큰 로직 서버사이드로 이동

**예상 변경 파일**:
- `src/lib/api.ts` - 토큰 관리 로직 수정
- `src/app/api/auth/token/route.ts` - 신규 생성
- `src/app/api/auth/refresh/route.ts` - 신규 생성

---

### Phase 2: 설정 중앙화

#### 2.1 환경 설정 통합
**신규 파일**: `src/lib/config.ts`

```typescript
// 목표 구조
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    timeout: 30000,
  },
  storage: {
    bucketName: process.env.NEXT_PUBLIC_S3_BUCKET!,
  },
  payment: {
    apiUrl: process.env.SOFTPAYMENT_API_URL!,
  },
};
```

**수정 대상**:
- `src/lib/api.ts:3` - API_BASE_URL 하드코딩 제거
- `src/stores/useDealDraftStore.ts:7` - 중복 URL 제거
- `src/lib/upload.ts:159` - 버킷명 환경변수화

#### 2.2 상수 파일 생성
**신규 파일**: `src/lib/constants.ts`

```typescript
// 목표 구조
export const BANKS = [...] as const;
export const DEAL_TYPES = [...] as const;
export const AMOUNT_LIMITS = {
  MIN: 10000,
  MAX: 50000000,
} as const;
```

---

### Phase 3: 컴포넌트 분할

#### 3.1 deals/new/page.tsx (1,414줄 → ~300줄)
**분할 계획**:
```
src/app/(customer)/deals/new/
├── page.tsx                 # 메인 컨테이너 (~300줄)
├── components/
│   ├── DealTypeStep.tsx     # Step 1: 거래유형 선택
│   ├── AmountStep.tsx       # Step 2: 금액 입력
│   ├── RecipientStep.tsx    # Step 3: 수취인 정보
│   ├── DocumentStep.tsx     # Step 4: 서류 업로드
│   └── ConfirmStep.tsx      # Step 5: 확인
└── hooks/
    └── useDealCreation.ts   # 비즈니스 로직
```

#### 3.2 deals/[did]/page.tsx (1,502줄 → ~400줄)
**분할 계획**:
```
src/app/(customer)/deals/[did]/
├── page.tsx                 # 메인 컨테이너 (~400줄)
├── components/
│   ├── DealHeader.tsx       # 헤더/상태 표시
│   ├── DealInfo.tsx         # 거래 정보 섹션
│   ├── RecipientInfo.tsx    # 수취인 정보 섹션
│   ├── DocumentList.tsx     # 서류 목록
│   ├── RevisionModal.tsx    # 수정요청 모달
│   ├── CancelModal.tsx      # 취소 모달
│   └── DiscountSection.tsx  # 할인코드 섹션
└── hooks/
    └── useDealDetail.ts     # 비즈니스 로직
```

#### 3.3 auth/signup/page.tsx (1,001줄 → ~250줄)
**분할 계획**:
```
src/app/(customer)/auth/signup/
├── page.tsx                 # 메인 컨테이너 (~250줄)
├── components/
│   ├── AgreementStep.tsx    # Step 1: 약관 동의
│   ├── PhoneVerifyStep.tsx  # Step 2: 휴대폰 인증
│   ├── UserInfoStep.tsx     # Step 3: 회원 정보
│   ├── BusinessInfoStep.tsx # Step 4: 사업자 정보 (선택)
│   └── CompleteStep.tsx     # Step 5: 완료
└── hooks/
    └── useSignup.ts         # 회원가입 로직
```

---

### Phase 4: 중복 코드 제거

#### 4.1 유틸리티 함수 추출
**신규 파일**: `src/lib/validation.ts`

```typescript
// 추출 대상
export function validateBankAccountNumber(bank: string, accountNumber: string): boolean
export function validatePhoneNumber(phone: string): boolean
export function validateBusinessNumber(bizNo: string): boolean
export function validateEmail(email: string): boolean
```

#### 4.2 User 매핑 함수 추출
**수정 파일**: `src/stores/useUserStore.ts`

```typescript
// 중복 코드 추출
function mapApiUserToIUser(apiUser: ApiUserResponse): IUser {
  // useUserStore.ts:76-100, 136-160 통합
}
```

#### 4.3 커스텀 훅 생성
**신규 파일**: `src/hooks/useAdminDataFetch.ts`

```typescript
// 반복되는 패턴 추출
export function useAdminDataFetch<T>(
  fetchFn: () => Promise<T>,
  deps: DependencyList = []
) {
  // 공통 데이터 페칭 패턴
}
```

---

### Phase 5: 타입 안전성 강화

#### 5.1 TypeScript strict 모드 활성화
**단계적 접근**:
1. `tsconfig.json`에서 개별 옵션 활성화
2. `"noImplicitAny": true` 먼저 적용
3. `"strictNullChecks": true` 적용
4. 최종적으로 `"strict": true` 전환

#### 5.2 any 타입 제거 (161개)
**우선순위**:
1. API 응답 타입 정의 (`src/types/api.ts` 신규)
2. 에러 핸들링 (`catch (error: unknown)`)
3. 이벤트 핸들러 타입

---

### Phase 6: 코드 품질 개선

#### 6.1 useEffect 의존성 수정
- ESLint `react-hooks/exhaustive-deps` 규칙 활성화
- 누락된 의존성 추가 또는 useCallback으로 래핑

#### 6.2 Error Boundary 추가
**신규 파일**: `src/components/common/ErrorBoundary.tsx`

```typescript
export class ErrorBoundary extends Component<Props, State> {
  // 전역 에러 처리
}
```

#### 6.3 민감 정보 로깅 제거
**대상 파일**: `src/app/api/popbill/account/verify/route.ts`
- 계좌번호 로깅 제거 또는 마스킹 처리

---

## 4. 파일 변경 요약

### 신규 생성 파일
| 파일 | 목적 |
|------|------|
| `src/lib/config.ts` | 환경 설정 중앙화 |
| `src/lib/constants.ts` | 공통 상수 정의 |
| `src/lib/validation.ts` | 유효성 검사 유틸리티 |
| `src/types/api.ts` | API 응답 타입 정의 |
| `src/hooks/useAdminDataFetch.ts` | 어드민 데이터 페칭 훅 |
| `src/components/common/ErrorBoundary.tsx` | 에러 바운더리 |
| `src/app/api/auth/token/route.ts` | 토큰 관리 API |
| `.env.example` | 환경변수 템플릿 |
| deals/new 컴포넌트들 (5개) | 페이지 분할 |
| deals/[did] 컴포넌트들 (7개) | 페이지 분할 |
| auth/signup 컴포넌트들 (5개) | 페이지 분할 |

### 주요 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/stores/useAdminStore.ts` | 인증 로직 전면 재구현 |
| `src/lib/api.ts` | 토큰 관리 방식 변경 |
| `src/stores/useUserStore.ts` | 중복 코드 제거 |
| `tsconfig.json` | strict 옵션 활성화 |

---

## 5. 리스크 및 완화 방안

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 어드민 인증 변경 | 기존 어드민 로그인 불가 | 백엔드 API 선행 개발 필요 |
| strict 모드 활성화 | 빌드 실패 가능 | 점진적 옵션 활성화 |
| 컴포넌트 분할 | 기존 기능 오작동 | 분할 후 E2E 테스트 |
| 토큰 방식 변경 | 기존 사용자 로그아웃 | 마이그레이션 기간 설정 |

---

## 6. 검증 계획

### 단계별 검증
1. **Phase 1 완료 후**: 어드민/사용자 로그인 테스트
2. **Phase 2 완료 후**: 빌드 성공 확인
3. **Phase 3 완료 후**: 거래생성/조회 플로우 테스트
4. **Phase 4 완료 후**: 단위 테스트 (validation 함수)
5. **Phase 5 완료 후**: 빌드 에러 0 확인
6. **Phase 6 완료 후**: 전체 QA

### 최종 품질 목표
- 빌드 에러: 0
- TypeScript any 사용: 20개 미만
- 파일당 최대 라인: 500줄
- 중복 코드: 5% 미만
- 품질 점수: 85/100 이상

---

## 7. 진행 순서

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 보안 강화                                          │
│  ├─ 1.1 어드민 인증 재구현 ─────────────────────────────────▶│
│  └─ 1.2 토큰 저장 방식 개선 ────────────────────────────────▶│
├─────────────────────────────────────────────────────────────┤
│  Phase 2: 설정 중앙화                                        │
│  ├─ 2.1 환경 설정 통합 ─────────────────────────────────────▶│
│  └─ 2.2 상수 파일 생성 ─────────────────────────────────────▶│
├─────────────────────────────────────────────────────────────┤
│  Phase 3: 컴포넌트 분할                                      │
│  ├─ 3.1 deals/new 분할 ─────────────────────────────────────▶│
│  ├─ 3.2 deals/[did] 분할 ───────────────────────────────────▶│
│  └─ 3.3 auth/signup 분할 ───────────────────────────────────▶│
├─────────────────────────────────────────────────────────────┤
│  Phase 4: 중복 코드 제거                                     │
│  ├─ 4.1 유틸리티 함수 추출 ─────────────────────────────────▶│
│  ├─ 4.2 User 매핑 함수 추출 ────────────────────────────────▶│
│  └─ 4.3 커스텀 훅 생성 ─────────────────────────────────────▶│
├─────────────────────────────────────────────────────────────┤
│  Phase 5: 타입 안전성 강화                                   │
│  ├─ 5.1 strict 모드 활성화 ─────────────────────────────────▶│
│  └─ 5.2 any 타입 제거 ──────────────────────────────────────▶│
├─────────────────────────────────────────────────────────────┤
│  Phase 6: 코드 품질 개선                                     │
│  ├─ 6.1 useEffect 의존성 수정 ──────────────────────────────▶│
│  ├─ 6.2 Error Boundary 추가 ────────────────────────────────▶│
│  └─ 6.3 민감 정보 로깅 제거 ────────────────────────────────▶│
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 승인 요청

위 계획에 대해 검토 및 승인을 요청드립니다.

**의사결정 필요 사항**:
1. Phase 1 (보안) - 백엔드 API 개발이 선행되어야 함. 백엔드 작업 가능 여부?
2. Phase 3 (컴포넌트 분할) - 전체 분할 vs 점진적 분할?
3. Phase 5 (strict 모드) - 즉시 적용 vs 점진적 적용?

---

**문서 버전 이력**
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-02 | 최초 작성 |
