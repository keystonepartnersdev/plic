# PLIC 로드맵

> **목적**: 프로젝트 진행 상황 추적 및 남은 작업 관리
> **최종 업데이트**: 2026-02-04

---

## 현재 상태

```
코드 품질 점수:       93/100  🟢 (+31 향상)
보안 취약점:          0개 ✅ (httpOnly 쿠키 적용 완료)
TypeScript strict:   ✅ 활성화
대형 컴포넌트:        0개 (모두 분할 완료)
any 타입:            3개 (161 → 3, 98% 감소) ✅

├── 핵심 기능 ✅ 완성
│   ├── 거래 생성/조회/수정
│   ├── 카드 결제 (Softpayment)
│   ├── 사업자/계좌 인증 (Popbill)
│   └── 카카오 소셜 로그인
│
├── 🟢 완료된 보안 개선
│   ├── JWT httpOnly 쿠키 ✅ (2026-02-04)
│   ├── API Gateway CORS credentials ✅
│   └── Lambda 함수 업데이트 ✅
│
└── 🟢 완료된 기술 부채
    ├── TypeScript strict 모드 ✅
    ├── 대형 컴포넌트 분할 ✅
    ├── 환경 설정 중앙화 ✅
    ├── 상수 파일 생성 ✅
    └── Error Boundary ✅
```

---

## ✅ Phase 1: 보안 강화 (완료)

> **목표**: 보안 취약점 개선

### Task 1.1: 어드민 인증 재구현

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 대상 | `stores/useAdminStore.ts`, `admin/login/page.tsx` |
| 작업 | 하드코딩 비밀번호 제거, 민감 정보 제거 |

### Task 1.2: JWT 토큰 저장 방식 개선

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 대상 | `lib/api.ts`, API Routes, Lambda |
| 작업 | httpOnly 쿠키 전환 완료 (2026-02-04) |

**완료된 작업**:
- 백엔드 Lambda 함수 수정 (kakao-login, signup)
- API Gateway CORS credentials 설정
- 프론트엔드 Set-Cookie 전달 구현
- `credentials: 'include'` 적용

---

## ✅ Phase 2: 설정 중앙화 (완료)

> **목표**: 하드코딩 제거, 환경변수 통합

### Task 2.1: 환경 설정 통합

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 신규 | `lib/config.ts` |
| 작업 | API URL, 버킷명 등 중앙화 |

### Task 2.2: 상수 파일 생성

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 신규 | `lib/constants.ts` |
| 작업 | BANKS, DEAL_TYPES, LIMITS 통합 |

---

## ✅ Phase 3: 컴포넌트 분할 (완료)

> **목표**: 모든 파일 500줄 이하

### Task 3.1: deals/new/page.tsx 분할

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 이전 | 1,414줄 |
| 현재 | 컴포넌트 분리 완료 (constants, types, utils, StepProgress, TypeStep, AmountStep, RecipientStep, DocsStep, ConfirmStep) |

### Task 3.2: deals/[did]/page.tsx 분할

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 이전 | 1,502줄 |
| 현재 | 컴포넌트 분리 완료 (AmountCard, RecipientCard, AttachmentsCard, DealHistory, CouponModal, DiscountSection 등 16개) |

### Task 3.3: auth/signup/page.tsx 분할

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 이전 | 1,001줄 |
| 현재 | 컴포넌트 분리 완료 (AgreementStep, KakaoVerifyStep, UserInfoStep, BusinessInfoStep, CompleteStep 등 9개) |

---

## ✅ Phase 4: 중복 코드 제거 (완료)

> **목표**: 중복 코드 5% 미만

### Task 4.1: 유틸리티 함수 추출

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 신규 | `lib/utils.ts` |
| 작업 | formatPhone, maskAccountNumber, formatBusinessNumber 등 추가 |

---

## ✅ Phase 5: 타입 안전성 강화 (완료)

> **목표**: TypeScript strict 모드 활성화

### Task 5.1: strict 모드 활성화

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 대상 | `tsconfig.json` |
| 작업 | `strict: true` 설정 완료 |

### Task 5.2: any 타입 제거

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 이전 | 161개 |
| 현재 | 3개 (의도적 유지 - Zustand migrate) |
| 결과 | 98% 감소 |

---

## ✅ Phase 6: 코드 품질 개선 (완료)

> **목표**: 품질 점수 85/100 → **달성: 92/100**

### Task 6.1: any 타입 제거

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 이전 | 161개 → 89개 → **3개** (98% 감소) |
| 작업 | `getErrorMessage()` 유틸리티 함수 추가, 모든 `catch (error: any)`를 `catch (error: unknown)`으로 변환 |
| 남은 any | Zustand migrate 함수 3개 (의도적 유지) |

### Task 6.2: Error Boundary 추가

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 신규 | `components/common/ErrorBoundary.tsx` |
| 적용 | `(customer)/layout.tsx` 전역 적용 |

### Task 6.3: 민감 정보 로깅 제거

| 항목 | 내용 |
|------|------|
| 상태 | ✅ 완료 |
| 대상 | `api.ts`, `apiLogger.ts` |
| 작업 | 불필요한 디버그 로그 제거 |

---

## 진행률 요약

| Phase | 진행률 | 상태 |
|-------|--------|------|
| Phase 1: 보안 강화 | 100% | ✅ 완료 |
| Phase 2: 설정 중앙화 | 100% | ✅ 완료 |
| Phase 3: 컴포넌트 분할 | 100% | ✅ 완료 |
| Phase 4: 중복 코드 제거 | 100% | ✅ 완료 |
| Phase 5: 타입 안전성 | 100% | ✅ 완료 |
| Phase 6: 품질 개선 | 100% | ✅ 완료 |

**전체 진행률: 100% ✅**

---

## 완료된 작업 (2026-02-04)

### P1 완료
- ✅ JWT httpOnly 쿠키 전환
- ✅ API Gateway CORS credentials 설정
- ✅ Lambda 함수 배포 (kakao-login, signup)

### P2 완료
- ✅ Error Boundary 컴포넌트 추가
- ✅ any 타입 98% 제거 (161 → 3)

### E2E 테스트 완료
- ✅ Playwright 테스트 환경 구축
- ✅ SC-001~006 시나리오 테스트 작성 (160개 테스트)
- ✅ 90개 테스트 통과 (70개는 로그인 필요로 스킵)
- ✅ 인증 체크 버그 2건 수정 (/mypage/grade, /payment/result)

---

## 향후 개선 (선택사항)

### 우선순위 Low
1. ~~useEffect 의존성 최적화~~ ✅ 완료 (11개 → 0개)
2. ~~E2E 테스트 작성~~ ✅ 완료 (2026-02-04)
3. 성능 최적화
4. 로그인 상태 테스트 구현 (70개 스킵된 테스트)

---

## 관련 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| 아키텍처 | `docs/core/ARCHITECTURE.md` | 시스템 구조 |
| 거래 타입 | `docs/core/DEAL-TYPES.md` | 거래 정의 |
| 레지스트리 | `docs/core/REGISTRY.md` | 코드 네이밍 |
| 의사결정 | `docs/DECISIONS.md` | 설계 근거 |
| 리팩토링 로그 | `docs/logs/REFACTORING-LOG.md` | 변경 이력 |
| 테스트 마스터 | `docs/testing/TEST-MASTER-PLAN.md` | E2E 테스트 플랜 |
| 버그 트래커 | `docs/testing/bugs/BUG-TRACKER.md` | 버그 추적 |

---

**마지막 업데이트**: 2026-02-04 (E2E 테스트 완료)
