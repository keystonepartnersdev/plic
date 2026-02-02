# PLIC 업데이트 내역

> 기능 추가/변경 히스토리입니다.
> 최신 항목이 상단에 위치합니다.

---

## 2026-02-02

### v1.2.0 - 문서 체계 구축 및 코드 리뷰

- **문서 체계 구축**
  - `docs/core/ARCHITECTURE.md` - 시스템 아키텍처 문서
  - `docs/core/REGISTRY.md` - 코드 레지스트리
  - `docs/core/DEAL-TYPES.md` - 거래 타입 정의서
  - `docs/DECISIONS.md` - 의사결정 로그
  - `docs/ROADMAP.md` - 프로젝트 로드맵
  - `docs/logs/CHANGELOG.md` - 변경 이력

- **코드 리뷰 완료**
  - 품질 점수: 62/100
  - Critical 이슈 3개 발견
  - 리팩토링 계획 수립 (6 Phase)

- **리팩토링 계획서 작성**
  - `docs/01-plan/PLIC_REFACTORING_PLAN_v1.0.md`
  - 10개 Task 생성 및 의존성 설정

---

### v1.1.1 - 보안 강화

- **보안 이슈 식별**
  - 어드민 비밀번호 하드코딩 발견 (Critical)
  - JWT 토큰 localStorage 저장 (High)
  - 클라이언트 사이드 인증 (Critical)

---

## 2026-02-01 (이전)

### v1.1.0 - 카카오 로그인 개선

- **카카오 로그인 시 백엔드 API 직접 호출**
  - 비밀번호 불일치 문제 해결
  - cold start로 인한 회원가입 페이지 오이동 수정

---

### v1.0.0 - 초기 릴리즈

- **핵심 기능 구현**
  - 사용자 인증 (이메일/카카오)
  - 거래 생성 위저드 (5단계)
  - 카드 결제 (Softpayment PG)
  - 사업자/계좌 인증 (Popbill)
  - 어드민 관리 페이지

- **UI/UX**
  - 모바일 프레임 레이아웃 (Fitpetmall 스타일)
  - 반응형 어드민 대시보드

- **기술 스택**
  - Next.js 16 + TypeScript + React 19
  - Zustand (persist middleware)
  - Tailwind CSS 4
  - AWS (API Gateway, Lambda, DynamoDB, S3)

---

## 변경 이력 작성 가이드

### 포맷
```markdown
### vX.Y.Z - 변경 제목

- **카테고리**: 변경 내용
  - 상세 설명 1
  - 상세 설명 2
```

### 카테고리
- **신규**: 새 기능 추가
- **개선**: 기존 기능 개선
- **수정**: 버그 수정
- **보안**: 보안 관련 변경
- **문서**: 문서 추가/수정
- **리팩토링**: 코드 구조 개선
- **제거**: 기능/코드 제거

---

**마지막 업데이트**: 2026-02-02
