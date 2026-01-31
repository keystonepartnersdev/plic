# PLIC 문서 작성 트리

## 📋 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.2 |
| 작성일 | 2025-01-05 |
| 수정일 | 2025-01-05 |

---

## 문서 구조

```
[0. Overview] ✅ 완료
├── PROJECT_PLIC_STRUCTURE.md ✅
├── PLIC_INFRA_ROADMAP.md ✅
└── PLIC_DB_SCHEMA.md ✅ (v2.1)

[1. Design & Policy] Phase 1
├── PLIC_PRD.md ✅ (v1.2)
├── PLIC_GLOSSARY.md              ← 다음 작업
├── PLIC_FUNDS_FLOW.md
├── PLIC_STATE_MACHINES.md
├── PLIC_EXTERNAL_INTERFACE.md
└── PLIC_API_SPEC.md

[2. Architecture & Integrity] Phase 1~3
├── PLIC_BATCH_AND_JOBS.md
└── PLIC_RECONCILIATION_SETTLEMENT.md

[3. Development] Phase 3
└── PLIC_ENGINEERING_GUIDE.md

[4. Operation & QA] Phase 7
├── PLIC_OPERATIONS_HANDBOOK.md
├── PLIC_OPERATION_SOP.md
├── PLIC_QA_SCENARIO.md
├── PLIC_SECURITY.md
└── PLIC_ADMIN_GUIDE.md
```

---

## 문서별 포함 내용 상세

### [0. Overview] 완료된 문서

| 문서 | 상태 | 설명 |
|------|------|------|
| PROJECT_PLIC_STRUCTURE.md | ✅ | 프로젝트 구조, 디렉토리, 타입 정의 |
| PLIC_INFRA_ROADMAP.md | ✅ | AWS 아키텍처, 14주 개발 일정 |
| PLIC_DB_SCHEMA.md | ✅ | 전체 테이블 정의, 상태 정의, 암호화 정책 |
| PLIC_PRD.md | ✅ v1.2 | 제품 요구사항, 정책 정의 |

---

### [1. Design & Policy] Phase 1 문서

#### PLIC_GLOSSARY.md
> **역할**: 전체 용어 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 핵심 용어 정의 (결제자, 수취인, 거래, 결제, 송금 등) | PRD 부록 A |
| 상태 코드 용어 (PENDING, PAID, TRANSFERRING 등) | PRD 섹션 9.1 |
| 기술 용어 (billingKey, CI, 차지백, 대사 등) | PRD 전체 |
| 약어 정리 (PG, FDS, KYC, SLA 등) | - |

---

#### PLIC_FUNDS_FLOW.md
> **역할**: 자금 흐름 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 자금 흐름 상세 다이어그램 | PRD 섹션 2.1 확장 |
| 선지급 구조 상세 설명 | PRD 섹션 2.2 |
| PG 정산 주기별 시나리오 | PRD 섹션 2.2 |
| 운영자금 산정 공식 | PRD 섹션 2.2 |
| 서킷브레이커 상세 로직 | PRD 섹션 2.3 |
| 차지백 시나리오별 자금 흐름 | PRD 섹션 2.4 |
| 회계 처리 (수익 인식, 환불 환입) | PRD 섹션 6.3 |
| Ledger entries 상세 | DB_SCHEMA |

---

#### PLIC_STATE_MACHINES.md
> **역할**: 상태 전이 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| Deal 상태 전이 다이어그램 | PRD 섹션 9.2 확장 |
| Payment 상태 전이 | DB_SCHEMA |
| Transfer 상태 전이 | DB_SCHEMA |
| Transfer Job 상태 전이 | PRD 섹션 10.5 |
| Job ↔ Deal 상태 매핑 상세 | PRD 섹션 10.5 |
| 환불 가능 조건 상태 매트릭스 | PRD 섹션 11.2.1 |
| 상태별 허용 액션 정의 | - |
| 에러 상태 복구 플로우 | - |

---

#### PLIC_EXTERNAL_INTERFACE.md
> **역할**: 외부 연동 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| **PG 연동 (소프트페이먼트)** | |
| - 빌링키 발급 API | PRD 섹션 8.1.3 |
| - 결제 승인 API | - |
| - 결제 취소 API | PRD 섹션 11.2.3 |
| - 웹훅 수신 스펙 | PRD 섹션 10.3 |
| - 에러 코드 정의 | - |
| **송금 연동 (펌뱅킹/지급대행)** | |
| - 계좌 실명조회 API | PRD 섹션 9.3 |
| - 송금 API | PRD 섹션 10.3 |
| - 송금 결과 조회 API | - |
| - 에러 코드 및 재시도 정책 | PRD 섹션 10.6 |
| **본인인증 연동** | |
| - PASS 인증 API | PRD 섹션 3.1.3 |
| - SMS 인증 API | PRD 섹션 3.1.3 |
| **은행 코드표** | PRD v1.0 부록 B에서 이동 |
| **카드사 코드표** | - |

