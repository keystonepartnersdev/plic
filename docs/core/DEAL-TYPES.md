# PLIC 거래 타입 정의서

> **핵심 문서** - 거래 관련 코드 작성 시 반드시 참조
>
> 이 문서는 PLIC의 12개 거래 타입, 상태 전이, 수수료 규칙을 정의합니다.

### 관련 핵심 문서
| 문서 | 설명 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 전체 시스템 구조 |
| [REGISTRY.md](./REGISTRY.md) | 함수/클래스 위치 찾기 |

---

## 1. 거래 타입 (12종)

### 1.1 타입별 상세

| 코드 | 한글명 | 영문명 | 설명 | 필수 서류 |
|------|--------|--------|------|----------|
| `product_purchase` | 물품구매 | Product Purchase | 원자재, 부품, 완제품 구매 | 견적서, 거래명세서 |
| `labor_cost` | 인건비 | Labor Cost | 급여, 일당, 상여금 | 근로계약서, 급여명세서 |
| `service_fee` | 서비스이용료 | Service Fee | 구독료, 사용료, 이용료 | 이용계약서, 청구서 |
| `construction` | 공사대금 | Construction | 건설, 인테리어 공사 | 공사계약서, 공사명세서 |
| `rental_fee` | 임차료 | Rental Fee | 월세, 장비임대, 사무실 | 임대차계약서 |
| `logistics` | 물류비 | Logistics | 배송, 운송, 창고 | 운송계약서, 배송명세서 |
| `marketing` | 광고마케팅 | Marketing | 광고비, 마케팅비 | 광고계약서, 매체비 명세 |
| `equipment` | 장비구매 | Equipment | 기계, 장비, 설비 구매 | 매매계약서, 견적서 |
| `maintenance` | 유지보수 | Maintenance | A/S, 유지보수, 수리 | 유지보수계약서 |
| `consulting` | 컨설팅 | Consulting | 컨설팅, 자문, 용역 | 용역계약서 |
| `other` | 기타 | Other | 위 분류에 해당하지 않음 | 관련 증빙서류 |
| `unknown` | 미지정 | Unknown | 미분류 (기본값) | - |

### 1.2 타입별 아이콘/색상 (UI)

```typescript
const DEAL_TYPE_CONFIG = {
  product_purchase: { icon: 'Package', color: 'blue' },
  labor_cost: { icon: 'Users', color: 'green' },
  service_fee: { icon: 'CreditCard', color: 'purple' },
  construction: { icon: 'Building', color: 'orange' },
  rental_fee: { icon: 'Home', color: 'teal' },
  logistics: { icon: 'Truck', color: 'indigo' },
  marketing: { icon: 'Megaphone', color: 'pink' },
  equipment: { icon: 'Tool', color: 'gray' },
  maintenance: { icon: 'Wrench', color: 'yellow' },
  consulting: { icon: 'Briefcase', color: 'cyan' },
  other: { icon: 'FileText', color: 'slate' },
  unknown: { icon: 'HelpCircle', color: 'gray' },
};
```

---

## 2. 거래 상태 (8종)

### 2.1 상태 코드

| 코드 | 한글명 | 설명 | 다음 가능 상태 |
|------|--------|------|----------------|
| `draft` | 임시저장 | 작성 중, 미제출 | awaiting_payment, cancelled |
| `awaiting_payment` | 결제대기 | 거래 생성됨, 결제 전 | pending, payment_failed, cancelled |
| `pending` | 심사대기 | 결제 완료, 검토 전 | reviewing, cancelled |
| `reviewing` | 심사중 | 관리자 검토 중 | completed, revision_requested, cancelled |
| `revision_requested` | 수정요청 | 서류 보완 필요 | pending (재제출 후), cancelled |
| `completed` | 완료 | 송금 완료 | - (최종) |
| `cancelled` | 취소 | 취소됨 | - (최종) |
| `payment_failed` | 결제실패 | 결제 오류 | awaiting_payment (재시도) |

### 2.2 상태 전이 다이어그램

```
                                ┌───────────────┐
                                │    draft      │
                                └───────┬───────┘
                                        │
                        ┌───────────────▼───────────────┐
                        │      awaiting_payment         │
                        └───────┬───────────────┬───────┘
                                │               │
                    ┌───────────▼───┐     ┌─────▼─────────┐
                    │    pending    │     │ payment_failed │
                    └───────┬───────┘     └───────────────┘
                            │                     │
                    ┌───────▼───────┐             │
                    │   reviewing   │◀────────────┘
                    └───┬───────┬───┘      (재결제)
                        │       │
            ┌───────────▼─┐   ┌─▼───────────────────┐
            │  completed  │   │  revision_requested │
            └─────────────┘   └──────────┬──────────┘
                                         │
                                         ▼
                                   (수정 후 재제출)
                                         │
                                         ▼
                                    pending

            * 모든 상태에서 cancelled로 전이 가능 (취소)
```

