# PLIC 리팩토링 로그

> 리팩토링 히스토리 및 변경 내역 기록
> 코드 구조 변경 시 영향 범위 추적을 위해 기록합니다.

---

## 2026-02-02

### [RF-010] Phase 3.3: auth/signup 컴포넌트 분할 (완료)

**날짜**: 2026-02-02

**목표**: 1,001줄 회원가입 페이지를 스텝별 컴포넌트로 분할

**변경 내용**:
1. `src/components/auth/signup/` 폴더 구조 생성
2. `constants.ts` - SignupStep 타입, 약관 목록, 파일 제한, Storage 키
3. `types.ts` - Agreement, KakaoVerificationResult, Props 인터페이스
4. `utils.ts` - 포맷팅, 유효성 검사, SessionStorage 관리 함수
5. `AgreementStep.tsx` - Step 1: 약관 동의
6. `KakaoVerifyStep.tsx` - Step 2: 카카오 인증
7. `UserInfoStep.tsx` - Step 3: 회원 정보 입력
8. `BusinessInfoStep.tsx` - Step 4: 사업자 정보 입력
9. `CompleteStep.tsx` - Step 5: 가입 완료
10. `index.ts` - 모듈 export

**영향받은 파일**:
```
- src/components/auth/signup/constants.ts (신규)
- src/components/auth/signup/types.ts (신규)
- src/components/auth/signup/utils.ts (신규)
- src/components/auth/signup/AgreementStep.tsx (신규)
- src/components/auth/signup/KakaoVerifyStep.tsx (신규)
- src/components/auth/signup/UserInfoStep.tsx (신규)
- src/components/auth/signup/BusinessInfoStep.tsx (신규)
- src/components/auth/signup/CompleteStep.tsx (신규)
- src/components/auth/signup/index.ts (신규)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

**다음 단계**:
- 메인 페이지(`auth/signup/page.tsx`)에서 분리된 컴포넌트를 사용하도록 리팩토링
- 현재는 원본 파일과 분리된 컴포넌트가 공존 (점진적 마이그레이션 가능)

---

### [RF-009] Phase 3.2: deals/[did] 컴포넌트 분할 (완료)

**날짜**: 2026-02-02

**목표**: 1,501줄 대형 컴포넌트를 재사용 가능한 컴포넌트로 분할

**변경 내용**:
1. `src/components/deal/detail/` 폴더 구조 완성
2. `constants.ts` - 상태 색상, 은행 목록, RevisionType 등 상수
3. `types.ts` - AttachmentPreview, RevisionRecipient, 컴포넌트 Props 타입
4. `StatusCard.tsx` - 거래 상태 카드 (결제 버튼 포함)
5. `AmountCard.tsx` - 결제 정보 카드 (할인 정보 포함)
6. `RecipientCard.tsx` - 수취인 정보 카드
7. `AttachmentsCard.tsx` - 첨부 서류 섹션
8. `DealHistory.tsx` - 거래 이력 타임라인
9. `DiscountSection.tsx` - 할인코드/쿠폰 적용 섹션
10. `AttachmentPreviewModal.tsx` - 첨부파일 미리보기 모달
11. `CouponModal.tsx` - 쿠폰 선택 모달
12. `RevisionDocumentsModal.tsx` - 서류 보완 모달
13. `RevisionRecipientModal.tsx` - 수취인 정보 보완 모달
14. `RevisionConfirmModal.tsx` - 보완 요청 확인 모달
15. `DeleteConfirmModal.tsx` - 삭제 확인 모달 (범용)
16. `index.ts` - 모듈 export

**영향받은 파일**:
```
- src/components/deal/detail/constants.ts (신규)
- src/components/deal/detail/types.ts (신규)
- src/components/deal/detail/StatusCard.tsx (신규)
- src/components/deal/detail/AmountCard.tsx (신규)
- src/components/deal/detail/RecipientCard.tsx (신규)
- src/components/deal/detail/AttachmentsCard.tsx (신규)
- src/components/deal/detail/DealHistory.tsx (신규)
- src/components/deal/detail/DiscountSection.tsx (신규)
- src/components/deal/detail/AttachmentPreviewModal.tsx (신규)
- src/components/deal/detail/CouponModal.tsx (신규)
- src/components/deal/detail/RevisionDocumentsModal.tsx (신규)
- src/components/deal/detail/RevisionRecipientModal.tsx (신규)
- src/components/deal/detail/RevisionConfirmModal.tsx (신규)
- src/components/deal/detail/DeleteConfirmModal.tsx (신규)
- src/components/deal/detail/index.ts (신규)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

**다음 단계**:
- 메인 페이지(`deals/[did]/page.tsx`)에서 분리된 컴포넌트를 사용하도록 리팩토링
- 현재는 원본 파일과 분리된 컴포넌트가 공존 (점진적 마이그레이션 가능)

---

### [RF-008] Phase 1.2: JWT 토큰 httpOnly 쿠키 전환

