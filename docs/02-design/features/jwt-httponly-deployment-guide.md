# JWT httpOnly 쿠키 - Lambda 배포 가이드

> **작성일**: 2026-02-04
> **상태**: 배포 대기
> **대상 함수**: kakao-login, signup

---

## 1. 배포 전 체크리스트

### 변경된 파일 확인
```bash
# 변경된 Lambda 함수 확인
git diff --name-only HEAD~1

# 예상 출력:
# backend/plic/functions/auth/kakao-login.ts
# backend/plic/functions/auth/signup.ts
# backend/plic/functions/shared/cors.ts (신규)
```

### 의존성 확인
- 새로운 npm 패키지 설치 불필요
- 기존 aws-sdk, aws-lambda 타입 사용

---

## 2. 로컬 빌드

### 2.1 TypeScript 컴파일
```bash
cd /Users/taegyulee/Desktop/PLIC/backend/plic

# 함수별 빌드 (esbuild 사용 시)
npx esbuild functions/auth/kakao-login.ts --bundle --platform=node --target=node18 --outfile=KakaoLoginFunction/index.js

npx esbuild functions/auth/signup.ts --bundle --platform=node --target=node18 --outfile=SignupFunction/index.js
```

### 2.2 또는 SAM 빌드
```bash
cd /Users/taegyulee/Desktop/PLIC/backend/plic

# SAM 빌드
sam build

# 빌드 확인
ls -la .aws-sam/build/
```

---

## 3. 배포 방법

### 3.1 SAM CLI 배포 (권장)
```bash
cd /Users/taegyulee/Desktop/PLIC/backend/plic

# 배포 (프로필: plic)
sam deploy --profile plic

# 또는 변경 확인 없이 배포
sam deploy --profile plic --no-confirm-changeset
```

### 3.2 특정 함수만 업데이트 (AWS CLI)
```bash
# kakao-login 함수만 업데이트
cd /Users/taegyulee/Desktop/PLIC/backend/plic

# 1. 빌드
npx esbuild functions/auth/kakao-login.ts --bundle --platform=node --target=node18 --outfile=dist/kakao-login.js

# 2. ZIP 생성
cd dist && zip -r kakao-login.zip kakao-login.js && cd ..

# 3. Lambda 업데이트
aws lambda update-function-code \
  --function-name plic-KakaoLoginFunction \
  --zip-file fileb://dist/kakao-login.zip \
  --profile plic \
  --region ap-northeast-2
```

### 3.3 AWS 콘솔에서 수동 업로드
1. AWS Lambda 콘솔 접속
2. 함수 선택: `plic-KakaoLoginFunction`
3. "코드" 탭 > "에서 업로드" > ".zip 파일"
4. 빌드된 ZIP 파일 업로드

---

## 4. API Gateway CORS 설정

### 4.1 콘솔에서 확인
1. AWS API Gateway 콘솔 접속
2. PLIC API 선택
3. "CORS" 설정 확인
4. 다음 항목 추가/수정:
   - Access-Control-Allow-Credentials: true
   - Access-Control-Allow-Origin: https://plic.kr (NOT *)

### 4.2 template.yaml에서 설정 (SAM)
```yaml
# template.yaml
Globals:
  Api:
    Cors:
      AllowOrigin: "'https://plic.kr'"
      AllowHeaders: "'Content-Type,Authorization,Cookie'"
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowCredentials: true  # 추가!
```

---

## 5. 배포 후 검증

### 5.1 Lambda 함수 테스트
```bash
# AWS CLI로 직접 호출
aws lambda invoke \
  --function-name plic-KakaoLoginFunction \
  --payload '{"httpMethod":"OPTIONS","headers":{"origin":"https://plic.kr"}}' \
  --profile plic \
  response.json

cat response.json
```

### 5.2 cURL로 API 테스트
```bash
# OPTIONS 요청 (CORS preflight)
curl -X OPTIONS \
  -H "Origin: https://plic.kr" \
  -H "Access-Control-Request-Method: POST" \
  -v \
  https://api.plic.kr/auth/kakao-login

# 예상 응답 헤더:
# Access-Control-Allow-Origin: https://plic.kr
# Access-Control-Allow-Credentials: true
```

### 5.3 브라우저 테스트
```javascript
// 개발자 도구 > Console
fetch('https://api.plic.kr/auth/kakao-login', {
  method: 'POST',
  credentials: 'include',  // 쿠키 포함
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    kakaoId: 12345
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 6. 롤백 절차

문제 발생 시 이전 버전으로 롤백:

### 6.1 Lambda 콘솔에서 롤백
1. Lambda 콘솔 > 함수 선택
2. "버전" 탭
3. 이전 버전 선택 > "별칭을 이 버전으로 지정"

### 6.2 Git에서 이전 버전 복원
```bash
# 이전 커밋으로 복원
git checkout HEAD~1 -- backend/plic/functions/auth/kakao-login.ts

# 다시 빌드 및 배포
sam build && sam deploy --profile plic
```

---

## 7. 모니터링

### 7.1 CloudWatch 로그 확인
```bash
# 최근 로그 확인
aws logs tail /aws/lambda/plic-KakaoLoginFunction \
  --profile plic \
  --follow
```

### 7.2 확인 포인트
- [ ] CORS 헤더 정상 반환
- [ ] Set-Cookie 헤더 포함
- [ ] HttpOnly 플래그 설정
- [ ] 토큰 값 정상

---

## 8. 문제 해결

### 문제: CORS 오류
```
Access to fetch at 'https://api.plic.kr/auth/kakao-login'
from origin 'https://plic.kr' has been blocked by CORS policy
```

**해결**:
- API Gateway CORS 설정 확인
- AllowCredentials: true 설정
- AllowOrigin에 '*' 대신 구체적 도메인 지정

### 문제: 쿠키가 설정되지 않음
**해결**:
- 응답의 `Set-Cookie` 헤더 확인
- `SameSite=None; Secure` 필요 (cross-origin의 경우)
- 프론트엔드에서 `credentials: 'include'` 확인

### 문제: Lambda 타임아웃
**해결**:
- Lambda 타임아웃 설정 확인 (기본 3초)
- Cognito API 호출 지연 고려

---

## 9. 배포 일정

| 단계 | 예상 시간 | 담당 |
|------|----------|------|
| 로컬 빌드 | 5분 | 개발자 |
| SAM 배포 | 5분 | 개발자 |
| API Gateway 설정 | 10분 | 개발자 |
| 통합 테스트 | 30분 | QA |
| 모니터링 | 지속 | DevOps |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-04 | 최초 작성 |
