# PLIC 배포 체크리스트

> Production 배포 전 확인 사항
> 최종 업데이트: 2026-02-04

---

## 1. 코드 품질 체크

| 항목 | 상태 | 비고 |
|------|------|------|
| TypeScript strict 모드 | ✅ 완료 | `strict: true` |
| any 타입 | ✅ 완료 | 3개 (의도적 유지) |
| ESLint 경고 | ✅ 완료 | 0개 |
| useEffect 의존성 | ✅ 완료 | 경고 0개 |

---

## 2. 보안 체크

| 항목 | 상태 | 비고 |
|------|------|------|
| JWT httpOnly 쿠키 | ✅ 완료 | localStorage 사용 안 함 |
| 하드코딩 비밀번호 | ✅ 완료 | 모두 제거 |
| 환경변수 분리 | ✅ 완료 | .env.local 사용 |
| 민감 정보 로깅 | ✅ 완료 | console.log 정리 |
| CORS 설정 | ✅ 완료 | credentials: include |

---

## 3. 테스트 체크

| 항목 | 상태 | 비고 |
|------|------|------|
| E2E 테스트 | ✅ 완료 | 90/90 통과 |
| 인증 테스트 | ✅ 완료 | 모든 보호 페이지 확인 |
| 회원가입 플로우 | ✅ 완료 | SC-003 통과 |
| 결제 플로우 | ✅ 완료 | SC-002 통과 |
| 어드민 기능 | ✅ 완료 | SC-004, SC-005 통과 |

---

## 4. 환경 설정 확인

### Production 환경변수 (.env.production)

```bash
# 필수 환경변수
NEXT_PUBLIC_API_BASE_URL=https://api.plic.kr
NEXT_PUBLIC_S3_BUCKET=plic-uploads-prod
NEXT_PUBLIC_KAKAO_CLIENT_ID=<production-kakao-id>

# 서버 환경변수 (Lambda)
JWT_SECRET=<production-secret>
DATABASE_URL=<production-db>
```

### Vercel 설정

- [ ] 환경변수 설정 완료
- [ ] 도메인 연결 (plic.kr)
- [ ] SSL 인증서 확인

### AWS 설정

- [ ] Lambda 함수 배포 완료
- [ ] API Gateway 설정 확인
- [ ] S3 버킷 권한 확인
- [ ] CloudFront 설정 (선택)

---

## 5. 배포 전 최종 확인

```bash
# 1. 빌드 테스트
npm run build

# 2. E2E 테스트
npm run test:e2e

# 3. 타입 체크
npx tsc --noEmit

# 4. 린트 체크
npm run lint
```

---

## 6. 배포 명령어

### Vercel 배포

```bash
# Preview 배포
vercel

# Production 배포
vercel --prod
```

### AWS Lambda 배포

```bash
cd backend/plic
sam build
sam deploy --stack-name plic-prod --parameter-overrides Environment=prod
```

---

## 7. 배포 후 확인

| 항목 | 체크 |
|------|------|
| 홈페이지 로드 | ⬜ |
| 로그인 기능 | ⬜ |
| 회원가입 기능 | ⬜ |
| 거래 생성 | ⬜ |
| 결제 기능 | ⬜ |
| 어드민 로그인 | ⬜ |
| API 응답 확인 | ⬜ |
| 에러 로그 확인 | ⬜ |

---

## 8. 롤백 계획

```bash
# Vercel 롤백
vercel rollback <deployment-url>

# AWS Lambda 롤백
aws lambda update-function-code \
  --function-name plic-kakao-login \
  --s3-bucket plic-deployments \
  --s3-key previous-version.zip
```

---

## 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2026-02-04 | 최초 작성 | Claude |

---

**마지막 업데이트**: 2026-02-04
