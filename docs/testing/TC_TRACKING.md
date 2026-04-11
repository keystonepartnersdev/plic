# 트래킹 테스트케이스 (TC) 문서

> 최종 업데이트: 2026-03-21

## 1. 자동 추적 (TrackingProvider)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| A-01 | 페이지뷰 | 모든 라우트 변경 | pageview | ✅ 구현 |
| A-02 | 스크롤 깊이 25% | 페이지 25% 스크롤 | scroll_depth {depth:25} | ✅ 구현 |
| A-03 | 스크롤 깊이 50% | 페이지 50% 스크롤 | scroll_depth {depth:50} | ✅ 구현 |
| A-04 | 스크롤 깊이 75% | 페이지 75% 스크롤 | scroll_depth {depth:75} | ✅ 구현 |
| A-05 | 스크롤 깊이 100% | 페이지 끝까지 스크롤 | scroll_depth {depth:100} | ✅ 구현 |
| A-06 | 체류 30초 | 30초 경과 | session_milestone {seconds:30} | ✅ 구현 |
| A-07 | 체류 1분 | 60초 경과 | session_milestone {seconds:60} | ✅ 구현 |
| A-08 | 체류 3분 | 180초 경과 | session_milestone {seconds:180} | ✅ 구현 |
| A-09 | 탭 이탈 | 다른 탭으로 전환 | tab_hidden | ✅ 구현 |
| A-10 | 탭 복귀 | 탭으로 돌아옴 | tab_visible | ✅ 구현 |
| A-11 | 페이지 이탈 | 브라우저 닫기/새 URL | page_exit | ✅ 구현 |
| A-12 | JS 에러 | 런타임 에러 발생 | error | ✅ 구현 |
| A-13 | 페이지 성능 | 페이지 로드 완료 | performance | ✅ 구현 |

## 2. 랜딩 페이지 (/landing)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| L-01 | Hero 섹션 노출 | 섹션 50% 보임 | section_view {section:hero} | ✅ 구현 |
| L-02 | 서비스소개 섹션 노출 | 섹션 50% 보임 | section_view {section:features} | ✅ 구현 |
| L-03 | 이용방법 섹션 노출 | 섹션 50% 보임 | section_view {section:how-it-works} | ✅ 구현 |
| L-04 | 보안 섹션 노출 | 섹션 50% 보임 | section_view {section:security} | ✅ 구현 |
| L-05 | 후기 섹션 노출 | 섹션 50% 보임 | section_view {section:reviews} | ✅ 구현 |
| L-06 | FAQ 섹션 노출 | 섹션 50% 보임 | section_view {section:faq} | ✅ 구현 |
| L-07 | CTA 섹션 노출 | 섹션 50% 보임 | section_view {section:cta} | ✅ 구현 |
| L-08 | Hero CTA 클릭 | "무료로 시작하기" 클릭 | click {element:landing_cta_hero} | ✅ 구현 |
| L-09 | 하단 CTA 클릭 | "무료로 시작하기" 클릭 | click {element:landing_cta_bottom} | ✅ 구현 |
| L-10 | 네비 메뉴 클릭 | 상단 메뉴 클릭 | click {element:landing_nav_*} | ❌ 미구현 |

## 3. 로그인 페이지 (/auth/login)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| LG-01 | 로그인 시도 | 로그인 버튼 클릭 | funnel {step:login_attempt} | ✅ 구현 |
| LG-02 | 로그인 성공 | 로그인 성공 | funnel {step:login_success} | ✅ 구현 |
| LG-03 | 로그인 실패 | 로그인 실패 | funnel {step:login_fail} | ✅ 구현 |
| LG-04 | 카카오 로그인 클릭 | "카카오로 시작하기" 클릭 | click {element:login_kakao} | ❌ 미구현 |
| LG-05 | 회원가입 링크 클릭 | "회원가입" 링크 클릭 | click {element:login_signup_link} | ❌ 미구현 |
| LG-06 | 비밀번호 찾기 클릭 | "비밀번호 찾기" 클릭 | click {element:login_reset_pw} | ❌ 미구현 |

## 4. 회원가입 페이지 (/auth/signup)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| SU-01 | 가입 시작 | 약관동의 단계 진입 | funnel {step:signup_start} | ✅ 구현 |
| SU-02 | 카카오 인증 단계 | kakaoVerify 단계 진입 | funnel {step:signup_step_kakaoVerify} | ✅ 구현 |
| SU-03 | 정보입력 단계 | info 단계 진입 | funnel {step:signup_step_info} | ✅ 구현 |
| SU-04 | 사업자정보 단계 | businessInfo 단계 진입 | funnel {step:signup_step_businessInfo} | ✅ 구현 |
| SU-05 | 가입 완료 | complete 단계 진입 | funnel {step:signup_complete} | ✅ 구현 |
| SU-06 | 약관 동의 버튼 | "다음" 버튼 클릭 | click {element:signup_agree_next} | ❌ 미구현 |

## 5. 홈 페이지 (/)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| H-01 | 송금하기 버튼 | "송금하기" 클릭 | click {element:home_transfer} | ❌ 미구현 |
| H-02 | 거래내역 버튼 | "거래내역" 클릭 | click {element:home_deals} | ❌ 미구현 |
| H-03 | 이용가이드 링크 | "이용가이드" 클릭 | click {element:home_guide} | ❌ 미구현 |
| H-04 | 배너 클릭 | 배너 클릭 | click {element:home_banner} | ❌ 미구현 |

## 6. 송금 퍼널 (/deals/new)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| T-01 | 송금 시작 | type 단계 진입 | funnel {step:transfer_start} | ✅ 구현 |
| T-02 | 정보 입력 | amount 단계 진입 | funnel {step:transfer_info} | ✅ 구현 |
| T-03 | 수취인 입력 | recipient 단계 진입 | funnel {step:transfer_recipient} | ✅ 구현 |
| T-04 | 증빙 업로드 | docs 단계 진입 | funnel {step:transfer_attachment} | ✅ 구현 |
| T-05 | 확인 | confirm 단계 진입 | funnel {step:transfer_confirm} | ✅ 구현 |
| T-06 | 송금 완료 | 제출 성공 | funnel {step:transfer_complete} | ✅ 구현 |

## 7. 결제 퍼널 (/payment)

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| P-01 | 결제 시도 | 결제 버튼 클릭 | funnel {step:payment_attempt} | ✅ 구현 |
| P-02 | 결제 성공 | 결제 성공 | funnel {step:payment_success} | ✅ 구현 |
| P-03 | 결제 실패 | 결제 실패 | funnel {step:payment_fail} | ✅ 구현 |

## 8. 하단 네비게이션

| TC# | 항목 | 트리거 | 예상 이벤트 | 상태 |
|-----|------|--------|------------|------|
| N-01 | 홈 탭 | 홈 아이콘 클릭 | click {element:nav_home} | ❌ 미구현 |
| N-02 | 거래 탭 | 거래 아이콘 클릭 | click {element:nav_deals} | ❌ 미구현 |
| N-03 | 마이페이지 탭 | 마이페이지 아이콘 클릭 | click {element:nav_mypage} | ❌ 미구현 |

---

## 미구현 항목 요약

- L-10: 랜딩 네비 메뉴 클릭
- LG-04: 카카오 로그인 클릭
- LG-05: 회원가입 링크 클릭
- LG-06: 비밀번호 찾기 클릭
- SU-06: 약관 다음 버튼
- H-01~04: 홈 페이지 버튼들
- N-01~03: 하단 네비게이션
