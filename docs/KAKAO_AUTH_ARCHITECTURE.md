# 카카오 인증 아키텍처

> 최종 업데이트: 2026-03-11

---

## 1. 개요

PLIC에서 카카오 인증은 3가지 플로우에서 사용됩니다:

| 플로우 | 진입점 | 용도 |
|--------|--------|------|
| 소셜 로그인 | `/auth/login` → "카카오로 시작하기" | 기존 회원 로그인 |
| 소셜 회원가입 | `/auth/login` → 카카오 인증 → 신규 회원 → `/auth/signup` | 신규 회원 가입 |
| 직접 회원가입 카카오 인증 | `/auth/signup` → 카카오 인증 스텝 | 본인 확인 |

---

## 2. 인증 플로우 (전체)

```
사용자 클릭 ("카카오로 인증하기" / "카카오로 시작하기")
  │
  ▼
/api/kakao/auth?returnTo=/auth/login (또는 /auth/signup)
  │
  ├── kakao_had_session 쿠키 있음 (이전 인증 이력)
  │     → kauth.kakao.com/oauth/logout (브라우저 세션 제거)
  │     → /api/kakao/auth-start
  │
  └── kakao_had_session 쿠키 없음 (첫 인증)
        → /api/kakao/auth-start (직접 이동)
  │
  ▼
/api/kakao/auth-start
  │  쿠키에서 returnTo 복원
  │  CSRF state 생성 (base64url JSON: { key, returnTo })
  │
  ▼
kauth.kakao.com/oauth/authorize
  │  prompt=login (매번 로그인 폼 강제)
  │  scope=profile_nickname account_email
  │
  ▼
카카오 로그인 페이지 (ID/PW 입력)
  │
  ▼
카카오톡 앱 2차 인증 (앱 푸시)
  │  * 브라우저 세션이 초기화된 상태이므로 자동 스킵되지 않음
  │
  ▼
/api/kakao/callback?code=xxx&state=xxx
  │
  ├── 1. 인가 코드로 액세스 토큰 발급 (getKakaoAccessToken)
  ├── 2. 사용자 정보 조회 (getKakaoUserInfo)
  ├── 3. 카카오 세션 즉시 무효화 (kakaoLogout - 액세스 토큰 만료)
  ├── 4. 인증 결과 DynamoDB 저장 (plic-kakao-verifications, TTL 10분)
  ├── 5. kakao_had_session 쿠키 설정 (30일, 다음 인증 시 세션 초기화용)
  │
  ▼
returnTo 페이지로 리다이렉트
  │  ?verified=true&verificationKey=xxx
  │
  ├── /auth/login → handleKakaoAutoLogin → 기존 회원이면 로그인, 신규면 signup으로
  └── /auth/signup → kakaoVerify 스텝 → info 스텝으로 자동 이동 (이메일/이름 자동 입력)
```

---

## 3. 카카오 세션 3계층 구조

2차 인증이 매번 정상 동작하려면 3개 계층 모두 처리해야 합니다.

| 계층 | 위치 | 해제 방법 | 해제 시점 |
|------|------|----------|----------|
| **액세스 토큰** | 카카오 서버 | `kakaoLogout()` (`/v1/user/logout`) | 콜백에서 사용자 정보 조회 후 즉시 |
| **브라우저 세션 쿠키** | `kauth.kakao.com` | `/oauth/logout` 리다이렉트 | 다음 인증 시작 전 (`/api/kakao/auth`) |
| **로그인 폼 캐시** | 브라우저 | `prompt: 'login'` 파라미터 | OAuth authorize 요청 시 |

### 왜 3개 모두 필요한가

- **액세스 토큰만 무효화**: 브라우저 세션 쿠키가 남아 기기가 "신뢰됨"으로 인식 → 2차 인증 자동 승인
- **prompt=login만 사용**: 로그인 폼은 뜨지만, 브라우저 세션이 남아있으면 2차 인증 자동 스킵
- **브라우저 로그아웃만 수행**: 로그인 후 세션이 다시 생성되어 다음 인증에 영향

---

## 4. API 라우트 구조

### /api/kakao/auth (세션 정리 + 라우팅)

```
파일: src/app/api/kakao/auth/route.ts
역할: 카카오 인증 진입점. 이전 세션 존재 여부에 따라 분기
쿠키: kakao_return_to (returnTo 저장), kakao_had_session (확인용)
```

### /api/kakao/auth-start (OAuth 시작)

```
파일: src/app/api/kakao/auth-start/route.ts
역할: 실제 OAuth 인증 시작. state 생성 후 카카오 authorize URL로 리다이렉트
쿠키: kakao_auth_state (CSRF 검증용), kakao_return_to (읽기)
```

### /api/kakao/callback (콜백 처리)

```
파일: src/app/api/kakao/callback/route.ts
역할: 인가 코드 → 토큰 → 사용자 정보 → DynamoDB 저장 → returnTo 리다이렉트
쿠키: kakao_had_session (설정), kakao_auth_state/kakao_return_to (삭제)
```

