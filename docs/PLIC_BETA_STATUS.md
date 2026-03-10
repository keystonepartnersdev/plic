# PLIC 베타 현황 문서 v1.0

> 최종 업데이트: 2026-03-11
> 상태: **Beta**
> 서비스 URL: https://plic.kr (Vercel)
> API Gateway: https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod

---

## 1. 서비스 개요

PLIC은 **B2B 신용카드 → 계좌이체 서비스**입니다.
등록된 사업자가 신용카드로 결제하면, 지정 계좌로 현금을 송금해주는 핀테크 서비스.

### 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| 상태관리 | Zustand 5 (persist middleware) |
| 백엔드 | AWS Lambda (Node.js 20.x), API Gateway |
| DB | DynamoDB (14 테이블) |
| 인증 | AWS Cognito (사용자), HMAC 세션토큰 (관리자) |
| 결제 | Softpayment (신용카드) |
| 외부연동 | Popbill (계좌/사업자 검증), Kakao (소셜로그인/본인인증) |
| 파일저장 | S3 (presigned URL) |
| 배포 | Vercel (프론트), AWS SAM (백엔드) |
| IaC | AWS SAM (template.yaml) |

### AWS 계정

| 프로필 | 계정 ID | 용도 |
|--------|---------|------|
| `plic` | 805694794688 | PLIC 서비스 |
| `companyweb` | 340197286566 | 키스톤파트너스 웹 |
| `phomistone` | 586769868382 | 포미스톤 |

---

## 2. 구현 완료 기능

### 2-1. 프론트엔드 (Vercel 배포 완료)

#### 고객 페이지 (18개)

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 홈 | `/` | ✅ 완료 (배너, 거래요약, FAQ) |
| 로그인 | `/auth/login` | ✅ 완료 |
| 회원가입 | `/auth/signup` | ✅ 완료 (5단계: 약관→**카카오인증**→정보→사업자→완료) |
| 거래 목록 | `/deals` | ✅ 완료 |
| 거래 상세 | `/deals/[did]` | ✅ 완료 |
| 새 송금 | `/deals/new` | ✅ 완료 (5단계 위저드) |
| 결제 | `/payment/[did]` | ✅ 완료 |
| 결제 결과 | `/payment/result` | ✅ 완료 |
| 마이페이지 | `/mypage` | ✅ 완료 |
| 프로필 수정 | `/mypage/edit` | ✅ 완료 |
| 등급 정보 | `/mypage/grade` | ✅ 완료 |
| 계좌 관리 | `/mypage/accounts` | ✅ 완료 |
| 카드 관리 | `/mypage/cards` | ✅ 완료 |
| 공지사항 | `/mypage/notices` | ✅ 완료 |
| 설정 | `/mypage/settings` | ✅ 완료 |
| 공지사항 (별도) | `/notices` | ✅ 완료 |
| 이용가이드 | `/guide` | ✅ 완료 |
| 약관 | `/terms/[type]` | ✅ 완료 |

#### 관리자 페이지 (16개)

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 대시보드 | `/admin` | ✅ 완료 |
| 관리자 로그인 | `/admin/login` | ✅ 완료 |
| 사용자 목록 | `/admin/users` | ✅ 완료 |
| 사용자 상세 | `/admin/users/[uid]` | ✅ 완료 |
| 거래 목록 | `/admin/deals` | ✅ 완료 |
| 거래 상세 | `/admin/deals/[did]` | ✅ 완료 |
| 통계/분석 | `/admin/analytics` | ✅ 완료 |
| 관리자 관리 | `/admin/admins` | ✅ 완료 |
| 할인코드 관리 | `/admin/codes` | ✅ 완료 |
| 시스템 설정 | `/admin/settings` | ✅ 완료 |
| API 로그 | `/admin/api-logs` | ✅ 완료 |
| 콘텐츠 허브 | `/admin/contents` | ✅ 완료 |
| 배너 관리 | `/admin/contents/banners` | ✅ 완료 |
| FAQ 관리 | `/admin/contents/faqs` | ✅ 완료 |
| 공지 관리 | `/admin/contents/notices` | ✅ 완료 |
| 약관 관리 | `/admin/contents/terms` | ✅ 완료 |

#### 랜딩 페이지

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 마케팅 랜딩 | `/landing` | ✅ 완료 |

#### 컴포넌트 (34개)

