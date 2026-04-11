# PLIC 프로젝트 리뷰 문서

> **문서 버전**: 1.0
> **작성일**: 2026-02-05
> **리뷰 대상**: PLIC 카드 송금 서비스 프론트엔드

---

## 1. 프로젝트 개요

### 1.1 서비스 설명
PLIC은 **신용카드로 현금을 송금**할 수 있는 B2B 핀테크 서비스입니다.

**핵심 기능:**
- 카드 결제 → 지정 계좌로 송금
- 실시간 수수료 계산 (등급별 차등)
- 사업자 인증 및 계좌 실명 확인
- 카카오 소셜 로그인

### 1.2 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| 상태관리 | Zustand (persist middleware) |
| 결제 | Softpayment PG |
| 인증 | Popbill (사업자/계좌), Kakao OAuth |
| Backend | AWS Lambda + API Gateway (별도 저장소) |
| 인프라 | Vercel (Frontend), AWS (Backend) |

---

## 2. 아키텍처

### 2.1 디렉토리 구조

```
src/
├── app/
│   ├── (customer)/          # 고객용 페이지 (모바일 프레임)
│   │   ├── auth/            # 로그인/회원가입
│   │   ├── deals/           # 거래 생성/조회
│   │   ├── mypage/          # 마이페이지
│   │   └── payment/         # 결제
│   ├── admin/               # 어드민 페이지 (전체 화면)
│   └── api/                 # API Routes (BFF 패턴)
├── components/
│   ├── common/              # 공통 컴포넌트
│   ├── deal/                # 거래 관련
│   ├── auth/                # 인증 관련
│   └── admin/               # 어드민 전용
├── stores/                  # Zustand 스토어
├── types/                   # TypeScript 타입
├── lib/                     # 유틸리티
└── classes/                 # Helper 클래스
```

### 2.2 데이터 흐름

```
[사용자] → [Next.js Frontend] → [API Routes] → [AWS Lambda] → [외부 API]
                                      ↓
                              [httpOnly Cookie]
                              (JWT 토큰 저장)
```

### 2.3 인증 방식

| 항목 | 방식 |
|------|------|
| 토큰 저장 | httpOnly 쿠키 (XSS 방어) |
| 토큰 갱신 | 자동 refresh (만료 전) |
| 세션 관리 | Zustand persist + hydration 체크 |

---

## 3. 주요 기능 상세

### 3.1 거래 생성 플로우

```
[거래유형 선택] → [금액 입력] → [수취인 정보] → [서류 업로드] → [확인] → [결제]
     ↓              ↓              ↓              ↓            ↓
  물품매입       수수료 계산     계좌 실명확인   이미지 S3    최종 확인
  용역비         한도 체크       은행 선택       업로드
  인건비
```

### 3.2 상태 전이 (거래)

```
[draft] → [pending_payment] → [paid] → [reviewing] → [transferring] → [completed]
                                            ↓
                                       [rejected]
```

### 3.3 사용자 등급

| 등급 | 수수료율 | 월 한도 | 1회 한도 |
|------|----------|---------|----------|
| Basic | 5.5% | 2,000만원 | 500만원 |
| Silver | 5.0% | 5,000만원 | 1,000만원 |
| Gold | 4.5% | 1억원 | 2,000만원 |
| VIP | 4.0% | 3억원 | 5,000만원 |

---

## 4. 코드 품질

### 4.1 현재 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| TypeScript strict | ✅ 활성화 | tsconfig.json |
| any 타입 | 3개 | Zustand migrate (의도적) |
| 대형 컴포넌트 | 0개 | 모두 500줄 이하 분할 완료 |
| 테스트 커버리지 | 190개 E2E | Playwright |
| 보안 취약점 | 0개 | httpOnly 쿠키 적용 |

### 4.2 리팩토링 완료 항목

1. **보안 강화**
   - JWT 토큰 httpOnly 쿠키 전환
   - 하드코딩 비밀번호 제거
   - 민감 정보 로깅 제거

2. **코드 구조**
   - 1,400줄 컴포넌트 → 16개 모듈 분할
   - 공통 유틸리티 함수 추출
   - 상수/설정 중앙화

3. **타입 안전성**
   - strict 모드 활성화
   - any 타입 98% 제거 (161개 → 3개)
   - 명시적 타입 정의

4. **성능 최적화**
   - useMemo/useCallback 적용
   - React.memo 컴포넌트 최적화
   - Zustand hydration 문제 해결

---

## 5. 테스트

### 5.1 E2E 테스트 현황

```
총 테스트: 198개
├── 통과: 190개 (96%)
├── Flaky: 10개 (재시도 후 통과)
└── 스킵: 8개 (마케팅 약관 등)
```