---

#### PLIC_API_SPEC.md
> **역할**: 내부 API SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 인증 API (로그인, 토큰 갱신) | - |
| 회원 API (가입, 탈퇴, 정보 수정) | PRD 섹션 3 |
| 카드 API (등록, 삭제, 목록) | PRD 섹션 8 |
| 거래 API (생성, 조회, 취소) | PRD 섹션 9 |
| 결제 API (결제 요청) | PRD 섹션 10 |
| 환불 API (환불 요청) | PRD 섹션 11 |
| 즐겨찾기 API | PRD 섹션 13 |
| 할인코드 API (검증, 적용) | PRD 섹션 7 |
| **멱등성 헤더 스펙** | PRD 섹션 17.5 |
| - Idempotency-Key 형식 | PRD 섹션 17.5.2 |
| - 충돌 시 409 응답 스펙 | PRD 섹션 17.5.3 |
| - 저장 항목 및 TTL | PRD 섹션 17.5.4 |
| 에러 응답 표준 | - |

---

### [2. Architecture & Integrity] Phase 1~3 문서

#### PLIC_BATCH_AND_JOBS.md
> **역할**: 배치/잡 처리 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 등급 변경 배치 (매월 1일) | PRD 섹션 4.2 |
| 휴면 회원 처리 배치 | PRD 섹션 3.2 |
| 카드 만료 알림 배치 | PRD 섹션 14.2 |
| **송금 재시도 Job** | PRD 섹션 10.4 |
| - 재시도 간격 (Exponential backoff) | PRD 섹션 10.4 |
| - ABANDONED 전환 조건 | PRD 섹션 10.4 |
| - Job 상태 관리 | PRD 섹션 10.5 |
| 서킷브레이커 모니터링 Job | PRD 섹션 2.3 |
| 할인코드 만료 처리 | PRD 섹션 7.1.3 |

---

#### PLIC_RECONCILIATION_SETTLEMENT.md
> **역할**: 정산/대사 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 대사 대상 정의 | PRD 섹션 2.5 |
| 대사 배치 로직 (매일 09:00) | PRD 섹션 2.5 |
| 불일치 유형 및 복구 절차 | PRD 섹션 2.5 |
| 복구 SLA (4시간/24시간) | PRD 섹션 2.5 |
| PG 정산금 수신 처리 | PRD 섹션 2.1 |
| 정산 리포트 생성 | - |

---

### [3. Development] Phase 3 문서

#### PLIC_ENGINEERING_GUIDE.md
> **역할**: 개발 가이드 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| **플랫폼 정책** | PRD v1.0 섹션 16에서 이동 |
| - 지원 OS 버전 (iOS 14+, Android 8+) | PRD v1.0 |
| - 하이브리드 앱 구조 (Capacitor) | PRD v1.0 |
| - 앱 업데이트 정책 (강제/선택) | PRD v1.0 |
| **기술 스택 상세** | PRD v1.0 부록에서 이동 |
| - Frontend (Next.js, Zustand, shadcn/ui) | INFRA_ROADMAP |
| - Backend (Node.js, PostgreSQL) | INFRA_ROADMAP |
| - Infrastructure (AWS) | INFRA_ROADMAP |
| **코딩 컨벤션** | - |
| **Git 브랜치 전략** | - |
| **배포 파이프라인** | - |
| **환경 변수 관리** | - |

---

### [4. Operation & QA] Phase 7 문서

#### PLIC_SECURITY.md
> **역할**: 보안 정책 상세 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| **암호화 구현 상세** | PRD 섹션 17.1에서 확장 |
| - AES-256 암호화 (billingKey, 계좌번호) | PRD 섹션 17.1 |
| - bcrypt 해싱 (비밀번호) | PRD 섹션 17.1 |
| - HMAC-SHA256 (검색용 해시) | PRD 섹션 17.1 |
| - AWS KMS 키 관리 | DB_SCHEMA |
| **전송 암호화** | PRD 섹션 17.1에서 확장 |
| - TLS 1.3 설정 | PRD 섹션 17.1 |
| - 인증서 관리 | - |
| **인증/인가 구현** | PRD 섹션 17.3에서 확장 |
| - JWT 토큰 구조 및 만료 정책 | PRD 섹션 17.3 |
| - 세션 관리 | PRD 섹션 17.3 |
| - 2FA(OTP) 구현 | PRD 섹션 17.3 |
| **네트워크 보안** | PRD 섹션 17.3에서 확장 |
| - VPC 구성 | PRD 섹션 17.3 |
| - Security Group 규칙 | - |
| - WAF 설정 | - |
| **PCI-DSS SAQ-A 준수 체크리스트** | PRD 섹션 17.2 |
| **취약점 관리** | - |
| **침해 대응 절차** | - |

---