**날짜**: 2026-02-02

**목표**: XSS 공격으로부터 JWT 토큰 보호

**변경 내용**:
1. `src/app/api/auth/login/route.ts` - 로그인 프록시, httpOnly 쿠키로 토큰 설정
2. `src/app/api/auth/logout/route.ts` - 로그아웃 프록시, 쿠키 삭제
3. `src/app/api/auth/refresh/route.ts` - 토큰 갱신 프록시
4. `src/app/api/auth/me/route.ts` - 현재 로그인 상태 확인
5. `src/lib/auth.ts` - 클라이언트 측 secureAuth 유틸리티

**보안 개선**:
- 토큰이 JavaScript로 접근 불가능 (httpOnly)
- XSS 공격으로 토큰 탈취 불가
- CSRF 방어를 위한 sameSite: 'lax' 설정
- 프로덕션에서 secure: true (HTTPS만 허용)

**영향받은 파일**:
```
- src/app/api/auth/login/route.ts (신규)
- src/app/api/auth/logout/route.ts (신규)
- src/app/api/auth/refresh/route.ts (신규)
- src/app/api/auth/me/route.ts (신규)
- src/lib/auth.ts (신규)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

**해결된 버그**:
- BUG-003: JWT 토큰 localStorage 저장

---

### [RF-007] Phase 5: TypeScript strict 모드 설정 준비

**날짜**: 2026-02-02

**목표**: TypeScript strict 모드 점진적 활성화 준비

**변경 내용**:
1. `tsconfig.json`에 strict 관련 개별 옵션 명시적 추가
2. `alwaysStrict: true` 활성화 (기본적인 strict 모드)
3. 나머지 옵션은 false로 유지 (점진적 활성화 예정)

**현재 상태**:
- any 타입 사용: 139개
- strict 모드: 개별 옵션 false (점진적 활성화 필요)

**점진적 활성화 순서 (권장)**:
1. `noImplicitThis: true`
2. `strictBindCallApply: true`
3. `strictFunctionTypes: true`
4. `noImplicitAny: true` (가장 많은 수정 필요)
5. `strictNullChecks: true`
6. `strictPropertyInitialization: true`
7. 최종: `strict: true`

**테스트**:
- `npm run build` 통과

**결과**: 🟡 준비 완료 (점진적 활성화 필요)

---

### [RF-006] Phase 4: 중복 코드 제거 및 유틸리티 추출

**날짜**: 2026-02-02

**목표**: 중복 코드 제거, 공통 유틸리티 중앙화

**변경 내용**:
1. `src/lib/utils.ts`에 공통 유틸리티 함수 추가
   - `formatPhone`: 전화번호 포맷팅
   - `maskAccountNumber`: 계좌번호 마스킹
   - `formatBusinessNumber`: 사업자번호 포맷팅
   - `formatPriceKorean`: 금액 한글 변환
   - `truncate`: 문자열 말줄임
   - `isEmpty`: 빈 값 체크
   - `fileToBase64`, `base64ToFile`: 파일 변환

**영향받은 파일**:
```
- src/lib/utils.ts (유틸리티 추가)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

---

### [RF-005] Phase 3.1: deals/new 컴포넌트 분할 (완료)

**날짜**: 2026-02-02

**목표**: 1,413줄 대형 컴포넌트를 재사용 가능한 컴포넌트로 분할

**변경 내용**:
1. `src/components/deal/new/` 폴더 구조 완성
2. `constants.ts` - 위저드 스텝, 은행 목록, 최소 금액 등 상수
3. `types.ts` - AttachmentFile, StepComponentProps 등 타입
4. `utils.ts` - fileToBase64, formatAmount 등 유틸리티
5. `StepProgress.tsx` - 진행 상태 표시 컴포넌트
6. `TypeStep.tsx` - Step 1: 거래 유형 선택
7. `AmountStep.tsx` - Step 2: 송금 금액 입력
8. `RecipientStep.tsx` - Step 3: 수취인 정보 입력
9. `DocsStep.tsx` - Step 4: 서류 첨부
10. `ConfirmStep.tsx` - Step 5: 거래 확인
11. `index.ts` - 모듈 export