### 2.3 상태별 UI 스타일

```typescript
const STATUS_CONFIG = {
  draft: {
    label: '임시저장',
    badge: 'gray',
    actions: ['continue', 'delete']
  },
  awaiting_payment: {
    label: '결제대기',
    badge: 'yellow',
    actions: ['pay', 'cancel']
  },
  pending: {
    label: '심사대기',
    badge: 'blue',
    actions: ['cancel']
  },
  reviewing: {
    label: '심사중',
    badge: 'purple',
    actions: []
  },
  revision_requested: {
    label: '수정요청',
    badge: 'orange',
    actions: ['edit', 'cancel']
  },
  completed: {
    label: '완료',
    badge: 'green',
    actions: ['receipt']
  },
  cancelled: {
    label: '취소',
    badge: 'red',
    actions: []
  },
  payment_failed: {
    label: '결제실패',
    badge: 'red',
    actions: ['retry', 'cancel']
  },
};
```

---

## 3. 수수료 체계

### 3.1 등급별 수수료율

| 등급 | 수수료율 | 월 한도 | 설명 |
|------|---------|--------|------|
| `basic` | 5.5% | 2,000만원 | 기본 등급 |
| `platinum` | 4.5% | 5,000만원 | 우대 등급 |
| `b2b` | 3.5% | 1억원 | 사업자 등급 |
| `employee` | 0% | - | 내부 직원 |

### 3.2 수수료 계산 공식

```typescript
// 기본 계산
feeAmount = amount * (feeRate / 100)
totalAmount = amount + feeAmount

// 할인 적용
discountAmount = feeAmount * (discountRate / 100)
finalAmount = totalAmount - discountAmount

// 예시: 100만원 거래, basic 등급 (5.5%)
// feeAmount = 1,000,000 * 0.055 = 55,000
// totalAmount = 1,000,000 + 55,000 = 1,055,000
```

### 3.3 할인코드 적용

| 할인코드 | 할인율 | 조건 |
|---------|--------|------|
| `WELCOME10` | 10% | 첫 거래 |
| `VIP20` | 20% | VIP 회원 |
| `EVENT30` | 30% | 프로모션 |

---

## 4. 거래 생성 플로우

### 4.1 5단계 위저드

```
Step 1: 거래 유형 선택
    └─▶ 12개 타입 중 선택

Step 2: 금액 입력
    └─▶ 원금 입력
    └─▶ 수수료 자동 계산
    └─▶ 할인코드 적용 (선택)

Step 3: 수취인 정보 입력
    └─▶ 은행 선택
    └─▶ 계좌번호 입력
    └─▶ 예금주 입력
    └─▶ 계좌 실명 인증

Step 4: 서류 업로드
    └─▶ 거래 유형별 필수 서류
    └─▶ 파일 업로드 (이미지/PDF)

Step 5: 최종 확인
    └─▶ 거래 내용 확인
    └─▶ 이용약관 동의
    └─▶ 결제 진행
```

### 4.2 거래 생성 시 데이터 구조

```typescript
interface IDeal {
  // 기본 정보
  did: string;           // 거래 ID (자동 생성)
  uid: string;           // 사용자 ID
  dealType: TDealType;   // 거래 유형

  // 상태
  status: TDealStatus;   // 거래 상태

  // 금액
  amount: number;        // 원금
  feeRate: number;       // 수수료율
  feeAmount: number;     // 수수료
  totalAmount: number;   // 총액 (원금 + 수수료)
  discountCode?: string; // 할인코드
  discountAmount: number; // 할인금액
  finalAmount: number;   // 최종결제금액

  // 수취인 정보
  recipient: {
    bank: string;          // 은행명
    accountNumber: string; // 계좌번호
    accountHolder: string; // 예금주
  };

  // 서류
  attachments: string[];   // 첨부파일 URL 배열

  // 결제 정보
  paymentId?: string;      // 결제 ID
  pgTransactionId?: string; // PG 거래 ID
  isPaid: boolean;

  // 송금 정보
  isTransferred: boolean;
  transferredAt?: Date;

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;

  // 히스토리
  history: IDealHistory[];
}

interface IDealHistory {
  timestamp: Date;
  action: string;
  previousStatus?: TDealStatus;
  newStatus?: TDealStatus;
  note?: string;
  adminId?: string;
}
```

---

## 5. 필수 서류 규칙

### 5.1 타입별 필수 서류

| 거래 유형 | 필수 서류 | 선택 서류 |
|----------|----------|----------|
| 물품구매 | 견적서 또는 거래명세서 | 납품서 |
| 인건비 | 근로계약서 | 급여명세서 |
| 서비스이용료 | 이용계약서 | 청구서 |
| 공사대금 | 공사계약서 | 공사명세서, 준공확인서 |
| 임차료 | 임대차계약서 | 월세청구서 |
| 물류비 | 운송계약서 | 배송명세서 |
| 광고마케팅 | 광고계약서 | 매체비 명세 |
| 장비구매 | 매매계약서 | 견적서 |
| 유지보수 | 유지보수계약서 | 작업명세서 |
| 컨설팅 | 용역계약서 | 결과보고서 |
| 기타 | 관련 증빙서류 1종 이상 | - |