- **공통 (9개)**: MobileLayout, Header, BottomNav, Modal, LeftPanel, BannerSlider, Footer, ErrorBoundary, RevisionBanner
- **회원가입 (5개)**: AgreementStep, UserInfoStep, BusinessInfoStep, KakaoVerifyStep, CompleteStep
- **거래 생성 (6개)**: TypeStep, AmountStep, RecipientStep, DocsStep, ConfirmStep, StepProgress
- **거래 상세 (14개)**: StatusCard, AmountCard, RecipientCard, AttachmentsCard, DiscountSection, DealHistory, 각종 모달

#### Zustand 스토어 (9개)

| 스토어 | localStorage 키 | 용도 |
|--------|-----------------|------|
| `useUserStore` | `plic-user-storage` | 사용자 인증/프로필 |
| `useDealStore` | `plic-deal-storage` | 거래 목록 |
| `useDealDraftStore` | `plic-deal-draft-storage` | 거래 임시저장 |
| `usePaymentStore` | `plic-payment-storage` | 결제 |
| `useAdminStore` | `plic-admin-storage` | 관리자 세션 |
| `useAdminUserStore` | `plic-admin-user-storage` | 관리자용 사용자 목록 |
| `useContentStore` | `plic-content-storage` | 배너/공지/FAQ |
| `useDiscountStore` | `plic-discount-storage` | 할인/쿠폰 |
| `useSettingsStore` | `plic-settings` | 시스템 설정 |

#### Next.js API Routes (BFF 프록시, 50개)

프론트엔드 → Lambda 중간 프록시 역할. httpOnly 쿠키 기반 JWT 인증 처리.
주요 그룹: auth(7), users(6), deals(3), payments(7), content(6), discounts(2), kakao(4), popbill(2), uploads(2), tracking(2), webhooks(1), health(1), admin(22)

---

### 2-2. 백엔드 Lambda (AWS 배포 완료, 29개)

| # | 함수명 | 엔드포인트 | 역할 |
|---|--------|-----------|------|
| 1 | `SignupFunction` | POST /auth/signup | 회원가입 |
| 2 | `ConfirmFunction` | POST /auth/confirm | 이메일 인증 |
| 3 | `LoginFunction` | POST /auth/login | 로그인 |
| 4 | `RefreshFunction` | POST /auth/refresh | 토큰 갱신 |
| 5 | `LogoutFunction` | POST /auth/logout | 로그아웃 |
| 6 | `GetMeFunction` | GET /users/me | 프로필 조회 |
| 7 | `UpdateMeFunction` | PUT /users/me | 프로필 수정 |
| 8 | `WithdrawFunction` | DELETE /users/me | 회원 탈퇴 |
| 9 | `GetGradeFunction` | GET /users/me/grade | 등급 조회 |
| 10 | `ListDealsFunction` | GET /deals | 거래 목록 |
| 11 | `GetDealFunction` | GET /deals/{did} | 거래 상세 |
| 12 | `CreateDealFunction` | POST /deals | 거래 생성 |
| 13 | `UpdateDealFunction` | PUT /deals/{did} | 거래 수정 |
| 14 | `CancelDealFunction` | DELETE /deals/{did} | 거래 취소 |
| 15 | `ValidateDiscountFunction` | POST /discounts/validate | 할인코드 검증 |
| 16 | `GetCouponsFunction` | GET /discounts/coupons | 쿠폰 목록 |
| 17 | `ApplyDiscountFunction` | POST /deals/{did}/discount | 할인 적용 |
| 18 | `GetBannersFunction` | GET /content/banners | 배너 조회 |
| 19 | `GetNoticesFunction` | GET /content/notices | 공지 목록 |
| 20 | `GetNoticeDetailFunction` | GET /content/notices/{id} | 공지 상세 |
| 21 | `GetFaqsFunction` | GET /content/faqs | FAQ 목록 |
| 22 | `AdminLoginFunction` | POST /admin/auth/login | 관리자 로그인 |
| 23 | `AdminUsersListFunction` | GET /admin/users | 사용자 목록 |
| 24 | `AdminUsersGetFunction` | GET /admin/users/{uid} | 사용자 상세 |
| 25 | `AdminUsersStatusFunction` | PUT /admin/users/{uid}/status | 상태 변경 |
| 26 | `AdminUsersGradeFunction` | PUT /admin/users/{uid}/grade | 등급 변경 |
| 27 | `AdminDealsListFunction` | GET /admin/deals | 거래 목록 |
| 28 | `AdminDealsGetFunction` | GET /admin/deals/{did} | 거래 상세 |
| 29 | `AdminDealsStatusFunction` | PUT /admin/deals/{did}/status | 거래 상태 변경 |

