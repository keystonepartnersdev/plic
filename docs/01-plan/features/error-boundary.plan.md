# Error Boundary Plan

> **Feature**: error-boundary
> **Status**: Planning
> **Created**: 2026-02-04
> **Author**: Development Team

---

## 1. Overview

### 1.1 Problem Statement

현재 PLIC 앱에서 컴포넌트 레벨의 JavaScript 에러가 발생하면:
- 전체 앱이 크래시되어 흰 화면만 표시됨
- 사용자에게 에러 원인이나 복구 방법이 제공되지 않음
- 에러 발생 시 로깅이나 리포팅이 없음

### 1.2 Solution

React Error Boundary를 구현하여:
- 에러 발생 시 우아한 폴백 UI 제공
- 사용자가 앱을 재시도할 수 있는 옵션 제공
- 에러 정보 로깅 (향후 Sentry 연동 대비)

### 1.3 Scope

| In Scope | Out of Scope |
|----------|--------------|
| Error Boundary 컴포넌트 생성 | Sentry 실제 연동 |
| 전역 레이아웃 적용 | 서버 사이드 에러 처리 |
| 폴백 UI 디자인 | API 에러 핸들링 |
| 에러 로깅 인터페이스 | 네트워크 에러 재시도 |

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 하위 컴포넌트의 JavaScript 에러를 캐치해야 함 | Must |
| FR-02 | 에러 발생 시 폴백 UI를 표시해야 함 | Must |
| FR-03 | "다시 시도" 버튼으로 컴포넌트 재렌더링 가능해야 함 | Must |
| FR-04 | "홈으로 돌아가기" 버튼 제공해야 함 | Should |
| FR-05 | 에러 정보를 콘솔에 로깅해야 함 | Must |
| FR-06 | 개발 모드에서 에러 상세 정보 표시 | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | 모바일 프레임 내 적절한 UI | 375px 대응 |
| NFR-02 | PLIC 디자인 시스템 준수 | primary-400 색상 |
| NFR-03 | TypeScript strict 모드 호환 | 타입 에러 0개 |
| NFR-04 | 빌드 성공 | npm run build 통과 |

---

## 3. Technical Design

### 3.1 Component Structure

```
src/components/common/
├── ErrorBoundary.tsx      # Error Boundary 클래스 컴포넌트
├── ErrorFallback.tsx      # 폴백 UI 컴포넌트
└── index.ts               # export 추가
```

### 3.2 Props Interface

```typescript
interface IErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;        // 커스텀 폴백 (선택)
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;  // 에러 콜백
  onReset?: () => void;              // 리셋 콜백
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}
```

### 3.3 Fallback UI Design

```
┌─────────────────────────────────┐
│                                 │
│         ⚠️ (아이콘)              │
│                                 │
│    문제가 발생했습니다           │
│                                 │
│    [개발모드: 에러 메시지]       │
│                                 │
│    ┌─────────────────────┐     │
│    │      다시 시도       │     │
│    └─────────────────────┘     │
│                                 │
│    홈으로 돌아가기              │
│                                 │
└─────────────────────────────────┘
```

### 3.4 Integration Point

```tsx
// src/app/(customer)/layout.tsx
import { ErrorBoundary } from '@/components/common';

export default function CustomerLayout({ children }) {
  return (
    <ErrorBoundary>
      <MobileLayout>
        {children}
      </MobileLayout>
    </ErrorBoundary>
  );
}
```

---

## 4. Implementation Plan

### 4.1 Tasks

| # | Task | Estimated |
|---|------|-----------|
| 1 | ErrorBoundary.tsx 클래스 컴포넌트 작성 | 30분 |
| 2 | ErrorFallback.tsx 폴백 UI 컴포넌트 작성 | 30분 |
| 3 | index.ts에 export 추가 | 5분 |
| 4 | customer layout에 적용 | 10분 |
| 5 | admin layout에 적용 | 10분 |
| 6 | 테스트 (의도적 에러 발생) | 15분 |
| 7 | 빌드 검증 | 10분 |

**Total**: ~2시간

### 4.2 Test Scenarios

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| TC-01 | 컴포넌트에서 throw new Error() | 폴백 UI 표시 |
| TC-02 | "다시 시도" 클릭 | 컴포넌트 재렌더링 |
| TC-03 | "홈으로" 클릭 | / 페이지로 이동 |
| TC-04 | 정상 컴포넌트 | 폴백 없이 정상 렌더링 |

---

## 5. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Error Boundary가 캐치하지 못하는 에러 유형 | Medium | Low | 문서화 (이벤트 핸들러, async 에러 등) |
| 폴백 UI가 모바일 프레임에서 깨짐 | Low | Low | 375px 기준 테스트 |
| TypeScript 타입 호환성 | Low | Low | React.Component 제네릭 사용 |

---

## 6. Success Criteria

- [ ] ErrorBoundary 컴포넌트 생성 완료
- [ ] 폴백 UI 구현 완료
- [ ] customer layout 적용 완료
- [ ] admin layout 적용 완료
- [ ] npm run build 성공
- [ ] 테스트 시나리오 모두 통과

---

## 7. References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- PLIC Design System: `CLAUDE.md`
- 기존 컴포넌트: `src/components/common/`

---

**Plan Status**: Ready for Design Phase
**Next Step**: `/pdca design error-boundary`
