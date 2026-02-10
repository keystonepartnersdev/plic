# Zustand Hydration Fix Plan

> **Feature**: zustand-hydration
> **Created**: 2026-02-04
> **Priority**: P1 (테스트 70개 활성화)

---

## 1. Problem Statement

### 1.1 현재 문제
- Next.js SSR 후 클라이언트에서 `mounted && !isLoggedIn` 체크가 localStorage 로드 전에 실행
- 인증된 사용자도 로그인 페이지로 리다이렉트됨
- E2E 테스트 70개가 이 문제로 스킵 중

### 1.2 근본 원인
```
useEffect (setMounted=true) → useEffect (isLoggedIn 체크) → persist middleware (localStorage 로드)
                                  ↑ Race Condition!
```

---

## 2. Solution

### 2.1 핵심 변경
1. `useUserStore`에 `_hasHydrated` 상태 추가
2. `onRehydrateStorage` 콜백으로 hydration 완료 감지
3. 인증 페이지에서 hydration 완료 대기 후 리다이렉트

### 2.2 구현 전략

**Option A: Store 레벨 해결 (선택)**
- `useUserStore`에 `_hasHydrated` 상태 추가
- 모든 인증 페이지가 자동으로 hydration 대기

**Option B: Hook 추출**
- `useHydration()` 커스텀 훅 생성
- 각 페이지에서 훅 사용

→ **Option A 선택** (변경 최소화, 일관성)

---

## 3. Implementation

### 3.1 useUserStore 수정

```typescript
// stores/useUserStore.ts
export const useUserStore = create(
  persist<IUserState>(
    (set, get) => ({
      // 기존 상태...
      _hasHydrated: false,

      // 기존 액션...
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'plic-user-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        // _hasHydrated는 persist에서 제외
        ...state,
        _hasHydrated: undefined,
      }),
    }
  )
);
```

### 3.2 인증 페이지 패턴 수정

```typescript
// Before
useEffect(() => {
  if (mounted && !isLoggedIn) {
    router.replace('/auth/login');
  }
}, [mounted, isLoggedIn, router]);

// After
const { _hasHydrated } = useUserStore();

useEffect(() => {
  if (mounted && _hasHydrated && !isLoggedIn) {
    router.replace('/auth/login');
  }
}, [mounted, _hasHydrated, isLoggedIn, router]);
```

---

## 4. Target Files

### Store
- [ ] `src/stores/useUserStore.ts` - _hasHydrated 추가

### Pages (12개)
- [ ] `src/app/(customer)/mypage/page.tsx`
- [ ] `src/app/(customer)/mypage/edit/page.tsx`
- [ ] `src/app/(customer)/mypage/cards/page.tsx`
- [ ] `src/app/(customer)/mypage/accounts/page.tsx`
- [ ] `src/app/(customer)/mypage/settings/page.tsx`
- [ ] `src/app/(customer)/mypage/grade/page.tsx`
- [ ] `src/app/(customer)/deals/page.tsx`
- [ ] `src/app/(customer)/deals/[did]/page.tsx`
- [ ] `src/app/(customer)/deals/new/page.tsx`
- [ ] `src/app/(customer)/payment/[did]/page.tsx`
- [ ] `src/app/(customer)/payment/result/page.tsx`

---

## 5. Success Criteria

- [ ] 빌드 성공
- [ ] 기존 로그인 플로우 정상 동작
- [ ] E2E 테스트 통과율 향상 (70개 스킵 → 활성화)

---

**Plan Created**: 2026-02-04
