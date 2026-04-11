# 백엔드 협업 요청: JWT httpOnly 쿠키 마이그레이션

> **요청일**: 2026-02-04
> **요청자**: Frontend Team
> **우선순위**: P1 (High)
> **예상 작업량**: 백엔드 1일

---

## TL;DR

프론트엔드에서 JWT 토큰을 httpOnly 쿠키로 저장하는 작업을 완료했습니다.
백엔드에서 **CORS 설정만 추가**해주시면 바로 적용 가능합니다.

---

## 프론트엔드 준비 상태

```
✅ API Route 프록시 구현 완료
   - /api/auth/login
   - /api/auth/logout
   - /api/auth/refresh
   - /api/auth/me

✅ httpOnly 쿠키 설정 완료
   - plic_access_token (1시간)
   - plic_refresh_token (7일)
   - Secure, SameSite=Lax

✅ secureAuth 유틸리티 구현 완료
   - credentials: 'include' 적용
   - 401 시 자동 토큰 갱신
```

---

## 백엔드 필요 작업

### 필수: CORS 설정

```javascript
// Express.js 예시
app.use(cors({
  origin: [
    'https://plic.kr',
    'https://www.plic.kr',
    'http://localhost:3000'  // 개발용
  ],
  credentials: true  // ⚠️ 필수!
}));
```

```python
# FastAPI 예시
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://plic.kr", "https://www.plic.kr", "http://localhost:3000"],
    allow_credentials=True,  # ⚠️ 필수!
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 선택: 백엔드에서 직접 쿠키 설정 (더 안전)

현재 방식은 프론트엔드 API Route에서 쿠키를 설정하지만,
백엔드에서 직접 Set-Cookie 헤더를 설정하면 더 안전합니다.

```http
# 로그인 응답에 Set-Cookie 추가
HTTP/1.1 200 OK
Set-Cookie: plic_access_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=3600; Path=/
Set-Cookie: plic_refresh_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/

{"success": true, "user": {...}}
```

---

## 테스트 방법

1. CORS 설정 후 프론트엔드 개발자에게 알림
2. 프론트엔드에서 통합 테스트 진행
3. 브라우저 개발자 도구 > Application > Cookies에서 httpOnly 확인

---

## 상세 문서

전체 설계서: `docs/02-design/features/jwt-httponly-migration.design.md`

---

## 연락처

질문이 있으시면 프론트엔드 팀에 문의해주세요.
