아래 평가는 **업로드된 최신 로드맵/스키마 기준(v2.0 표기)**으로 했고, “서비스를 안전하게(중복/누락/정산/감사) 런칭 가능하냐” 관점에서 정합성 + 운영 가능성 + 확장성을 봤습니다.

총평

방향은 매우 적정합니다. 특히 (1) 멱등성(클라/웹훅) (2) 송금 잡 큐 (3) 감사로그 (4) Split 모델 명확화 (5) Optimistic Lock까지 한 번에 들어가면서, “카드→계좌”에서 가장 흔한 사고(중복 결제/중복 송금/누락 송금/재시도 폭주)를 막는 뼈대가 갖춰졌습니다.

pg_webhook_events, idempotency_keys, transfer_jobs 설계 자체는 P0로 충분히 타당합니다. 

plic-db-schema

 

plic-db-schema

Payment(계획) / PaymentSlice(실결제) 분리는 매우 좋은 선택입니다. 

plic-db-schema

 

plic-db-schema

admin_audit_logs, ledger_entries까지 포함된 점은 “운영/감사/정산” 관점에서 한 단계 성숙합니다. 

plic-db-schema

다만 문서/설계 정합성 측면에서 즉시 손봐야 하는 P0 이슈 4개가 보입니다.

P0 즉시 수정 권고 (Critical)
1) “수취인 송금액에서 수수료 차감”으로 오해되는 문구(서비스 정의 위배)

로드맵 서비스 흐름에 **“수수료 차감 후 송금”**으로 적혀 있습니다. 

plic-infra-roadmap


그런데 같은 문서의 수익 모델/흐름은 수취인 100만원 전액 수령을 전제로 하고 있습니다. 

plic-infra-roadmap


→ 즉시 문구를 “원금 전액 송금”으로 통일해야 합니다. (수수료는 결제자 카드 결제 총액에 포함)

권장 수정안

Step 2: “(원금+수수료) 카드 결제”

Step 4: “(원금 전액) 수취인 계좌로 송금”

2) “카드번호 서버 미경유(토큰화)” 설명과 API 예시가 서로 충돌

로드맵에 “서버에 카드번호(PAN)/CVC가 오지 않게 토큰화(SDK/Hosted)”를 명시해뒀는데 

plic-infra-roadmap


바로 아래 예시 요청은 cardNumber, expiry, cvc를 서버로 보내는 형태입니다. 

plic-infra-roadmap

→ 이 상태로는 개발팀이 PCI 경로를 잘못 구현할 확률이 높습니다. (감사/보안/리스크 폭발 포인트)

권장 정리(둘 중 하나로 문서를 “한 가지”로 고정)

A안(권장): 클라→PG SDK에서 billingKey 발급, 서버는 billingKey만 수신/저장

B안: 서버가 카드정보를 받는다면(비권장) 해당 경로는 PCI 범위가 커지므로 명시적으로 인정하고 통제 설계(키보드보안/전송/로그 마스킹/저장금지 등)를 문서에 포함

3) “SQS 큐”와 “DB transfer_jobs 큐”가 동시에 등장 → 책임경계 불명확

로드맵 인프라 스택에는 **SQS(송금/결제 작업 큐)**가 있고 

plic-infra-roadmap


DB에는 **transfer_jobs(송금 작업 큐)**가 있습니다. 

plic-db-schema

둘 다 “큐”로 쓰면 중복/유실/재처리 정책이 모호해집니다.
→ 둘 중 하나를 “소스 오브 트루스”로 정해야 합니다.

권장 아키텍처(현 설계를 살리는 최소 변경)

DB transfer_jobs = 진실(상태/재시도/락/감사)

SQS는 선택: “워커 깨우는 신호/버퍼” 역할만(메시지 유실돼도 DB 폴링으로 회복 가능)

문서에 “정확히 한 번 송금” 보장을 DB의 UNIQUE/업서트로 달성한다고 적어두기

4) transfer_jobs 중복 생성 방지 장치가 약함

transfer_jobs는 deal_id 인덱스만 있고 

plic-db-schema


“deal당 잡 1개”를 강제하는 유니크 제약이 없습니다.
웹훅 중복/내부 재시도에서 잡이 2개 생기면, 락을 잘 잡아도 중복 송금 시나리오가 열립니다.

권장(간단/효과 큼)

CREATE UNIQUE INDEX ... ON transfer_jobs(deal_id) WHERE status IN ('PENDING','PROCESSING','FAILED');

잡 생성 시 INSERT ... ON CONFLICT DO NOTHING 패턴 표준화

P1 런칭 전 점검 권고 (High)
5) pg_webhook_events는 “중복 방지”는 되는데, “연결/조회/처리” 최적화가 부족

pg_webhook_events는 (provider,event_id) 유니크로 중복은 막습니다. 

plic-db-schema


다만 운영 시엔 “이 웹훅이 어느 payment_slice/deal인지”를 빠르게 찾아야 합니다.

권장

payload에서 뽑아 쓰는 핵심 키(예: pg_payment_key, deal_id, payment_slice_id)를 컬럼으로 승격 + 인덱스

event_id가 “paymentKey+status 조합”인데 

plic-db-schema

, 가능하면 PG의 “event 고유 ID”가 있으면 그걸 우선 사용 (없으면 payload hash도 대안)

6) Split 결제 스케줄러 책임을 명확히

payment_slices에 scheduled_date와 인덱스가 있어 “스케줄 기반 청구”는 가능하지만 

plic-db-schema


로드맵에 “누가/어떻게 due slice를 집어 올려 결제를 트리거하는지”가 더 명확하면 좋습니다. (EventBridge 주기 실행이든, SQS Delay든)

P2 (런칭 후)로 내려도 되는 것 / 단, 조건부

테이블 파티셔닝(deals/payments 월 단위)은 트래픽/데이터량이 확인된 뒤가 맞습니다.

VPC Endpoint로 NAT 비용 절감도 런칭 안정화 후가 타당합니다.

다만 ledger_entries는 현재 스키마에 이미 들어가 있고 

plic-db-schema

, 운영/정산/분쟁 대응에서 가치가 커서 P1~P0에 더 가깝다고 봅니다.

문서 관리 측면 P0 (혼선 제거)

업로드된 자료에 동일 파일명으로 서로 다른 버전의 스키마/로드맵이 같이 잡힙니다.

스키마는 v2.0(최신)과, 예전 구조(예: payments.amount 단일 필드 등)가 함께 존재합니다. 

plic-db-schema

 

plic-db-schema

로드맵도 v2.0 문서와 v1.5 문서가 함께 보입니다. 

plic-db-schema

 

plic-db-schema

→ 개발/QA/외주/감사 대응에서 “어느 게 기준이냐”가 바로 사고로 이어집니다. 최종본 1개만 남기고 나머지는 archive 폴더로 이동(또는 파일명에 v1/v2 명시) 권장합니다.

결론

P0 반영 방향/내용은 대부분 ‘맞다’: 멱등성 + 잡큐 + 감사/원장 + Split 정의가 핵심 리스크를 제대로 찌르고 있습니다. 

plic-db-schema

 

plic-db-schema

다만 런칭 전 반드시 고쳐야 하는 건 4개:

수수료 차감 문구 정정 

plic-infra-roadmap

카드 토큰화 설명/예시 충돌 제거 

plic-infra-roadmap

 

plic-infra-roadmap

SQS vs DB큐 역할 분리(단일 진실 정의) 

plic-infra-roadmap

 

plic-db-schema

transfer_jobs “deal당 1개” 강제(유니크/업서트) 

plic-db-schema