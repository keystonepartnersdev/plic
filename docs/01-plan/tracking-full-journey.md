# PDCA Plan: 전체 유저 여정 트래킹 시스템

> 최종 업데이트: 2026-03-21
> Feature: full-journey-tracking
> Phase: Plan

## 1. 목표

미가입자/가입자 구분 없이, PLIC에 유입되는 **모든 사용자의 전체 여정**을 빠짐없이 추적한다.
- 어디서 유입되었는지 (UTM, referrer)
- 어떤 페이지를 보는지 (pageview)
- 어디를 클릭하는지 (CTA, 버튼, 링크)
- 얼마나 스크롤하는지 (scroll depth)
- 어디서 이탈하는지 (exit intent, session end)
- 얼마나 머무는지 (session duration, 체류시간)
- 퍼널 전환율 (가입, 송금, 결제)

## 2. 현재 상태 (AS-IS)

| 항목 | 상태 |
|------|------|
| tracking.ts 라이브러리 | 구현됨 (pageview, click, funnel, error, performance) |
| TrackingProvider | pageview 자동 추적만 |
| 랜딩 페이지 | pageview 1회 호출만 |
| 송금 퍼널 | step 변경 시 funnel 이벤트만 |
| 스크롤 추적 | 없음 |
| 클릭 추적 | 없음 |
| 세션 체류시간 | 없음 |
| 탭 전환/이탈 감지 | 없음 |
| 회원가입 퍼널 | 없음 |
| 결제 퍼널 | 없음 |
| 랜딩 섹션별 노출 | 없음 |

## 3. 목표 상태 (TO-BE)

### 3.1 전역 자동 추적 (TrackingProvider 강화)
- 스크롤 깊이 (25%, 50%, 75%, 100%)
- 세션 체류 시간 (30초, 1분, 3분, 5분, 10분)
- 탭 전환 감지 (visibility change)
- 페이지 이탈 감지 (beforeunload)

### 3.2 전역 클릭 추적 (자동)
- `data-track` 속성이 있는 모든 요소 자동 추적
- CTA 버튼, 네비게이션 링크, 배너 등

### 3.3 랜딩 페이지 (미가입자 최초 유입)
- 각 섹션 노출 추적 (IntersectionObserver)
- 모든 CTA 버튼 클릭 추적
- 스크롤 깊이 추적

### 3.4 인증 퍼널
- 회원가입: 각 단계 진입/완료/이탈
- 로그인: 시도/성공/실패
- 비밀번호 찾기: 시도/완료

### 3.5 송금 퍼널 (기존 강화)
- 이미 구현됨, 유지

### 3.6 결제 퍼널
- 결제 페이지 진입
- 결제 시도
- 결제 성공/실패

## 4. 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| src/lib/tracking.ts | scroll, session, visibility, exit 메서드 추가 |
| src/components/common/TrackingProvider.tsx | 스크롤/세션/탭전환/이탈 자동추적 + 전역 클릭 위임 |
| src/app/landing/page.tsx | 섹션 노출 추적, CTA data-track 속성 추가 |
| src/app/(customer)/auth/signup/page.tsx | 가입 퍼널 단계 추적 |
| src/app/(customer)/auth/login/page.tsx | 로그인 시도/성공/실패 추적 |
| src/app/(customer)/payment/[did]/page.tsx | 결제 퍼널 추적 |
| src/app/(customer)/payment/result/page.tsx | 결제 결과 추적 |
| docs/PLIC_BETA_STATUS.md | 트래킹 상태 업데이트 |

## 5. 리스크

- 이벤트 과다 전송으로 성능 저하 → 버퍼링/디바운스로 해결 (기존 tracking.ts에 내장)
- DynamoDB 비용 증가 → 30일 TTL 유지