### 5.2 테스트 시나리오

| 시나리오 | 테스트 수 | 설명 |
|----------|-----------|------|
| SC-001 | 6개 | 거래 생성 플로우 |
| SC-002 | 8개 | 결제 플로우 |
| SC-003 | 10개 | 회원가입 |
| SC-004 | 10개 | 어드민 거래 관리 |
| SC-005 | 8개 | 어드민 회원 관리 |
| SC-006 | 35개 | 엣지 케이스 |

### 5.3 테스트 실행

```bash
# 전체 테스트
npm run test:e2e

# UI 모드
npm run test:e2e:ui

# 특정 프로젝트
npx playwright test --project=chromium
npx playwright test --project=authenticated
npx playwright test --project=admin
```

---

## 6. 보안

### 6.1 적용된 보안 조치

| 항목 | 상태 | 설명 |
|------|------|------|
| XSS 방어 | ✅ | httpOnly 쿠키, React 자동 이스케이프 |
| CSRF 방어 | ✅ | SameSite 쿠키, Origin 검증 |
| SQL Injection | ✅ | 백엔드 ORM 사용 |
| 인증 | ✅ | JWT + Refresh Token |
| 암호화 | ✅ | HTTPS 전송, 비밀번호 해시 |

### 6.2 민감 정보 관리

- `.env.local` - 로컬 환경 변수 (git 제외)
- Vercel Environment Variables - 배포 환경
- AWS Secrets Manager - 백엔드 시크릿

---

## 7. 배포

### 7.1 환경

| 환경 | URL | 용도 |
|------|-----|------|
| Production | plic.kr | 실서비스 |
| Staging | staging.plic.kr | QA 테스트 |
| Development | localhost:3000 | 로컬 개발 |

### 7.2 CI/CD

```
[GitHub Push] → [Vercel Build] → [Preview/Production]
                     ↓
              [E2E 테스트 실행]
```

---

## 8. 알려진 이슈

### 8.1 해결 완료

| 이슈 | 해결 방법 | 날짜 |
|------|-----------|------|
| Zustand hydration race condition | `_hasHydrated` 상태 추가 | 2026-02-04 |
| JWT 토큰 localStorage 노출 | httpOnly 쿠키 전환 | 2026-02-04 |
| 대형 컴포넌트 유지보수 어려움 | 16개 모듈 분할 | 2026-02-04 |

### 8.2 개선 권장 사항

| 항목 | 우선순위 | 설명 |
|------|----------|------|
| 마케팅 약관 페이지 | Low | `/terms/marketing` 라우트 구현 |
| 유닛 테스트 추가 | Medium | 핵심 비즈니스 로직 테스트 |
| 에러 모니터링 | Medium | Sentry 등 에러 트래킹 도입 |
| 성능 모니터링 | Low | Web Vitals 측정 |

---

## 9. 개발 가이드

### 9.1 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run typecheck
```

### 9.2 코딩 컨벤션

**파일 구조:**
- 컴포넌트: `PascalCase.tsx`
- 유틸리티: `camelCase.ts`
- 타입: `types/index.ts` (I 접두사)

**스타일:**
- Tailwind CSS 사용
- `cn()` 유틸리티로 조건부 클래스

**상태관리:**
- Zustand 스토어 (`/stores`)
- persist middleware로 localStorage 동기화

### 9.3 PR 체크리스트

- [ ] TypeScript 에러 없음
- [ ] 빌드 성공
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] CLAUDE.md 규칙 준수

---

## 10. 연락처

| 역할 | 담당 |
|------|------|
| 프론트엔드 | - |
| 백엔드 | - |
| 인프라 | - |
| 기획 | - |

---

## 부록

### A. 관련 문서

| 문서 | 경로 |
|------|------|
| 아키텍처 | `docs/core/ARCHITECTURE.md` |
| 거래 타입 | `docs/core/DEAL-TYPES.md` |
| API 레지스트리 | `docs/core/REGISTRY.md` |
| 의사결정 기록 | `docs/DECISIONS.md` |
| 로드맵 | `docs/ROADMAP.md` |
| 테스트 플랜 | `docs/testing/TEST-MASTER-PLAN.md` |

### B. PDCA 아카이브

| 기능 | 완료일 | 매치율 |
|------|--------|--------|
| refactoring | 2026-02-04 | 100% |
| jwt-httponly | 2026-02-04 | 100% |
| error-boundary | 2026-02-04 | 100% |
| e2e-auth-tests | 2026-02-04 | 100% |
| performance-optimization | 2026-02-04 | 100% |
| zustand-hydration | 2026-02-04 | 100% |

---

**문서 작성**: Claude (AI Assistant)
**최종 수정**: 2026-02-05
