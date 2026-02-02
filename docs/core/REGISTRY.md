# PLIC Code Registry

> **새로 만들면 여기에 등록. Claude Code 필수 참조.**
>
> 모든 테이블, API, 컴포넌트, 함수를 중요도순으로 정리합니다.

### 관련 핵심 문서
| 문서 | 설명 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 전체 시스템 구조 |
| **[DEAL-TYPES.md](./DEAL-TYPES.md)** | 거래 타입 정의서 |
| [../DECISIONS.md](../DECISIONS.md) | 설계 결정 근거 |

---

## 📌 네이밍 규칙

| 구분 | 케이스 | 예시 |
|------|--------|------|
| Zustand Store | camelCase (use접두사) | `useUserStore`, `useDealStore` |
| 타입 Interface | PascalCase (I접두사) | `IUser`, `IDeal` |
| 타입 Type | PascalCase (T접두사) | `TUserStatus`, `TDealType` |
| API 경로 | kebab-case | `/api/payments`, `/api/kakao-login` |
| 함수 | camelCase | `createDeal()`, `getUserById()` |
| 컴포넌트 | PascalCase | `DealCard.tsx`, `MobileLayout.tsx` |
| Helper 클래스 | PascalCase | `UserHelper`, `DealHelper` |
| 상수 | SCREAMING_SNAKE_CASE | `DEAL_TYPE_CONFIG`, `GRADE_CONFIG` |

## 📌 허용 동사

| 동작 | 동사 | 금지 |
|------|------|------|
| 생성 | `create` | ~~add, insert, make~~ |
| 조회 (단건) | `get` | ~~fetch, find, retrieve~~ |
| 조회 (목록) | `list` / `getAll` | ~~fetchAll, findAll~~ |
| 수정 | `update` | ~~edit, modify, change~~ |
| 삭제 | `delete` | ~~remove, destroy, drop~~ |
| 검증 | `validate` | ~~check, verify~~ |
| 처리 | `process` / `handle` | - |
| 계산 | `calculate` | ~~compute~~ |
| 포맷 | `format` | - |

---

## 📦 Zustand 스토어 (9개)

### 핵심 스토어

| 스토어 | 파일 | 설명 | persist |
|--------|------|------|---------|
| `useUserStore` | `stores/useUserStore.ts` | 사용자 인증/프로필 | ✅ |
| `useDealStore` | `stores/useDealStore.ts` | 거래 목록 관리 | ✅ |
| `useDealDraftStore` | `stores/useDealDraftStore.ts` | 거래 임시저장 | ✅ |
| `usePaymentStore` | `stores/usePaymentStore.ts` | 결제 상태 | ✅ |

### 관리자 스토어

| 스토어 | 파일 | 설명 | persist |
|--------|------|------|---------|
| `useAdminStore` | `stores/useAdminStore.ts` | 어드민 인증 | ✅ |
| `useAdminUserStore` | `stores/useAdminUserStore.ts` | 어드민 회원 관리 | ✅ |

### 기타 스토어

| 스토어 | 파일 | 설명 | persist |
|--------|------|------|---------|
| `useContentStore` | `stores/useContentStore.ts` | 배너/공지/FAQ | ✅ |
| `useDiscountStore` | `stores/useDiscountStore.ts` | 할인코드 | ✅ |
| `useSettingsStore` | `stores/useSettingsStore.ts` | 시스템 설정 | ✅ |

---

## 🔌 API 엔드포인트

### 인증 (Auth)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/kakao-login` | 카카오 로그인 처리 |
| GET | `/api/kakao/auth` | 카카오 OAuth 시작 |
| GET | `/api/kakao/callback` | 카카오 콜백 |
| GET | `/api/kakao/result` | 인증 결과 |

### 결제 (Payment)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/payments/[trxId]` | 결제 조회 |
| POST | `/api/payments/[trxId]/cancel` | 결제 취소 |
| POST | `/api/payments/billing` | 빌링 결제 |
| POST | `/api/payments/billing-key/create` | 빌링키 생성 |
| POST | `/api/payments/billing-key/pay` | 빌링키 결제 |
| POST | `/api/payments/callback` | 결제 콜백 |

### 인증 서비스 (Popbill)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/popbill/business/verify` | 사업자 인증 |
| POST | `/api/popbill/account/verify` | 계좌 실명 인증 |

### 웹훅

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/webhooks/softpayment` | 결제 상태 웹훅 |

### 관리자 (Admin)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/admin/faqs/seed` | FAQ 초기 데이터 |

---

## 🧩 컴포넌트

### 공통 컴포넌트 (Common)

| 컴포넌트 | 위치 | 설명 | Props |
|----------|------|------|-------|
| `MobileLayout` | `components/common/` | 모바일 프레임 레이아웃 | children |
| `LeftPanel` | `components/common/` | 마케팅 패널 (데스크톱) | - |
| `Header` | `components/common/` | 페이지 헤더 | title, showBack |
| `BottomNav` | `components/common/` | 하단 네비게이션 | - |
| `Modal` | `components/common/` | 모달 컴포넌트 | isOpen, onClose, title |
| `BannerSlider` | `components/common/` | 배너 슬라이더 | banners |
| `Footer` | `components/common/` | 푸터 | - |

### 거래 컴포넌트 (Deal)

| 컴포넌트 | 위치 | 설명 |
|----------|------|------|
| `DraftDealCard` | `components/deal/` | 임시저장 거래 카드 |

---

## 🏷️ 타입 정의

### 사용자 타입 (types/user.ts)