### /api/kakao/result (인증 결과 조회)

```
파일: src/app/api/kakao/result/route.ts
역할: DynamoDB에서 verificationKey로 인증 결과 조회 (프론트엔드 → API)
```

---

## 5. 카카오 개발자 콘솔 설정

### 필수 설정 항목

| 설정 | 위치 | 값 |
|------|------|-----|
| 카카오 로그인 | 활성화 | 설정함 |
| 동의항목 | profile_nickname, account_email | 설정함 |
| 리다이렉트 URI | 카카오 로그인 > 리다이렉트 URI | `https://www.plic.kr/api/kakao/callback` |
| 로그아웃 리다이렉트 URI | 카카오 로그인 > 고급 | `https://www.plic.kr/api/kakao/auth-start` |

### 미설정 (별도 신청 필요)

| 설정 | 상태 | 비고 |
|------|------|------|
| 카카오 인증서 | 미설정 | `prompt=cert` 사용 시 KOE216 에러. 별도 사업 제휴 필요 |
| 간편가입 | 미설정 | - |

---

## 6. 환경변수

| 변수명 | 용도 | 위치 |
|--------|------|------|
| `KAKAO_REST_API_KEY` | REST API 키 (OAuth client_id) | Vercel Production |
| `KAKAO_CLIENT_SECRET` | 클라이언트 시크릿 (토큰 발급 시) | Vercel Production |
| `KAKAO_ADMIN_KEY` | Admin 키 (선택) | Vercel Production |
| `NEXT_PUBLIC_BASE_URL` | `https://www.plic.kr` (리다이렉트 URI 생성) | Vercel Production |
| `AWS_ACCESS_KEY_ID` | DynamoDB 접근 (인증 결과 저장/조회) | Vercel Production |
| `AWS_SECRET_ACCESS_KEY` | DynamoDB 접근 | Vercel Production |
| `AWS_REGION` | `ap-northeast-2` | Vercel Production |

---

## 7. DynamoDB 테이블

| 테이블 | 용도 | TTL |
|--------|------|-----|
| `plic-kakao-verifications` | 카카오 인증 결과 임시 저장 | 10분 (600초) |

**스키마:**
```
PK: verificationKey (string) - "kakao_{timestamp}_{random}"
Fields: kakaoId (number), nickname (string), email (string), verifiedAt (string), ttl (number)
```

---

## 8. 트러블슈팅 가이드

### KOE 에러 코드

| 에러 | 원인 | 해결 |
|------|------|------|
| **KOE007** | 로그아웃 리다이렉트 URI 미등록 또는 불일치 | 카카오 콘솔 → 고급 → `https://www.plic.kr/api/kakao/auth-start` 정확히 등록 |
| **KOE101** | 잘못된 앱 키 (client_id) | `KAKAO_REST_API_KEY` 환경변수 확인 |
| **KOE205** | 미설정 동의항목을 scope에 포함 | scope를 `profile_nickname account_email`만 사용 |
| **KOE216** | 카카오 인증서 서비스 미설정 상태에서 `prompt=cert` 사용 | `prompt=cert` 제거, `prompt=login`만 사용 |

### 2차 인증이 자동 스킵되는 경우

1. `/api/kakao/auth`에서 `/oauth/logout`을 거치지 않음 → 브라우저 세션 잔존
2. 콜백에서 `kakaoLogout()` 누락 → 액세스 토큰 잔존
3. `prompt: 'login'` 누락 → 로그인 폼 캐시로 자동 인증

### 로그아웃 확인 페이지가 뜨는 경우

- 원인: 이전 카카오 세션이 브라우저에 남아있음
- 정상 동작: `kakao_had_session` 쿠키가 있을 때만 로그아웃 경유
- 첫 인증 시에는 로그아웃 페이지 없이 바로 로그인 폼으로 이동

---

## 9. 시행착오 기록

| # | 시도 | 결과 | 교훈 |
|---|------|------|------|
| 1 | `prompt: 'login'`만 추가 | 로그인 폼 표시되지만 2차 인증 자동 스킵 | 브라우저 세션 쿠키까지 처리 필요 |
| 2 | `kakaoLogout()` 콜백에 추가 | 여전히 2차 인증 스킵 | 액세스 토큰 ≠ 브라우저 세션 |
| 3 | `prompt: 'login,cert'` | KOE216 에러 | `cert`는 별도 사업 제휴 필요, REST API 미지원 |
| 4 | 인증 전 `/oauth/logout` 항상 수행 | 2차 인증 동작하지만 "로그아웃 하시겠습니까?" 확인 페이지 UX 문제 | 항상 로그아웃은 UX 저하 |
| 5 | `kakao_had_session` 쿠키로 조건부 로그아웃 | 첫 인증 시 로그아웃 페이지 없음 + 재인증 시 세션 초기화 | **최종 채택** |
