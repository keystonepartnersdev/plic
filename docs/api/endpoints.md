# PLIC API 엔드포인트 문서

> **버전**: 1.0
> **작성일**: 2026-02-05

---

## 개요

PLIC API는 두 레이어로 구성됩니다:
1. **BFF (Backend For Frontend)**: Next.js API Routes (`/api/*`)
2. **Backend Lambda**: AWS API Gateway (`https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod`)

---

## BFF 엔드포인트 (프론트엔드 → Next.js)

### 헬스체크

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서비스 상태 확인 |

**응답 예시:**
```json
{
  "status": "healthy",
  "version": "1.2.0",
  "timestamp": "2026-02-05T10:00:00.000Z",
  "environment": "production",
  "services": {
    "frontend": "ok",
    "backend": "ok"
  },
  "uptime": 3600
}
```

---

### 인증 (Auth)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/auth/login` | 로그인 | - |
| POST | `/api/auth/logout` | 로그아웃 | 필수 |
| POST | `/api/auth/refresh` | 토큰 갱신 | Cookie |
| GET | `/api/auth/me` | 내 정보 조회 | 필수 |
| POST | `/api/auth/kakao-login` | 카카오 로그인 | - |

#### POST /api/auth/login

**요청:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**성공 응답:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "...",
      "email": "user@example.com",
      "name": "홍길동",
      "grade": "basic"
    }
  }
}
```
+ `Set-Cookie: plic_access_token=...; HttpOnly`
+ `Set-Cookie: plic_refresh_token=...; HttpOnly`

---

### 카카오 OAuth

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/kakao/auth` | OAuth 시작 (리다이렉트) |
| GET | `/api/kakao/callback` | OAuth 콜백 |
| GET | `/api/kakao/result` | 인증 결과 확인 |

---

### 결제 (Payments)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/payments/[trxId]` | 결제 조회 | 필수 |
| POST | `/api/payments/[trxId]/cancel` | 결제 취소 | 필수 |
| POST | `/api/payments/billing` | 빌링 결제 | 필수 |
| POST | `/api/payments/billing-key/create` | 빌링키 생성 | 필수 |
| POST | `/api/payments/billing-key/callback` | 빌링키 콜백 | - |
| POST | `/api/payments/billing-key/pay` | 빌링키 결제 | 필수 |
| POST | `/api/payments/callback` | 결제 콜백 | - |

---

### Popbill 인증

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/popbill/business/verify` | 사업자등록번호 인증 | - |
| POST | `/api/popbill/account/verify` | 계좌 실명 인증 | - |

#### POST /api/popbill/business/verify

**요청:**
```json
{
  "businessNumber": "1234567890"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "business": {
      "name": "주식회사 예시",
      "representative": "홍길동",
      "status": "active"
    }
  }
}
```

---

### 웹훅

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/webhooks/softpayment` | Softpayment PG 웹훅 |

---

## 백엔드 Lambda 엔드포인트

### 사용자 (Users)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/users/me` | 내 정보 조회 |
| PUT | `/users/me` | 내 정보 수정 |
| DELETE | `/users/me` | 회원 탈퇴 |
| GET | `/users/me/grade` | 등급/수수료 조회 |

### 거래 (Deals)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/deals` | 거래 목록 |
| POST | `/deals` | 거래 생성 |
| GET | `/deals/:did` | 거래 상세 |
| PUT | `/deals/:did` | 거래 수정 |
| DELETE | `/deals/:did` | 거래 취소 |
| POST | `/deals/:did/discount` | 할인 적용 |

### 할인 (Discounts)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/discounts/validate` | 할인코드 검증 |
| GET | `/discounts/coupons` | 내 쿠폰 목록 |

### 콘텐츠 (Content)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/content/banners` | 배너 목록 |
| GET | `/content/notices` | 공지사항 목록 |
| GET | `/content/notices/:id` | 공지사항 상세 |
| GET | `/content/faqs` | FAQ 목록 |
| GET | `/content/terms` | 약관 목록 |
| GET | `/content/terms/:type` | 약관 상세 |

### 업로드 (Uploads)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/uploads/presigned-url` | S3 업로드 URL 생성 |

---

## 어드민 API

### 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/admin/auth/login` | 관리자 로그인 |

### 회원 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/users` | 회원 목록 |
| GET | `/admin/users/:uid` | 회원 상세 |
| PUT | `/admin/users/:uid/status` | 상태 변경 |
| PUT | `/admin/users/:uid/grade` | 등급 변경 |
| PUT | `/admin/users/:uid/business` | 사업자 인증 처리 |

### 거래 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/deals` | 거래 목록 |
| GET | `/admin/deals/:did` | 거래 상세 |
| PUT | `/admin/deals/:did/status` | 상태 변경 |

### 콘텐츠 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/admin/banners` | 배너 관리 |
| PUT/DELETE | `/admin/banners/:id` | 배너 수정/삭제 |
| GET/POST | `/admin/notices` | 공지사항 관리 |
| PUT/DELETE | `/admin/notices/:id` | 공지사항 수정/삭제 |
| GET/POST | `/admin/faqs` | FAQ 관리 |
| PUT/DELETE | `/admin/faqs/:id` | FAQ 수정/삭제 |
| GET/POST | `/admin/discounts` | 할인코드 관리 |
| PUT/DELETE | `/admin/discounts/:id` | 할인코드 수정/삭제 |
| GET/PUT | `/admin/terms/:type` | 약관 관리 |

### 관리자 계정

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/admin/admins` | 관리자 계정 관리 |
| GET/PUT/DELETE | `/admin/admins/:id` | 관리자 수정/삭제 |

### 분석

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/analytics` | 분석 데이터 |
| GET | `/admin/api-logs` | API 로그 |

---

## 인증 방식

### 사용자 인증
- **방식**: httpOnly Cookie + JWT
- **Access Token**: `plic_access_token` (1시간)
- **Refresh Token**: `plic_refresh_token` (7일)

### 관리자 인증
- **방식**: Bearer Token (localStorage)
- **헤더**: `Authorization: Bearer {token}`

---

## 관련 파일

- API 클라이언트: `src/lib/api.ts`
- 에러 코드: `docs/api/error-codes.md`
- 검증 스키마: `src/lib/validations/index.ts`