### 2-3. DynamoDB 테이블 (14개)

| 테이블 | PK | GSI | 용도 |
|--------|----|-----|------|
| `plic-users` | uid | email-index, phone-index | 사용자 |
| `plic-deals` | did | uid-index, status-index | 거래 |
| `plic-admins` | adminId | email-index | 관리자 |
| `plic-contents` | pk + sk | — | 배너/공지/FAQ/약관 |
| `plic-withdrawn-users` | uid | — | 탈퇴 보관 (5년) |
| `plic-withdrawn-deals` | wdid | uid-index | 탈퇴 거래 보관 |
| `plic-discounts` | — | — | 할인코드/쿠폰 |
| `plic-events` | — | — | 트래킹 이벤트 (TTL 30일) |
| `plic-api-logs` | — | — | API 로그 (TTL 30일) |
| `plic-drafts` | — | — | 임시저장 |
| `plic-payments` | — | — | 결제 기록 |
| `plic-settings` | — | — | 시스템 설정 |
| `plic-kakao-verifications` | — | — | 카카오 인증키 |

> 참고: `plic-users`, `plic-deals`, `plic-admins`, `plic-contents`, `plic-withdrawn-users`, `plic-withdrawn-deals`만 SAM 템플릿에 정의됨. 나머지는 수동 생성.

### 2-4. 외부 연동

| 서비스 | 용도 | 연동 방식 | 상태 |
|--------|------|----------|------|
| Softpayment | 신용카드 결제 | Next.js API Route → 외부 API | ✅ 완료 |
| Popbill | 계좌 실명 확인 | Next.js API Route → 외부 API | ✅ 완료 |
| Popbill | 사업자 등록 확인 | Next.js API Route → 외부 API | ✅ 완료 |
| Kakao | 소셜 로그인 / 본인인증 / 2차 인증 | Next.js API Route → Kakao OAuth (세션 초기화 + prompt=login) | ✅ 완료 |
| AWS Cognito | 사용자 인증 (JWT) | Lambda → Cognito | ✅ 완료 |
| AWS S3 | 파일 업로드 | Presigned URL | ✅ 완료 |

---

## 3. 코드 존재하지만 미배포 (Lambda 소스 → AWS 미반영)

### 3-1. SAM 템플릿에 정의되었지만 미배포 (11개)

| 함수명 | 엔드포인트 | 소스 파일 |
|--------|-----------|----------|
| `KakaoLoginFunction` | POST /auth/kakao-login | `functions/auth/kakao-login.ts` |
| `GetTermsFunction` | GET /content/terms | `functions/content/terms.ts` |
| `UserBusinessResubmitFunction` | PUT /users/me/business | `functions/users/` |
| `AdminUsersSettingsFunction` | PUT /admin/users/{uid}/settings | `functions/admin/` |
| `AdminBusinessVerifyFunction` | PUT /admin/users/{uid}/business | `functions/admin/business-verify.ts` |
| `AdminDealsUpdateFunction` | PUT /admin/deals/{did}/update | `functions/admin/` |
| `AdminFaqsManageFunction` | CRUD /admin/faqs | `functions/admin/faqs-manage.ts` |
| `AdminFaqsSeedFunction` | POST /admin/faqs/seed | `functions/admin/faqs-seed.ts` |
| `AdminTermsManageFunction` | GET/PUT /admin/terms | `functions/admin/terms-manage.ts` |
| `TrackingApiLogFunction` | POST /tracking/api-log | `functions/tracking/log-api.ts` |
| `AdminBusinessAnalyticsFunction` | GET /admin/business-analytics | `functions/tracking/business-analytics.ts` |

### 3-2. 소스만 존재, SAM 템플릿에도 미등록 (11개)

| 소스 파일 | 예상 엔드포인트 | 기능 |
|----------|---------------|------|
| `admin/admins-manage.ts` | CRUD /admin/admins | 관리자 계정 CRUD |
| `admin/discounts-manage.ts` | CRUD /admin/discounts | 할인코드/쿠폰 CRUD |
| `admin/system-settings.ts` | GET/PUT /admin/settings | 시스템 설정 |
| `tracking/analytics.ts` | GET /admin/analytics | 트래킹 대시보드 |
| `tracking/api-logs.ts` | GET /admin/api-logs | API 로그 조회 |
| `tracking/events.ts` | POST /tracking/events | 이벤트 수집 |
| `uploads/presigned-url.ts` | POST /uploads/presigned-url | S3 presigned URL |
| `users/drafts.ts` | CRUD /users/me/drafts | 임시저장 |
| `users/payments.ts` | CRUD /users/me/payments | 결제 기록 |
| `users/settings.ts` | GET/PUT /users/me/settings | 사용자 설정 |

