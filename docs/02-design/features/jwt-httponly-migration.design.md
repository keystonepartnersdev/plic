# JWT httpOnly 쿠키 마이그레이션 설계서

> **작성일**: 2026-02-04
> **상태**: 백엔드 협업 대기
> **우선순위**: P1 (High)
> **관련 리팩토링**: Phase 1.2 - 토큰 저장 방식 개선

---

## 1. 개요

### 1.1 목적
JWT 토큰을 localStorage에서 httpOnly 쿠키로 마이그레이션하여 XSS 공격으로부터 토큰을 보호합니다.

### 1.2 현재 문제점
| 항목 | 현재 상태 | 위험도 |
|------|----------|--------|
| Access Token 저장 | localStorage | High (XSS 취약) |
| Refresh Token 저장 | localStorage | Critical (XSS 취약) |
| 토큰 전송 | Authorization Header | Medium |

### 1.3 목표 상태
| 항목 | 변경 후 | 보안 수준 |
|------|---------|----------|
| Access Token 저장 | httpOnly Cookie | Secure |
| Refresh Token 저장 | httpOnly Cookie | Secure |
| 토큰 전송 | 쿠키 자동 포함 | Secure |

---

## 2. 프론트엔드 현재 구현 상태 (완료)

### 2.1 API Route 프록시 (구현 완료)

```
src/app/api/auth/
├── login/route.ts     ✅ httpOnly 쿠키 설정 준비
├── logout/route.ts    ✅ 쿠키 삭제 준비
├── refresh/route.ts   ✅ 토큰 갱신 준비
└── me/route.ts        ✅ 쿠키 기반 인증 확인 준비
```

### 2.2 secureAuth 유틸리티 (구현 완료)

**파일**: `src/lib/auth.ts`

```typescript
export const secureAuth = {
  login: async (email, password) => { ... },    // ✅
  logout: async () => { ... },                   // ✅
  refresh: async () => { ... },                  // ✅
  getMe: async () => { ... },                    // ✅
  fetchWithAuth: async (url, options) => { ... } // ✅ 401 시 자동 갱신
};
```

### 2.3 쿠키 설정 (준비 완료)

```typescript
// src/app/api/auth/login/route.ts
const TOKEN_CONFIG = {
  ACCESS_TOKEN_NAME: 'plic_access_token',
  REFRESH_TOKEN_NAME: 'plic_refresh_token',
  ACCESS_TOKEN_MAX_AGE: 60 * 60,        // 1시간
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7일
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax',
};

// 쿠키 설정 예시
response.cookies.set(TOKEN_CONFIG.ACCESS_TOKEN_NAME, data.accessToken, {
  httpOnly: true,
  secure: TOKEN_CONFIG.SECURE,
  sameSite: TOKEN_CONFIG.SAME_SITE,
  maxAge: TOKEN_CONFIG.ACCESS_TOKEN_MAX_AGE,
  path: '/',
});
```

---

## 3. 백엔드 API 변경 요청사항

### 3.1 인증 응답 형식 변경

#### 현재 (추정)
```json
{
  "success": true,
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { "uid": "...", "email": "..." }
}
```

#### 변경 필요 없음 (프론트엔드에서 처리)
현재 응답 형식 그대로 유지해도 됩니다. 프론트엔드 API Route에서 토큰을 httpOnly 쿠키로 변환합니다.

### 3.2 (선택) 백엔드에서 직접 쿠키 설정

더 안전한 방식으로, 백엔드에서 직접 Set-Cookie 헤더를 설정할 수 있습니다:

```http
POST /auth/login
Content-Type: application/json

Response:
HTTP/1.1 200 OK
Set-Cookie: plic_access_token=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Max-Age=3600; Path=/
Set-Cookie: plic_refresh_token=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/

{
  "success": true,
  "user": { "uid": "...", "email": "..." }
}
```

### 3.3 토큰 검증 방식

#### Option A: 쿠키에서 토큰 읽기 (권장)
```
GET /users/me
Cookie: plic_access_token=eyJhbG...
```

백엔드에서 `Cookie` 헤더에서 토큰을 파싱하여 검증

#### Option B: Authorization 헤더 유지 (현재)
```
GET /users/me
Authorization: Bearer eyJhbG...
```