**영향받은 파일**:
```
- src/components/deal/new/constants.ts (신규)
- src/components/deal/new/types.ts (신규)
- src/components/deal/new/utils.ts (신규)
- src/components/deal/new/StepProgress.tsx (신규)
- src/components/deal/new/TypeStep.tsx (신규)
- src/components/deal/new/AmountStep.tsx (신규)
- src/components/deal/new/RecipientStep.tsx (신규)
- src/components/deal/new/DocsStep.tsx (신규)
- src/components/deal/new/ConfirmStep.tsx (신규)
- src/components/deal/new/index.ts (업데이트)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

**다음 단계**:
- 메인 페이지(`deals/new/page.tsx`)에서 분리된 컴포넌트를 사용하도록 리팩토링
- 현재는 원본 파일과 분리된 컴포넌트가 공존 (점진적 마이그레이션 가능)

---

### [RF-004] Phase 2.2: 상수 파일 생성 완료

**날짜**: 2026-02-02

**목표**: 매직 넘버와 문자열 상수 중앙 관리

**변경 내용**:
1. `src/lib/constants.ts` 생성
2. 거래 상태/타입 라벨, 회원 등급/상태 라벨
3. 기본 수수료율, 월 한도, 등급 승급 기준
4. UI 상수 (모바일 프레임, 페이지네이션)
5. 인증 상수 (토큰 만료, 비밀번호 정책)
6. 파일 관련 상수, 정규식 패턴, 에러 메시지

**영향받은 파일**:
```
- src/lib/constants.ts (신규 생성)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

---

### [RF-003] Phase 2.1: 환경 설정 중앙화 완료

**날짜**: 2026-02-02

**목표**: 하드코딩된 API URL 제거, 환경 설정 중앙 관리

**변경 내용**:
1. `src/lib/config.ts` 생성 - 모든 환경 설정 중앙 관리
2. `.env.local`에 `NEXT_PUBLIC_API_BASE_URL` 추가
3. `api.ts`에서 config에서 API URL 가져오도록 수정
4. `useDealDraftStore.ts`에서 config에서 API URL 가져오도록 수정

**영향받은 파일**:
```
- src/lib/config.ts (신규 생성)
- src/lib/api.ts (import 추가)
- src/stores/useDealDraftStore.ts (import 추가)
- .env.local (환경변수 추가)
```

**테스트**:
- `npm run build` 통과

**결과**: ✅ 성공

**해결된 버그**:
- BUG-005: API URL 하드코딩

---

### [RF-002] Phase 1.1: 어드민 인증 재구현 완료

**날짜**: 2026-02-02

**목표**: 하드코딩된 비밀번호 제거, 서버 사이드 인증으로 전환

**변경 내용**:
1. `useAdminStore.ts`에서 `sampleAdmins` 배열 (하드코딩된 비밀번호) 제거
2. `loginWithCredentials` 메서드 제거 (클라이언트 사이드 인증)
3. `setAdminFromResponse` 메서드 추가 (서버 응답 기반 세션 관리)
4. localStorage 버전 업그레이드 (v2 → v3)로 기존 데이터 마이그레이션
5. `IAdmin` 타입에서 `password` 필드 제거
6. `IAdminSession` 타입에 `token` 필드 추가
7. `AdminHelper.ts`에서 하드코딩된 비밀번호 제거

**영향받은 파일**:
```
- src/stores/useAdminStore.ts (전면 재구현)
- src/types/admin.ts (IAdmin, IAdminSession 수정)
- src/classes/AdminHelper.ts (password 필드 제거)
- src/app/admin/login/page.tsx (setAdminFromResponse 사용)
```

**테스트**:
- `npm run build` 통과
- 타입 오류 없음

**결과**: ✅ 성공

**해결된 버그**:
- BUG-001: 어드민 비밀번호 하드코딩
- BUG-002: 클라이언트 사이드 인증

---

### [RF-001] 리팩토링 계획 수립

**날짜**: 2026-02-02

**목표**: 코드 품질 점수 62/100 → 85/100

**계획된 변경**:

| Phase | 내용 | 상태 |
|-------|------|------|
| 1.1 | 어드민 인증 재구현 | ✅ 완료 |
| 1.2 | JWT 토큰 저장 방식 개선 | ✅ 완료 |
| 2.1 | 환경 설정 중앙화 | ✅ 완료 |
| 2.2 | 상수 파일 생성 | ✅ 완료 |
| 3.1 | deals/new 컴포넌트 분할 | ✅ 완료 |
| 3.2 | deals/[did] 컴포넌트 분할 | ✅ 완료 |
| 3.3 | auth/signup 컴포넌트 분할 | ✅ 완료 |
| 4 | 중복 코드 제거 | ✅ 완료 |
| 5 | TypeScript strict 모드 | 🟡 준비 완료 |
| 6 | 코드 품질 개선 | 🟡 추후 진행 |

**참고 문서**: `docs/01-plan/PLIC_REFACTORING_PLAN_v1.0.md`

---

## 템플릿

### [RF-XXX] 제목

**날짜**: YYYY-MM-DD

**목표**:
- 무엇을 달성하려고 했는가

**변경 내용**:
- 무엇을 변경했는가

**영향받은 파일**:
```
- 파일 경로 1 (변경 내용)
- 파일 경로 2 (변경 내용)
```

**테스트**:
- 어떻게 검증했는가

**롤백 방법**:
- 문제 발생 시 어떻게 되돌릴 것인가

**결과**:
- ✅ 성공 / ❌ 실패 / 🟡 부분 성공

---

**마지막 업데이트**: 2026-02-02 (Phase 3.3 컴포넌트 분할 완료)