> **현재 이 22개 기능은 프론트엔드 API Route(BFF)에서 직접 DynamoDB를 호출하는 방식으로 동작 중.**
> Lambda 배포 시 BFF → Lambda 전환 필요.

---

## 4. 미구현 / 계획만 있는 기능

| 기능 | 문서 | 비고 |
|------|------|------|
| 배치 작업 (정산/대사) | `PLIC_BATCH_AND_JOBS_v1.1.md` | DRAFT 상태, 미구현 |
| 정산/대사 시스템 | `PLIC_RECONCILIATION_SETTLEMENT_v1.2.md` | 설계만 완료 |
| 성능 최적화 | `performance-optimization.plan.md` | 계획만 존재 |
| 푸시 알림 | PRD에 언급 | 미구현 |
| 자동 등급 승급 | 설계에 언급 | 수동 관리 중 |
| SMS/이메일 알림 | 설계에 언급 | 미구현 |

---

## 5. 알려진 제한사항 / 기술부채

### 보안

| 항목 | 현재 상태 | 위험도 |
|------|----------|--------|
| 관리자 비밀번호 | DynamoDB 평문 저장 (bcrypt 미사용) | 🔴 높음 |
| admin@plic.kr 강제 언락 | 코드에 하드코딩 | 🔴 높음 |
| KAKAO_AUTH_SECRET | SAM 템플릿에 평문 하드코딩 | 🟡 중간 |
| Admin API 인가 | API Gateway 레벨 인가 없음 (앱 레벨만) | 🟡 중간 |

### 아키텍처

| 항목 | 현재 상태 | 영향 |
|------|----------|------|
| BFF → DynamoDB 직접 접근 | Lambda 미배포 22개 기능은 Next.js에서 직접 DB 접근 | 보안/분리 미흡 |
| AdminUsersList 전체 Scan | 페이지네이션 없음 | 사용자 증가 시 성능 저하 |
| AdminDealsList 전체 Scan | 페이지네이션 없음 | 거래 증가 시 성능 저하 |
| DynamoDB 테이블 일부 수동 생성 | SAM 템플릿에 8개 테이블 미정의 | IaC 불완전 |

### 코드 품질

| 항목 | 수치 |
|------|------|
| TypeScript strict mode | ✅ 활성 |
| 남은 `any` 타입 | 3개 (의도적) |
| ESLint 경고 | 0 |
| E2E 테스트 | 189개 (Playwright) |
| 테스트 케이스 문서 | 1,008개 |

---

## 6. 프로젝트 구조

```
PLIC/
├── src/
│   ├── app/
│   │   ├── (customer)/          # 고객 페이지 (18개)
│   │   ├── admin/               # 관리자 페이지 (16개)
│   │   ├── landing/             # 랜딩 페이지
│   │   └── api/                 # BFF 프록시 (50개 라우트)
│   ├── components/
│   │   ├── common/              # 공통 (9개)
│   │   ├── auth/signup/         # 회원가입 (5개)
│   │   └── deal/                # 거래 (20개)
│   ├── stores/                  # Zustand 스토어 (9개)
│   ├── types/                   # TypeScript 타입 (7개)
│   ├── classes/                 # Helper 클래스 (5개)
│   └── lib/                     # 유틸리티
├── backend/
│   ├── plic/
│   │   ├── template.yaml        # SAM 템플릿 (소스)
│   │   └── functions/           # Lambda 소스 (.ts)
│   ├── lambda/                  # 배포된 Lambda (.js, 29개)
│   ├── template.yaml            # 빌드된 템플릿
│   └── samconfig.toml           # SAM 배포 설정
├── docs/                        # 문서
├── tests/                       # E2E 테스트
├── CLAUDE.md                    # 개발 규칙
├── HANDOVER.md                  # 인수인계 문서
└── FAQ_CONTENT.md               # 서비스 FAQ
```

---

## 7. 배포 방법

### 프론트엔드 (자동)
```
코드 수정 → git push → Vercel 자동 배포 → plic.kr 반영
```

