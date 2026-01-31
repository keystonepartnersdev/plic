# PLIC 프로젝트 개발 규칙

## 🚨 필수: 모바일 프레임 레이아웃 규칙

이 프로젝트는 "Fitpetmall 스타일" 데스크톱 레이아웃을 사용합니다.
**모든 고객용 UI는 반드시 모바일 프레임(375px) 내부에 렌더링되어야 합니다.**

### 레이아웃 구조
- 좌측 50%: 마케팅 패널 (고정, PLIC 로고 등)
- 우측: 모바일 프레임 (375px x 812px)
- 모바일 프레임 = 실제 앱 화면을 시뮬레이션

### 절대 금지 사항

1. **viewport 기준 중앙 배치 금지**
```tsx
// ❌ 금지 - 모바일 프레임을 벗어남
<div className="fixed inset-0 flex items-center justify-center">
<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
```

2. **fixed 포지션 사용 금지** (고객용 UI에서)
```tsx
// ❌ 금지 - viewport 기준이라 프레임 벗어남
className="fixed ..."
```

### 필수 패턴

1. **모달/다이얼로그: 모바일 프레임 기준 중앙 배치**
```tsx
// ✅ 올바른 모달 구조
<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="bg-white rounded-lg mx-4 p-6 max-w-sm w-full">
    {/* 모달 내용 */}
  </div>
</div>
```

2. **플로팅 버튼: 네비게이션 위에 배치**
```tsx
// ✅ 올바른 플로팅 버튼
<div className="absolute bottom-20 left-4 right-4 z-10">
  <Button>...</Button>
</div>
```

3. **하단 고정 요소: sticky 또는 absolute**
```tsx
// ✅ 올바른 하단 고정
<div className="sticky bottom-0">...</div>
// 또는
<div className="absolute bottom-0 left-0 right-0">...</div>
```

### 모바일 프레임 컨테이너 조건
- 반드시 `position: relative` 가져야 함
- 자식 요소의 `absolute` 기준점이 됨
- 모든 UI가 이 프레임 경계 안에서만 보여야 함

---

## 📱 모바일 UI 개발 가이드

### 화면 크기
- 기본 너비: 375px (iPhone SE 기준)
- 기본 높이: 812px
- 반응형: max-w-[390px] 또는 max-w-sm 사용

### z-index 레이어링
```
1. 배경 콘텐츠: z-0 (기본)
2. 스티키 헤더/탭: z-10
3. 플로팅 버튼: z-20
4. 모달 오버레이: z-40
5. 모달 컨텐츠: z-50
```

### 여백 및 패딩
- 기본 좌우 여백: px-4 또는 px-5
- 섹션 간격: mb-2 (8px)
- 버튼 하단 여백: pb-20 ~ pb-32 (네비게이션 고려)

---

## 🎨 디자인 시스템

### 색상
```tsx
// Primary
primary-50, primary-100, primary-400, primary-500

// Gray
gray-50, gray-100, gray-200, gray-400, gray-500, gray-600, gray-900

// Status
blue-100/700, yellow-100/700, orange-100/700, red-100/700, green-100/700
```

### 버튼
```tsx
// 기본 버튼
className="w-full h-12 bg-primary-400 hover:bg-primary-500 text-white font-semibold rounded-xl"

// 플로팅 버튼
className="w-full h-14 bg-primary-400 hover:bg-primary-500 text-white font-semibold text-lg rounded-xl shadow-lg"
```

### 카드/컨테이너
```tsx
// 기본 카드
className="bg-white rounded-xl p-4 shadow-sm"

// 섹션 카드
className="bg-white px-5 py-6 mb-2"
```

---

## 🔧 컴포넌트 사용 규칙

### Modal 컴포넌트
```tsx
import { Modal } from '@/components/common';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="제목"
>
  <p>내용</p>
</Modal>
```

### Header 컴포넌트
```tsx
import { Header } from '@/components/common';

<Header title="페이지 제목" showBack />
```

### BottomNav 컴포넌트
- 자동으로 MobileLayout에 포함됨
- 높이: h-14 (56px)
- z-index: z-50

---

## 📝 코드 작성 규칙

### 1. 상태 관리
- Zustand 사용
- persist middleware로 localStorage 동기화
- Store 위치: `/src/stores/`

### 2. 타입 정의
- TypeScript 필수
- 타입 위치: `/src/types/`
- Interface 접두사: `I` (예: IUser, IDeal)
- Type 접두사: `T` (예: TUserStatus, TDealType)

### 3. 유틸리티
- Helper 클래스: `/src/classes/` (예: UserHelper, DealHelper)
- 공통 함수: `/src/lib/utils.ts`

### 4. 파일 구조
```
src/
├── app/
│   ├── (customer)/        # 고객용 페이지
│   └── (admin)/          # 관리자 페이지
├── components/
│   ├── common/           # 공통 컴포넌트
│   ├── deal/             # 거래 관련
│   └── admin/            # 관리자 전용
├── stores/               # Zustand 스토어
├── types/                # TypeScript 타입
├── classes/              # Helper 클래스
└── lib/                  # 유틸리티
```

---

## ⚠️ 주의사항

### 1. 계정 상태 체크
- 탈퇴 회원(`withdrawn`): 로그인 불가
- 정지 회원(`suspended`): 로그인 후 팝업 + 송금 불가
- 대기 회원(`pending`): 송금 신청 시에만 팝업
- 활성 회원(`active`): 모든 기능 사용 가능

### 2. 상태 동기화
- 어드민에서 사용자 상태 변경 시 `updateUserInList` 호출
- `currentUser`와 `users` 배열 모두 동기화 필요
- `/src/stores/useUserStore.ts:144-161` 참고

### 3. 드래프트 관리
- 새로운 송금 시작 시 `clearCurrentDraft()` 호출
- 홈/거래내역 페이지 진입 시 자동 클리어

### 4. FAQ 표시
- 카테고리 태그 + 제목 표시
- 제목 최대 14자 (한글 기준) + 말줄임표
- 아코디언 형태 (클릭 시 답변 표시)

---

## 🚀 개발 흐름

1. **요구사항 확인**
   - 모바일 프레임 내부 작업인지 확인
   - 어드민 페이지는 예외 (전체 화면 사용 가능)

2. **컴포넌트 선택**
   - 공통 컴포넌트 우선 사용 (Modal, Header 등)
   - 없으면 새로 생성 후 `/components/common/index.ts`에 export

3. **스타일 적용**
   - Tailwind CSS 사용
   - 커스텀 스타일은 최소화
   - `cn()` 유틸리티로 조건부 스타일 적용

4. **테스트**
   - 모바일 프레임 경계 확인
   - 네비게이션과 겹침 확인
   - 모달/팝업 위치 확인

---

## 📚 참고 파일

- **레이아웃**: `/src/components/common/MobileLayout.tsx`
- **모달**: `/src/components/common/Modal.tsx`
- **네비게이션**: `/src/components/common/BottomNav.tsx`
- **사용자 스토어**: `/src/stores/useUserStore.ts`
- **타입 정의**: `/src/types/`

---

**이 규칙은 모든 개발 작업에 필수적으로 적용되어야 합니다.**