프론트엔드 API Route에서 쿠키를 읽어 Authorization 헤더로 변환

---

## 4. 마이그레이션 방식 선택

### Option A: 프론트엔드 프록시 방식 (현재 준비됨)

```
[브라우저] ---> [Next.js API Route] ---> [백엔드 API]
                (쿠키 <-> 토큰 변환)
```

**장점**:
- 백엔드 변경 최소화
- 기존 API 호환성 유지

**단점**:
- 모든 인증 요청이 프록시 경유
- 약간의 지연 발생

### Option B: 백엔드 직접 쿠키 설정

```
[브라우저] <---(Set-Cookie)---> [백엔드 API]
```

**장점**:
- 직접 통신으로 빠름
- 프록시 불필요

**단점**:
- 백엔드 변경 필요
- CORS 설정 필요 (`credentials: true`)

---

## 5. CORS 설정 (백엔드)

httpOnly 쿠키를 사용하려면 백엔드에서 다음 CORS 설정이 필요합니다:

```javascript
// 예시: Express.js
app.use(cors({
  origin: [
    'https://plic.kr',
    'https://www.plic.kr',
    'http://localhost:3000'
  ],
  credentials: true, // 필수!
}));
```

---

## 6. 체크리스트

### 프론트엔드 (완료)
- [x] API Route 프록시 생성 (`/api/auth/*`)
- [x] secureAuth 유틸리티 구현
- [x] 쿠키 설정 로직 구현
- [x] credentials: 'include' 적용
- [ ] 기존 tokenManager 코드 제거 (마이그레이션 완료 후)

### 백엔드 (협업 필요)
- [ ] CORS credentials 설정
- [ ] (선택) Set-Cookie 헤더 직접 설정
- [ ] (선택) Cookie 기반 인증 지원
- [ ] 토큰 갱신 엔드포인트 확인 (`/auth/refresh`)

---

## 7. 테스트 시나리오

### 7.1 로그인 플로우
1. 사용자가 이메일/비밀번호 입력
2. `/api/auth/login` 호출
3. 백엔드 인증 성공
4. httpOnly 쿠키로 토큰 저장
5. 브라우저 개발자 도구에서 토큰 값 숨김 확인

### 7.2 인증 요청 플로우
1. 인증 필요한 API 호출
2. 쿠키가 자동으로 포함됨
3. 백엔드에서 쿠키/헤더로 인증 확인

### 7.3 토큰 갱신 플로우
1. Access Token 만료 (1시간)
2. 401 응답 수신
3. `/api/auth/refresh` 자동 호출
4. 새 토큰으로 쿠키 갱신
5. 원래 요청 재시도

### 7.4 로그아웃 플로우
1. `/api/auth/logout` 호출
2. httpOnly 쿠키 삭제 (maxAge: 0)
3. 클라이언트 상태 초기화

---

## 8. 보안 고려사항

### 8.1 CSRF 방지
- `SameSite=Lax` 설정으로 기본 CSRF 방지
- 필요 시 CSRF 토큰 추가 가능

### 8.2 XSS 방지
- httpOnly 쿠키로 JavaScript 접근 차단
- 토큰 값이 브라우저 콘솔에 노출되지 않음

### 8.3 Secure 플래그
- Production: `Secure=true` (HTTPS만)
- Development: `Secure=false` (HTTP 허용)

---

## 9. 일정 제안

| 단계 | 담당 | 예상 기간 |
|------|------|----------|
| 1. 백엔드 CORS 설정 | Backend | 1일 |
| 2. 통합 테스트 | Frontend + Backend | 1일 |
| 3. 기존 코드 정리 | Frontend | 0.5일 |
| 4. QA | QA | 1일 |

**총 예상 기간**: 3.5일

---

## 10. 연락처

### 프론트엔드
- 담당자: [프론트엔드 개발자]
- 관련 파일: `src/lib/auth.ts`, `src/app/api/auth/*`

### 백엔드
- 담당자: [백엔드 개발자]
- 필요 작업: CORS 설정, (선택) 쿠키 기반 인증

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-04 | 최초 작성 - 백엔드 협업 요청 문서 |