### 백엔드 Lambda (수동)
```bash
cd backend/plic
sam build
sam deploy --profile plic
```

### 단일 함수 빠른 배포
```bash
aws lambda update-function-code \
  --function-name {함수명} \
  --zip-file fileb://function.zip \
  --profile plic
```

---

## 8. 주요 참고 문서 (현행)

| 문서 | 경로 | 용도 |
|------|------|------|
| 개발 규칙 | `CLAUDE.md` | 코딩 규칙, 모바일 프레임 레이아웃 |
| 인수인계 | `HANDOVER.md` | 인프라 정보, 접속 정보 |
| PRD | `docs/1.Design&Policy_PLIC_PRD_v1.4.md` | 요구사항 정의 |
| API 스펙 | `docs/1.Design&Policy_PLIC_API_SPEC_v1.2.md` | API 설계 |
| 상태머신 | `docs/1.Design&Policy_PLIC_STATE_MACHINES_v1.2.md` | 거래/사용자 상태 전이 |
| 아키텍처 | `docs/core/ARCHITECTURE.md` | 시스템 구조 |
| 거래 유형 | `docs/core/DEAL-TYPES.md` | 12가지 거래 유형 정의 |
| 코드 레지스트리 | `docs/core/REGISTRY.md` | 네이밍 규칙, 코드 위치 |
| 로드맵 | `docs/ROADMAP.md` | 개발 계획 |
| 테스트 케이스 | `docs/testing/PLIC_QA_TESTCASE_v1.0.md` | 1,008개 QA 시나리오 |

---

## 9. 변경 이력

### 2026-03-09 ~ 2026-03-10

| 항목 | 변경 내용 |
|------|----------|
| **Popbill 계좌 검증 수정** | SDK 기반 3가지 근본 원인 해결, 계좌조회 응답에서 API 반환값 사용, `POPBILL_IS_TEST` 환경변수 trim 처리 |
| **비밀번호 변경 기능** | Lambda + BFF + 프론트엔드 전체 구현 (마이페이지 → 설정 → 비밀번호 변경) |
| **카카오 5개 커밋 롤백** | KOE101/KOE205 에러 유발 커밋 5개 일괄 revert (1f5c2f2 버전 복원) |
| **탈퇴 회원 감지** | signup/kakao-login Lambda에서 DynamoDB 없음 + Cognito 존재 시 "탈퇴한 회원입니다" 반환 |
| **결제 에러 수정** | Softpayment 환경변수 Vercel 등록, `[object Object]` 에러 메시지 표시 수정 |
| **결제 한도 초과 모달** | S002/S003/S004 에러 시 전용 모달 + 카카오톡 상담 버튼 (http://pf.kakao.com/_xnQKhX) |
| **EditDealModal 월 한도 검증** | 거래 수정 시 월 사용한도 초과 검증 + 프로그레스 바 UI |
| **버튼 키컬러 변경** | 결제하기, 거래 신청하기 버튼 primary-400 → primary-600 |
| **Vercel 빌드 캐시** | generateBuildId 추가, vercel.json 설정으로 빌드 캐시 강제 무효화 |

### 2026-03-11

| 항목 | 변경 내용 |
|------|----------|
| **카카오 2차 인증 복원** | 카카오 인증 전 계정 로그아웃(세션 초기화) → prompt=login → 카카오톡 앱 2차 인증 정상 동작. `/api/kakao/auth` 2단계 분리 (`auth` → `auth-start`) |
| **직접 회원가입 카카오 인증 스텝 복원** | `kakaoVerify` 스텝 추가 (약관→카카오인증→회원정보→사업자→완료). KakaoVerifyStep 컴포넌트 연결 |
| **카카오 콜백 세션 무효화** | 콜백에서 `kakaoLogout()` 호출하여 액세스 토큰 즉시 무효화, `kakao_had_session` 쿠키로 재인증 시 세션 초기화 |
| **결제 한도 초과 모달** | S002/S003/S004 에러 시 "1회당 결제 가능 금액 초과" 전용 모달 + 카카오톡 상담 버튼 |
| **결제/거래 버튼 키컬러** | 결제하기, 거래 신청하기 버튼 primary-400 → primary-600 변경 |
| **EditDealModal 월 한도 검증** | 거래 수정 시 월 사용한도 초과 검증 + 프로그레스 바 UI |
| **탈퇴 회원 감지** | DynamoDB 없음 + Cognito 존재 시 "탈퇴한 회원입니다" 반환 (signup, kakao-login Lambda) |
