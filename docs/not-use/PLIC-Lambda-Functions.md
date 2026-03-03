# PLIC Lambda 함수 전체 분석

## 인프라 개요

| 항목 | 값 |
|------|-----|
| IaC | AWS SAM |
| Runtime | Node.js 20.x (x86_64, esbuild) |
| Region | ap-northeast-2 (Seoul) |
| API Gateway | `https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod` |
| SAM 템플릿 | `backend/plic/template.yaml` |

---

## DynamoDB 테이블 (14개)

| 테이블 | 용도 |
|--------|------|
| `plic-users` | 사용자 계정 |
| `plic-deals` | 거래 기록 |
| `plic-admins` | 관리자 계정 |
| `plic-contents` | 배너/공지/FAQ/약관 (pk/sk 패턴) |
| `plic-withdrawn-users` | 탈퇴 회원 보관 (5년 법적 보관) |
| `plic-withdrawn-deals` | 탈퇴 회원 거래 보관 |
| `plic-discounts` | 할인코드/쿠폰 |
| `plic-events` | 트래킹 이벤트 (TTL 30일) |
| `plic-api-logs` | API 호출 로그 (TTL 30일) |
| `plic-drafts` | 송금 임시저장 |
| `plic-payments` | 결제 기록 |
| `plic-settings` | 시스템 설정 |
| `plic-kakao-verifications` | 카카오 OAuth 인증키 |

---

## Lambda 함수 목록 (총 50개)

### 1. 인증 (Authentication) — 6개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 1 | `SignupFunction` | `POST /auth/signup` | 회원가입 (Cognito + DynamoDB). 카카오 인증 가입 지원 |
| 2 | `ConfirmFunction` | `POST /auth/confirm` | 이메일 인증코드 확인 |
| 3 | `LoginFunction` | `POST /auth/login` | 이메일/비밀번호 로그인 (Cognito) |
| 4 | `KakaoLoginFunction` | `POST /auth/kakao-login` | 카카오 소셜 로그인. httpOnly 쿠키 발급 |
| 5 | `RefreshFunction` | `POST /auth/refresh` | JWT 토큰 갱신 |
| 6 | `LogoutFunction` | `POST /auth/logout` | 전체 토큰 무효화 (GlobalSignOut) |

### 2. 사용자 관리 (Users) — 6개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 7 | `GetMeFunction` | `GET /users/me` | 내 프로필 조회 |
| 8 | `UpdateMeFunction` | `PUT /users/me` | 내 프로필 수정 |
| 9 | `WithdrawFunction` | `DELETE /users/me` | 회원 탈퇴 (아카이빙 + Cognito 삭제) |
| 10 | `GetGradeFunction` | `GET /users/me/grade` | 등급/수수료율/한도 조회 |
| 11 | `UserBusinessResubmitFunction` | `PUT /users/me/business` | 사업자 인증 재제출 |
| 12 | `UserSettingsFunction` | `GET/PUT /users/me/settings` | 알림 설정/즐겨찾기 계좌 관리 |

### 3. 거래 관리 (Deals) — 5개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 13 | `ListDealsFunction` | `GET /deals` | 내 거래 목록 조회 |
| 14 | `GetDealFunction` | `GET /deals/{did}` | 거래 상세 조회 |
| 15 | `CreateDealFunction` | `POST /deals` | 송금 신청 생성 |
| 16 | `UpdateDealFunction` | `PUT /deals/{did}` | 거래 수정 |
| 17 | `CancelDealFunction` | `DELETE /deals/{did}` | 거래 취소 |

### 4. 할인/쿠폰 (Discounts) — 3개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 18 | `ValidateDiscountFunction` | `POST /discounts/validate` | 할인코드 유효성 검증 |
| 19 | `GetCouponsFunction` | `GET /discounts/coupons` | 활성 쿠폰 목록 조회 |
| 20 | `ApplyDiscountFunction` | `POST /deals/{did}/discount` | 거래에 할인 적용 |