### 5.2 파일 업로드 규칙

```typescript
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
};
```

---

## 6. 수정 요청 (Revision) 프로세스

### 6.1 수정 요청 사유

| 사유 코드 | 한글명 | 설명 |
|-----------|--------|------|
| `document_unclear` | 서류 불명확 | 서류가 선명하지 않음 |
| `document_mismatch` | 서류 불일치 | 거래 내용과 서류 불일치 |
| `document_missing` | 서류 누락 | 필수 서류 누락 |
| `amount_mismatch` | 금액 불일치 | 서류상 금액과 입력 금액 불일치 |
| `recipient_mismatch` | 수취인 불일치 | 수취인 정보 불일치 |
| `other` | 기타 | 기타 사유 |

### 6.2 수정 요청 플로우

```
관리자: 거래 검토
    │
    ├─▶ [승인] ──▶ completed (송금 진행)
    │
    └─▶ [수정요청] ──▶ revision_requested
                         │
                         ▼
                    사용자에게 알림
                         │
                         ▼
                    사용자: 서류 수정/재업로드
                         │
                         ▼
                    사용자: 재제출
                         │
                         ▼
                    pending (재심사)
```

---

## 7. 취소 규칙

### 7.1 상태별 취소 가능 여부

| 상태 | 취소 가능 | 환불 | 비고 |
|------|----------|------|------|
| draft | ✅ | - | 단순 삭제 |
| awaiting_payment | ✅ | - | 결제 전 취소 |
| pending | ✅ | 전액 | 24시간 내 환불 |
| reviewing | ✅ | 전액 | 24시간 내 환불 |
| revision_requested | ✅ | 전액 | 24시간 내 환불 |
| completed | ❌ | - | 송금 완료 후 취소 불가 |
| cancelled | - | - | 이미 취소됨 |

### 7.2 취소 사유

```typescript
type TCancelReason =
  | 'user_request'      // 사용자 요청
  | 'payment_failed'    // 결제 실패
  | 'document_rejected' // 서류 반려
  | 'fraud_detected'    // 사기 의심
  | 'limit_exceeded'    // 한도 초과
  | 'admin_cancel';     // 관리자 취소
```

---

## 8. 한도 관리

### 8.1 한도 종류

| 한도 유형 | 기본값 | 설명 |
|----------|--------|------|
| 월 한도 | 2,000만원 | 등급별 상이 |
| 건당 최소 | 1만원 | 모든 등급 동일 |
| 건당 최대 | 5,000만원 | 월 한도 내에서 |

### 8.2 한도 체크 로직

```typescript
function validateLimit(user: IUser, amount: number): boolean {
  // 1. 건당 최소/최대 체크
  if (amount < 10000) return false;
  if (amount > 50000000) return false;

  // 2. 월 한도 체크
  const remainingLimit = user.monthlyLimit - user.usedAmount;
  if (amount > remainingLimit) return false;

  return true;
}
```

---

## 9. 데이터 검증 규칙

### 9.1 계좌번호 검증

| 은행 | 계좌번호 길이 | 포맷 |
|------|-------------|------|
| 국민은행 | 14자리 | `\d{6}-\d{2}-\d{6}` |
| 신한은행 | 12자리 | `\d{3}-\d{3}-\d{6}` |
| 우리은행 | 13자리 | `\d{4}-\d{3}-\d{6}` |
| 하나은행 | 14자리 | `\d{3}-\d{6}-\d{5}` |
| 농협 | 13-14자리 | `\d{3}-\d{4}-\d{4}-\d{2}` |
| ... | ... | ... |

### 9.2 금액 검증

```typescript
const AMOUNT_RULES = {
  min: 10000,          // 최소 1만원
  max: 50000000,       // 최대 5천만원
  step: 1,             // 1원 단위
};
```

---

## 10. 타입 정의 (TypeScript)

```typescript
// 거래 유형
type TDealType =
  | 'product_purchase'
  | 'labor_cost'
  | 'service_fee'
  | 'construction'
  | 'rental_fee'
  | 'logistics'
  | 'marketing'
  | 'equipment'
  | 'maintenance'
  | 'consulting'
  | 'other'
  | 'unknown';

// 거래 상태
type TDealStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'pending'
  | 'reviewing'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'payment_failed';

// 수취인 정보
interface IRecipientAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  isVerified: boolean;
}

// 거래 히스토리
interface IDealHistory {
  timestamp: Date;
  action: string;
  previousStatus?: TDealStatus;
  newStatus?: TDealStatus;
  note?: string;
  adminId?: string;
}
```

---

**마지막 업데이트**: 2026-02-02
