# PLIC API 에러 코드 문서

> **버전**: 1.0
> **작성일**: 2026-02-05

---

## 에러 응답 형식

모든 API 에러 응답은 다음 형식을 따릅니다:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "로그인이 필요합니다.",
    "details": {},
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

---

## 에러 코드 목록

### 인증 관련 (AUTH_xxx)

| 코드 | HTTP | 설명 | 대응 |
|------|------|------|------|
| `AUTH_001` | 401 | 로그인이 필요합니다 | 로그인 페이지로 이동 |
| `AUTH_002` | 401 | 인증이 만료되었습니다 | 토큰 갱신 또는 재로그인 |
| `AUTH_003` | 401 | 유효하지 않은 인증 토큰 | 재로그인 |
| `AUTH_004` | 401 | 토큰 갱신 실패 | 재로그인 |

### 입력 검증 (INPUT_xxx)

| 코드 | HTTP | 설명 | 대응 |
|------|------|------|------|
| `INPUT_001` | 400 | 잘못된 입력 | details.errors 참조 |
| `INPUT_002` | 400 | 필수 항목 누락 | details.field 참조 |
| `INPUT_003` | 400 | 잘못된 형식 | 형식 확인 |

### 리소스 (RESOURCE_xxx)

| 코드 | HTTP | 설명 | 대응 |
|------|------|------|------|
| `RESOURCE_001` | 404 | 리소스 없음 | ID 확인 |
| `RESOURCE_002` | 409 | 이미 존재함 | 중복 확인 |
| `RESOURCE_003` | 403 | 접근 권한 없음 | 권한 확인 |

### 결제 (PAYMENT_xxx)

| 코드 | HTTP | 설명 | 대응 |
|------|------|------|------|
| `PAYMENT_001` | 400 | 결제 실패 | details 참조 |
| `PAYMENT_002` | 400 | 결제 취소됨 | - |
| `PAYMENT_003` | 400 | 잘못된 금액 | 금액 확인 |
| `PAYMENT_004` | 400 | 한도 초과 | 한도 확인 |

### 외부 API (EXTERNAL_xxx)

| 코드 | HTTP | 설명 | 대응 |
|------|------|------|------|
| `EXTERNAL_001` | 502 | Popbill 연동 오류 | 재시도 |
| `EXTERNAL_002` | 502 | PG 연동 오류 | 재시도 |
| `EXTERNAL_003` | 502 | 카카오 연동 오류 | 재시도 |
| `EXTERNAL_004` | 504 | 응답 시간 초과 | 재시도 |

### 서버 (SERVER_xxx)

| 코드 | HTTP | 설명 | 대응 |
|------|------|------|------|
| `SERVER_001` | 500 | 서버 오류 | 잠시 후 재시도 |
| `SERVER_002` | 503 | 점검 중 | 나중에 다시 |
| `SERVER_003` | 429 | 요청 과다 | 잠시 대기 |

---

## 프론트엔드 에러 처리 예시

```typescript
import { ErrorCodes } from '@/lib/api-error';

async function handleApiCall() {
  try {
    const response = await fetch('/api/...');
    const data = await response.json();

    if (!data.success) {
      switch (data.error.code) {
        case ErrorCodes.AUTH_REQUIRED:
        case ErrorCodes.AUTH_EXPIRED:
          router.push('/auth/login');
          break;
        case ErrorCodes.INPUT_INVALID:
          showValidationErrors(data.error.details.errors);
          break;
        case ErrorCodes.PAYMENT_LIMIT_EXCEEDED:
          showLimitExceededModal();
          break;
        default:
          showErrorToast(data.error.message);
      }
    }
  } catch (error) {
    showErrorToast('네트워크 오류가 발생했습니다.');
  }
}
```

---

## 관련 파일

- 에러 클래스: `src/lib/api-error.ts`
- 검증 스키마: `src/lib/validations/index.ts`