### 5. 콘텐츠/CMS (Content) — 5개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 21 | `GetBannersFunction` | `GET /content/banners` | 배너 조회 |
| 22 | `GetNoticesFunction` | `GET /content/notices` | 공지사항 목록 |
| 23 | `GetNoticeDetailFunction` | `GET /content/notices/{id}` | 공지 상세 |
| 24 | `GetFaqsFunction` | `GET /content/faqs` | FAQ 목록 |
| 25 | `GetTermsFunction` | `GET /content/terms/{type}` | 약관 조회 (service/privacy/electronic/marketing) |

### 6. 파일 업로드 (Uploads) — 1개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 26 | `PresignedUrlFunction` | `POST /uploads/presigned-url` | S3 presigned URL 생성 (최대 50MB, 5분 만료) |

### 7. 관리자 — 인증 및 사용자 관리 (Admin Users) — 7개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 27 | `AdminLoginFunction` | `POST /admin/auth/login` | 관리자 로그인 (HMAC 세션토큰, 24h) |
| 28 | `AdminUsersListFunction` | `GET /admin/users` | 전체 사용자 목록 |
| 29 | `AdminUsersGetFunction` | `GET /admin/users/{uid}` | 사용자 상세 (거래내역 포함) |
| 30 | `AdminUsersStatusFunction` | `PUT /admin/users/{uid}/status` | 사용자 상태 변경 |
| 31 | `AdminUsersGradeFunction` | `PUT /admin/users/{uid}/grade` | 사용자 등급 변경 |
| 32 | `AdminUsersSettingsFunction` | `PUT /admin/users/{uid}/settings` | 사용자별 설정 변경 |
| 33 | `AdminBusinessVerifyFunction` | `PUT /admin/users/{uid}/business` | 사업자 인증 승인/거절 |

### 8. 관리자 — 거래 관리 (Admin Deals) — 4개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 34 | `AdminDealsListFunction` | `GET /admin/deals` | 전체 거래 목록 |
| 35 | `AdminDealsGetFunction` | `GET /admin/deals/{did}` | 거래 상세 (사용자 정보 포함) |
| 36 | `AdminDealsStatusFunction` | `PUT /admin/deals/{did}/status` | 거래 상태 변경 |
| 37 | `AdminDealsUpdateFunction` | `PUT /admin/deals/{did}/update` | 거래 정보 수정 |

### 9. 관리자 — 콘텐츠/시스템 (Admin Content & System) — 6개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 38 | `AdminFaqsManageFunction` | `CRUD /admin/faqs` | FAQ CRUD |
| 39 | `AdminFaqsSeedFunction` | `POST /admin/faqs/seed` | FAQ 초기 데이터 시딩 |
| 40 | `AdminTermsManageFunction` | `GET/PUT /admin/terms/{type}` | 약관 관리 |
| 41 | `AdminSystemSettingsFunction` | `GET/PUT /admin/settings` | 시스템 설정 (수수료율, 한도, 유지보수모드 등) |
| 42 | `AdminAdminsManageFunction` | `CRUD /admin/admins` | 관리자 계정 CRUD |
| 43 | `AdminDiscountsManageFunction` | `CRUD /admin/discounts` | 할인코드/쿠폰 CRUD |

### 10. 분석/트래킹 (Analytics & Tracking) — 5개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 44 | `TrackingEventsFunction` | `POST /tracking/events` | 프론트엔드 이벤트 수집 (pageview/click/funnel/error) |
| 45 | `TrackingApiLogFunction` | `POST /tracking/api-log` | API 호출 로그 기록 |
| 46 | `AdminAnalyticsFunction` | `GET /admin/analytics` | 트래킹 대시보드 (세션, 디바이스, 일별 트렌드) |
| 47 | `AdminApiLogsFunction` | `GET /admin/api-logs` | API 모니터링 (에러율, 느린 요청, 시간별 트렌드) |
| 48 | `AdminBusinessAnalyticsFunction` | `GET /admin/business-analytics` | 비즈니스 KPI (매출, 전환율, 등급 분포) |

