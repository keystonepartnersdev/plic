# PLIC 프로젝트 인수인계 문서

## 1. 계정 정보

### GitHub
- 저장소: https://github.com/itgyu/plic.git
- 사용자명: itgyu
- Personal Access Token: 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
- 클론 명령어:
```bash
git clone https://itgyu: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@github.com/itgyu/plic.git
```

### Vercel
- 프로젝트명: plic
- 팀/조직: ian-5173s-projects
- 프로덕션 URL: https://plic-pay.vercel.app
- 대시보드: https://vercel.com/ian-5173s-projects/plic

### AWS
- 리전: ap-northeast-2 (서울)
- 콘솔: https://ap-northeast-2.console.aws.amazon.com

#### Cognito
- User Pool ID: ap-northeast-2_zEYkk3i56
- Client ID: 41i4ud2ehrctcgehuvctd5g7oa

#### API Gateway
- Base URL: https://szxmlb6qla.execute-api.ap-northeast-2.amazonaws.com/Prod/

#### DynamoDB 테이블
- plic-users
- plic-deals
- plic-discounts (수동 관리)
- plic-contents

---

## 2. 프로젝트 구조

### 프론트엔드 (Next.js 16)
```
~/Desktop/PLIC/
├── src/
│   ├── app/                    # 페이지
│   │   ├── (customer)/         # 고객용 페이지
│   │   │   ├── auth/           # 로그인/회원가입
│   │   │   ├── deals/          # 거래 목록/생성/상세
│   │   │   ├── mypage/         # 마이페이지
│   │   │   ├── guide/          # 이용안내
│   │   │   ├── notices/        # 공지사항
│   │   │   ├── terms/          # 약관
│   │   │   └── page.tsx        # 홈
│   │   └── admin/              # 관리자 페이지
│   ├── components/             # 공통 컴포넌트
│   ├── stores/                 # Zustand 상태관리
│   ├── lib/                    # 유틸리티
│   │   └── api.ts              # API 클라이언트
│   ├── classes/                # 헬퍼 클래스
│   └── types/                  # TypeScript 타입
├── package.json
└── next.config.ts
```

### 백엔드 (AWS SAM)
```
~/Desktop/PLIC/backend/plic/
├── src/
│   ├── functions/              # Lambda 함수
│   │   ├── auth/               # 인증 (signup, login, verify 등)
│   │   ├── users/              # 사용자 관리
│   │   ├── deals/              # 거래 관리
│   │   ├── discounts/          # 할인/쿠폰
│   │   └── content/            # 콘텐츠 (공지, FAQ, 배너)
│   ├── lib/                    # 공통 라이브러리
│   └── types/                  # 타입 정의
├── template.yaml               # SAM 템플릿
└── samconfig.toml              # SAM 설정
```

---

## 3. 기술 스택

### 프론트엔드
- Next.js 16.1.1
- React 19
- TypeScript
- Tailwind CSS
- Zustand (상태관리)

### 백엔드
- AWS Lambda (Node.js 20)
- API Gateway
- DynamoDB
- Cognito (인증)
- AWS SAM (배포)

---

## 4. API 엔드포인트

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /auth/signup | 회원가입 |
| POST | /auth/verify | 이메일 인증 |
| POST | /auth/login | 로그인 |
| POST | /auth/refresh | 토큰 갱신 |
| POST | /auth/logout | 로그아웃 |

### 사용자
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /users/me | 내 정보 조회 |
| PUT | /users/me | 내 정보 수정 |
| GET | /users/me/grade | 등급 정보 조회 |
| DELETE | /users/me | 회원 탈퇴 |

### 거래
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /deals | 거래 목록 |
| POST | /deals | 거래 생성 |
| GET | /deals/{did} | 거래 상세 |
| PUT | /deals/{did} | 거래 수정 |
| DELETE | /deals/{did} | 거래 취소 |

### 콘텐츠
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /content/banners | 배너 목록 |
| GET | /content/notices | 공지사항 목록 |
| GET | /content/faqs | FAQ 목록 |

---

## 5. 테스트 계정

### 관리자
- URL: https://plic-pay.vercel.app/admin
- 이메일: admin@plic.kr
- 비밀번호: admin1234

### 일반 사용자
- 직접 회원가입 후 테스트
- 비밀번호 요구사항: 8자 이상, 대문자, 소문자, 숫자 포함

---

## 6. 로컬 개발 환경 설정

### 프론트엔드
```bash
cd ~/Desktop/PLIC
npm install
npm run dev
# http://localhost:3000
```

### 백엔드
```bash
cd ~/Desktop/PLIC/backend/plic
npm install
sam build
sam deploy
```

---

## 7. 배포 방법

### 프론트엔드 (Vercel)
```bash
cd ~/Desktop/PLIC
npm run build
git add -A && git commit -m "배포" && git push
npx vercel --prod
```

### 백엔드 (AWS SAM)
```bash
cd ~/Desktop/PLIC/backend/plic
sam build --parallel
sam deploy --no-confirm-changeset
```

---

## 8. 미구현 기능 (외부 API 필요)

| 기능 | 필요 API | 비고 |
|------|----------|------|
| 카카오 로그인 | Kakao OAuth | 사업자 등록 필요 |
| 네이버 로그인 | Naver OAuth | 사업자 등록 필요 |
| 실제 결제 | 토스페이먼츠/NHN KCP | 계약 필요 |
| 실제 송금 | 오픈뱅킹 | 금융결제원 계약 |
| 계좌 실명확인 | 금융결제원/핀테크 | 건당 비용 발생 |
| 휴대폰 본인인증 | PASS/KMC | 계약 필요 |

---

## 9. 주의사항

1. **DynamoDB plic-discounts 테이블**
   - CloudFormation 관리 X, 수동 관리
   - 스키마 변경 시 직접 AWS 콘솔에서 수정

2. **GitHub Personal Access Token**
   - 만료 시 새로 발급 필요
   - Settings > Developer settings > Personal access tokens

3. **CORS 설정**
   - template.yaml의 Globals.Api.Cors에 설정됨
   - AllowOrigin: * (프로덕션에서는 도메인 제한 권장)

4. **환경변수**
   - 프론트엔드: src/lib/api.ts의 API_BASE_URL
   - 백엔드: template.yaml의 Globals.Function.Environment

