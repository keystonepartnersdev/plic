This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. 환경 변수 설정

프로젝트를 실행하기 전에 환경 변수를 설정해야 합니다.

```bash
# .env.example을 복사하여 .env.local 생성
cp .env.example .env.local

# .env.local 파일을 열어 실제 값으로 수정
# 필수 환경 변수:
# - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# - DEALS_TABLE
# - API_BASE_URL
# - ADMIN_SECRET_KEY (32자 이상)
# - NEXT_PUBLIC_API_URL
```

**⚠️ 중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

### 2. 개발 서버 실행

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🔐 보안 강화 (Phase 1 완료)

### 적용된 보안 개선사항

1. **환경 변수 관리**
   - 모든 민감한 정보를 환경 변수로 외부화
   - `validateEnv.ts`로 필수 환경 변수 검증

2. **관리자 인증 강화**
   - 하드코딩된 비밀번호 제거 완료
   - 서버 측 API 인증으로 변경 (`/api/admin/auth/login`)
   - HMAC-SHA256 해시 사용

3. **결제 API 인증**
   - JWT 토큰 기반 인증 미들웨어 구현
   - `requireAuth()` 미들웨어로 결제 API 보호
   - Authorization 헤더 필수

### 관리자 로그인

```bash
# 기본 관리자 계정
ID: admin
PW: admin1234

# 또는
ID: admin@plic.kr
PW: admin123
```

**⚠️ 프로덕션 배포 전**: `.env.local`의 `ADMIN_SECRET_KEY`를 강력한 랜덤 키로 변경하세요!

```bash
# 안전한 랜덤 키 생성
openssl rand -base64 32
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