### 11. 임시저장/결제 (Drafts & Payments) — 2개

| # | 함수명 | 트리거 | 역할 |
|---|--------|--------|------|
| 49 | `UserDraftsFunction` | `CRUD /users/me/drafts` | 송금 임시저장 CRUD |
| 50 | `UserPaymentsFunction` | `CRUD /users/me/payments` | 결제 기록 관리 |

---

## 전체 API 엔드포인트 목록

### 인증

```
POST   /auth/signup
POST   /auth/confirm
POST   /auth/login
POST   /auth/kakao-login
POST   /auth/refresh
POST   /auth/logout
```

### 사용자

```
GET    /users/me
PUT    /users/me
DELETE /users/me
GET    /users/me/grade
PUT    /users/me/business
GET    /users/me/settings
PUT    /users/me/settings
GET    /users/me/drafts
GET    /users/me/drafts/{draftId}
POST   /users/me/drafts
PUT    /users/me/drafts/{draftId}
DELETE /users/me/drafts/{draftId}
GET    /users/me/payments
GET    /users/me/payments/{paymentId}
POST   /users/me/payments
PUT    /users/me/payments/{paymentId}
```

### 거래

```
GET    /deals
GET    /deals/{did}
POST   /deals
PUT    /deals/{did}
DELETE /deals/{did}
POST   /deals/{did}/discount
```

### 할인/쿠폰

```
POST   /discounts/validate
GET    /discounts/coupons
```

### 콘텐츠

```
GET    /content/banners
GET    /content/notices
GET    /content/notices/{id}
GET    /content/faqs
GET    /content/terms
GET    /content/terms/{type}
```

### 파일 업로드

```
POST   /uploads/presigned-url
```

### 트래킹

```
POST   /tracking/events
POST   /tracking/api-log
```

### 관리자

```
POST   /admin/auth/login

GET    /admin/users
GET    /admin/users/{uid}
PUT    /admin/users/{uid}/status
PUT    /admin/users/{uid}/grade
PUT    /admin/users/{uid}/settings
PUT    /admin/users/{uid}/business

GET    /admin/deals
GET    /admin/deals/{did}
PUT    /admin/deals/{did}/status
PUT    /admin/deals/{did}/update

GET    /admin/faqs
POST   /admin/faqs
GET    /admin/faqs/{id}
PUT    /admin/faqs/{id}
DELETE /admin/faqs/{id}
POST   /admin/faqs/seed

GET    /admin/terms
GET    /admin/terms/{type}
PUT    /admin/terms/{type}

GET    /admin/settings
PUT    /admin/settings

GET    /admin/admins
POST   /admin/admins
GET    /admin/admins/{adminId}
PUT    /admin/admins/{adminId}
DELETE /admin/admins/{adminId}

GET    /admin/discounts
POST   /admin/discounts
GET    /admin/discounts/{discountId}
PUT    /admin/discounts/{discountId}
DELETE /admin/discounts/{discountId}

GET    /admin/analytics
GET    /admin/api-logs
GET    /admin/business-analytics
```

---

## 주요 참고사항

1. **모든 함수가 API Gateway 트리거** — 스케줄/스트림 트리거는 없음
2. **프론트엔드 프록시**: Next.js `/api/*` 라우트가 Lambda API Gateway로 포워딩
3. **외부 연동**: SoftPayment(`papi.softment.co.kr`), Popbill API는 Lambda가 아닌 프론트엔드에서 직접 호출
4. **관리자 인증**: DynamoDB 기반 HMAC 세션토큰 (Cognito 미사용)
5. **사용자 인증**: AWS Cognito 기반 JWT
6. **파일 업로드**: S3 presigned URL 방식 (버킷: `plic-uploads-prod`)