| 타입 | 설명 |
|------|------|
| `IUser` | 사용자 정보 |
| `TUserStatus` | 사용자 상태 (active, suspended, pending, withdrawn) |
| `TUserGrade` | 사용자 등급 (basic, platinum, b2b, employee) |
| `TUserType` | 사용자 유형 (personal, business) |
| `IBusinessInfo` | 사업자 정보 |
| `IRegisteredCard` | 등록 카드 정보 |
| `IBankAccount` | 은행 계좌 정보 |

### 거래 타입 (types/deal.ts)

| 타입 | 설명 |
|------|------|
| `IDeal` | 거래 정보 |
| `TDealType` | 거래 타입 (12종) |
| `TDealStatus` | 거래 상태 (8종) |
| `IRecipientAccount` | 수취인 계좌 정보 |
| `IDealDraft` | 거래 임시저장 |

### 결제 타입 (types/payment.ts)

| 타입 | 설명 |
|------|------|
| `IPayment` | 결제 정보 |
| `TPaymentStatus` | 결제 상태 |
| `TPaymentType` | 결제 유형 (single, split) |

### 콘텐츠 타입 (types/content.ts)

| 타입 | 설명 |
|------|------|
| `IHomeBanner` | 홈 배너 |
| `INotice` | 공지사항 |
| `IFAQ` | FAQ |

---

## 🔧 Helper 클래스

### UserHelper (classes/UserHelper.ts)

| 메서드/상수 | 설명 |
|-------------|------|
| `GRADE_CONFIG` | 등급별 설정 (수수료, 한도) |
| `generateUID()` | UID 생성 |
| `getRemainingLimit()` | 남은 한도 계산 |
| `getUsageRate()` | 사용률 계산 |
| `createNewUser()` | 새 사용자 객체 생성 |

### DealHelper (classes/DealHelper.ts)

| 메서드/상수 | 설명 |
|-------------|------|
| `DEAL_TYPE_CONFIG` | 거래 타입별 설정 |
| `STATUS_CONFIG` | 상태별 설정 |
| `calculateTotal()` | 총액 계산 (원금 + 수수료) |
| `generateDID()` | 거래 ID 생성 |
| `getRequiredDocs()` | 필수 서류 조회 |

### PaymentHelper (classes/PaymentHelper.ts)

| 메서드/상수 | 설명 |
|-------------|------|
| `createPayment()` | 결제 객체 생성 |
| `validatePayment()` | 결제 검증 |

---

## 🌐 유틸리티 함수

### lib/utils.ts

| 함수 | 설명 |
|------|------|
| `cn()` | Tailwind 클래스 병합 |
| `formatPrice()` | 가격 포맷팅 (1,000원) |
| `formatDate()` | 날짜 포맷팅 |
| `formatPhone()` | 전화번호 포맷팅 |

### lib/api.ts

| 함수/상수 | 설명 |
|-----------|------|
| `API_BASE_URL` | 백엔드 API 주소 |
| `apiClient` | API 클라이언트 |
| `setTokens()` | 토큰 저장 |
| `getAccessToken()` | 액세스 토큰 조회 |
| `clearTokens()` | 토큰 삭제 |

### lib/gradeUtils.ts

| 함수 | 설명 |
|------|------|
| `calculateAutoGrade()` | 자동 등급 계산 |
| `shouldUpgrade()` | 등급 업그레이드 여부 |

---

## 📝 상수

### 등급 설정

| 상수 | 위치 | 값 |
|------|------|-----|
| `GRADE_CONFIG.basic.feeRate` | `UserHelper.ts` | 5.5% |
| `GRADE_CONFIG.basic.monthlyLimit` | `UserHelper.ts` | 20,000,000원 |

### 거래 설정

| 상수 | 위치 | 값 |
|------|------|-----|
| `MIN_AMOUNT` | `deals/new/page.tsx` | 10,000원 |
| `MAX_AMOUNT` | `deals/new/page.tsx` | 50,000,000원 |

### 파일 업로드

| 상수 | 위치 | 값 |
|------|------|-----|
| `MAX_FILE_SIZE` | `lib/upload.ts` | 10MB |
| `ALLOWED_TYPES` | `lib/upload.ts` | image/*, application/pdf |

---

## ⚠️ 개선 필요 / 중복 의심

### 하드코딩 발견

| 파일 | 라인 | 코드 | 개선 방안 |
|------|------|------|----------|
| `lib/api.ts` | 3 | `API_BASE_URL` | 환경변수로 이동 |
| `stores/useDealDraftStore.ts` | 7 | `API_BASE_URL` | 중복 제거, 통합 |
| `stores/useAdminStore.ts` | 37-38 | 비밀번호 하드코딩 | 서버 인증으로 전환 |

### 대형 파일 (분할 필요)

| 파일 | 라인 수 | 권장 조치 |
|------|---------|----------|
| `deals/[did]/page.tsx` | 1,502줄 | 모달/섹션 분할 |
| `deals/new/page.tsx` | 1,414줄 | 스텝별 컴포넌트 분할 |
| `auth/signup/page.tsx` | 1,001줄 | 단계별 컴포넌트 분할 |

### 중복 코드

| 위치 1 | 위치 2 | 설명 |
|--------|--------|------|
| `useUserStore:76-100` | `useUserStore:136-160` | User 매핑 로직 중복 |
| `deals/new/page.tsx` | `deals/[did]/page.tsx` | 계좌번호 검증 중복 |
| 여러 파일 | - | 은행 목록 배열 중복 |

---

## 운영 방식

```
[Claude Code 작업시]
    ↓
1. REGISTRY.md 먼저 읽기
2. 새로 만들 것이 있으면 → 기존 패턴 따라서 이름 짓기
3. 작업 완료 후 → REGISTRY.md에 추가 등록
```

---

**마지막 업데이트**: 2026-02-02
