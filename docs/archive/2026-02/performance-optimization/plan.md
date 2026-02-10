# Performance Optimization Plan

> **Feature**: performance-optimization
> **Created**: 2026-02-04
> **Priority**: P2

---

## 1. Overview

### 1.1 Goal
React 성능 최적화(React.memo, useMemo, useCallback)를 적용하여 불필요한 리렌더링을 방지하고 사용자 경험을 향상시킵니다.

### 1.2 Scope
- 고객용 페이지 컴포넌트 최적화
- Zustand 스토어 셀렉터 패턴 적용
- 비용이 큰 계산에 useMemo 적용
- 자식 컴포넌트에 전달되는 콜백에 useCallback 적용

---

## 2. Target Files (Priority Order)

### High Priority

| # | File | Optimization | Impact |
|---|------|--------------|--------|
| 1 | `deals/[did]/page.tsx` | useMemo (calculateTotalDiscount) | 높음 |
| 2 | `deals/page.tsx` | useMemo (필터링) + useCallback | 중간 |
| 3 | `deals/new/page.tsx` | useCallback (핸들러들) | 중간 |

### Medium Priority

| # | File | Optimization | Impact |
|---|------|--------------|--------|
| 4 | `page.tsx` (홈) | useMemo (필터링) | 낮음 |
| 5 | `mypage/page.tsx` | useMemo (필터링) | 낮음 |
| 6 | `DraftDealCard.tsx` | React.memo | 낮음 |

---

## 3. Implementation Details

### 3.1 deals/[did]/page.tsx - calculateTotalDiscount

**Before:**
```typescript
const calculateTotalDiscount = (): { total: number; details: Map<string, number> } => {
  // 매 렌더링마다 계산
};
```

**After:**
```typescript
const discountResult = useMemo(() => {
  const details = new Map<string, number>();
  // 계산 로직
  return { total, details };
}, [deal?.feeAmount, appliedDiscounts]);
```

### 3.2 deals/page.tsx - 배열 필터링

**Before:**
```typescript
const userDrafts = drafts.filter((d) => d.uid === currentUser?.uid && d.status === 'draft');
const filteredDeals = deals.filter((d) => activeTabConfig.statuses.includes(d.status));
```

**After:**
```typescript
const userDrafts = useMemo(() =>
  drafts.filter((d) => d.uid === currentUser?.uid && d.status === 'draft'),
  [drafts, currentUser?.uid]
);

const filteredDeals = useMemo(() =>
  deals.filter((d) => activeTabConfig.statuses.includes(d.status)),
  [deals, activeTab]
);
```

### 3.3 deals/new/page.tsx - 이벤트 핸들러

**Before:**
```typescript
const handleStepChange = (newStep: Step) => {
  setStep(newStep);
};
```

**After:**
```typescript
const handleStepChange = useCallback((newStep: Step) => {
  setStep(newStep);
  setCurrentStep(newStep as TDealStep);
}, []);
```

---

## 4. Checklist

- [x] deals/[did]/page.tsx - calculateTotalDiscount useMemo 적용
- [x] deals/page.tsx - 필터링 useMemo + 핸들러 useCallback + DealCard memo
- [ ] deals/new/page.tsx - 핸들러들 useCallback (스킵 - 복잡도 높음)
- [x] page.tsx (홈) - 필터링 useMemo + 핸들러 useCallback
- [x] mypage/page.tsx - 필터링 useMemo + 핸들러 useCallback
- [x] DraftDealCard.tsx - React.memo + useMemo + useCallback

---

## 5. Success Criteria

- 빌드 성공 (no errors)
- 기존 기능 동작 유지
- React DevTools Profiler로 리렌더링 감소 확인

---

**Plan Created**: 2026-02-04
