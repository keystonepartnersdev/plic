# PDCA Design: 전체 유저 여정 트래킹 설계

> 최종 업데이트: 2026-03-21
> Feature: full-journey-tracking

## 1. 이벤트 체계

### 1.1 자동 수집 이벤트 (TrackingProvider)

| 이벤트 | eventType | eventName | 트리거 |
|--------|-----------|-----------|--------|
| 페이지뷰 | pageview | - | 라우트 변경 |
| 스크롤 깊이 | custom | scroll_depth | 25/50/75/100% 도달 |
| 체류 시간 | custom | session_milestone | 30s/1m/3m/5m/10m |
| 탭 이탈 | custom | tab_hidden | visibilitychange hidden |
| 탭 복귀 | custom | tab_visible | visibilitychange visible |
| 페이지 이탈 | custom | page_exit | beforeunload |
| CTA 클릭 | click | {data-track값} | data-track 속성 클릭 |

### 1.2 랜딩 페이지 이벤트

| 이벤트 | eventType | eventName | 트리거 |
|--------|-----------|-----------|--------|
| 섹션 노출 | custom | section_view | IntersectionObserver 50% |
| CTA 클릭 | click | landing_cta_{name} | 버튼 클릭 |

### 1.3 인증 퍼널 이벤트

| 이벤트 | eventType | eventName | 트리거 |
|--------|-----------|-----------|--------|
| 가입 시작 | funnel | signup_start | 가입 페이지 진입 |
| 가입 단계 | funnel | signup_step_{n} | 각 단계 진입 |
| 가입 완료 | funnel | signup_complete | 가입 성공 |
| 가입 이탈 | funnel | signup_abandon | 가입 중 페이지 이탈 |
| 로그인 시도 | funnel | login_attempt | 로그인 버튼 클릭 |
| 로그인 성공 | funnel | login_success | 로그인 성공 |
| 로그인 실패 | funnel | login_fail | 로그인 실패 |

### 1.4 결제 퍼널 이벤트

| 이벤트 | eventType | eventName | 트리거 |
|--------|-----------|-----------|--------|
| 결제 진입 | funnel | payment_start | 결제 페이지 진입 |
| 결제 시도 | funnel | payment_attempt | 결제 버튼 클릭 |
| 결제 성공 | funnel | payment_success | 결제 완료 |
| 결제 실패 | funnel | payment_fail | 결제 실패 |

## 2. 구현 설계

### 2.1 TrackingProvider 강화

```
TrackingProvider
├── useEffect: pageview (기존)
├── useEffect: scroll depth tracking (new)
│   └── window scroll → 25/50/75/100% 마일스톤
├── useEffect: session duration milestones (new)
│   └── setInterval 매초 → 30s/60s/180s/300s/600s
├── useEffect: visibility change (new)
│   └── document.visibilitychange → tab_hidden/tab_visible
├── useEffect: global click delegation (new)
│   └── document click → data-track 속성 감지 → tracking.click
└── useEffect: exit tracking (new)
    └── beforeunload → page_exit + session duration
```

### 2.2 data-track 속성 규칙

```html
<!-- 버튼 -->
<button data-track="landing_cta_signup">무료 시작하기</button>

<!-- 링크 -->
<a data-track="nav_login" href="/auth/login">로그인</a>

<!-- 배너 -->
<div data-track="banner_click" data-track-meta='{"bannerId":"1"}'>...</div>
```

### 2.3 랜딩 섹션 추적 (IntersectionObserver)

```
각 섹션에 data-section="hero|features|how-it-works|security|reviews|faq|cta" 추가
TrackingProvider 또는 별도 hook에서 IntersectionObserver로 감지
50% 이상 노출 시 section_view 이벤트 발생 (1회만)
```

## 3. 미가입자 식별 체계

```
1. 최초 접속 → plic_anonymous_id 생성 (localStorage, 영구)
2. 세션 시작 → plic_session_id 생성 (sessionStorage, 탭 종료시 삭제)
3. 회원가입 시 → tracking.identify(uid) 호출 → 이후 이벤트에 userId 포함
4. 어드민에서 anonymous_id 기준으로 미가입자 여정 분석 가능
```