#### PLIC_ADMIN_GUIDE.md
> **역할**: 어드민 운영 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| **콘텐츠 정책** | PRD v1.0 섹션 17에서 이동 |
| - 공지사항 CRUD | PRD v1.0 |
| - FAQ CRUD | PRD v1.0 |
| - 배너 CRUD | PRD v1.0 |
| **회원 관리 가이드** | PRD 섹션 16.2 |
| **거래 관리 가이드** | PRD 섹션 16.2 |
| - 수동 송금 처리 절차 | PRD 섹션 16.2 |
| - ABANDONED 거래 처리 | PRD 섹션 10.5 |
| **할인코드 관리** | PRD 섹션 7 |
| - 고할인 코드 생성 권한 | PRD 섹션 7.2.2 |
| **감사 로그 조회/분석** | PRD 섹션 16.3 |

---

#### PLIC_OPERATIONS_HANDBOOK.md
> **역할**: 일상 운영 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 일일 운영 체크리스트 | - |
| 대사 결과 확인 절차 | PRD 섹션 2.5 |
| 서킷브레이커 모니터링 | PRD 섹션 2.3 |
| 알림 대응 가이드 | PRD 섹션 14 |
| CS 대응 가이드 | - |

---

#### PLIC_OPERATION_SOP.md
> **역할**: 긴급 상황 대응 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 장애 대응 SOP | - |
| **차지백 대응 SOP** | PRD 섹션 2.4 |
| - 대응 SLA (5영업일) | PRD 섹션 2.4.3 |
| - 증빙 항목 체크리스트 | PRD 섹션 2.4.4 |
| - 계정 정지 절차 | PRD 섹션 2.4.5 |
| 운영자금 부족 대응 | PRD 섹션 2.3 |
| 대사 불일치 복구 SOP | PRD 섹션 2.5 |
| 보안 사고 대응 | PLIC_SECURITY.md |

---

#### PLIC_QA_SCENARIO.md
> **역할**: QA 테스트 SSOT

| 포함 내용 | 출처 |
|-----------|------|
| 회원 가입/탈퇴 시나리오 | PRD 섹션 3 |
| 카드 등록/삭제 시나리오 | PRD 섹션 8 |
| 거래 생성/완료 시나리오 | PRD 섹션 9, 10 |
| 환불 시나리오 (조건별) | PRD 섹션 11 |
| 점검시간 거래 시나리오 | PRD 섹션 10.2 |
| 송금 실패/재시도 시나리오 | PRD 섹션 10.4, 10.6 |
| 할인코드 적용 시나리오 | PRD 섹션 7 |
| 한도 초과 시나리오 | PRD 섹션 5 |
| 서킷브레이커 시나리오 | PRD 섹션 2.3 |
| 멱등성 테스트 시나리오 | PRD 섹션 17.5 |

---

## 문서 간 참조 관계

```
PLIC_PRD.md (정책 요약 - SSOT)
    │
    ├──▶ PLIC_GLOSSARY.md (용어 SSOT)
    │
    ├──▶ PLIC_FUNDS_FLOW.md (자금 흐름 SSOT)
    │       └── 서킷브레이커, 차지백, 정산 상세
    │
    ├──▶ PLIC_STATE_MACHINES.md (상태 SSOT)
    │       └── Deal/Payment/Transfer/Job 상태 전이
    │
    ├──▶ PLIC_EXTERNAL_INTERFACE.md (외부 연동 SSOT)
    │       └── PG/송금/SMS API, 은행/카드사 코드
    │
    ├──▶ PLIC_API_SPEC.md (내부 API SSOT)
    │       └── 멱등성 헤더 스펙 포함
    │
    ├──▶ PLIC_SECURITY.md (보안 SSOT)
    │       └── 암호화, TLS, JWT, VPC 상세
    │
    ├──▶ PLIC_ENGINEERING_GUIDE.md (개발 SSOT)
    │       └── 플랫폼 정책, 기술 스택, 앱 업데이트
    │
    └──▶ PLIC_ADMIN_GUIDE.md (어드민 SSOT)
            └── 콘텐츠 정책, 운영 가이드
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-01-05 | 초안 작성 |
| 1.1 | 2025-01-05 | PRD v1.1 완료, PLIC_ADMIN_GUIDE.md 추가 |
| 1.2 | 2025-01-05 | PRD v1.2 반영, 각 문서별 포함 내용 상세화 |

### v1.2 변경 상세

| 구분 | 변경 내용 |
|------|-----------|
| **문서별 포함 내용** | 각 문서에 어떤 내용이 들어가야 하는지 상세 정의 |
| **출처 명시** | PRD 섹션 번호 등 출처 표기로 추적 가능 |
| **PLIC_SECURITY.md** | PRD 17.1~17.3에서 분리될 상세 내용 정의 |
| **PLIC_API_SPEC.md** | 멱등성 헤더 스펙 포함 명시 |
| **PLIC_OPERATION_SOP.md** | 차지백 대응 SOP 상세 포함 |
| **PLIC_QA_SCENARIO.md** | 서킷브레이커, 멱등성 테스트 시나리오 추가 |
