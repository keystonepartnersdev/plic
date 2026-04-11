# PLIC 프로젝트 인수인계 문서

## 1. 계정 정보

### GitHub
- 저장소: https://github.com/itgyu/plic
- 사용자명: itgyu
- Personal Access Token: [보안상 제거됨 - 별도 전달]

### Vercel (프론트엔드 배포)
- 프로젝트명: plic
- 프로덕션 URL: https://plic.kr
- 대시보드: https://vercel.com/ian-5173s-projects/plic

### AWS (백엔드)
- 리전: ap-northeast-2 (서울)
- Access Key: [보안상 제거됨 - 별도 전달]

#### Cognito (인증)
- User Pool ID: ap-northeast-2_zEYkk3i56
- Client ID: 41i4ud2ehrctcgehuvctd5g7oa

#### API Gateway
- Base URL: https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod/

#### DynamoDB 테이블
- plic-users
- plic-deals
- plic-discounts (수동 관리 - CloudFormation 외)
- plic-contents

---

## 2. 프로젝트 구조
```
~/Desktop/PLIC/
├── src/                          # 프론트엔드 (Next.js)
│   ├── app/                      # 페이지
│   │   ├── (customer)/           # 고객용
│   │   │   ├── auth/             # 로그인/회원가입
│   │   │   ├── deals/            # 거래
│   │   │   ├── mypage/           # 마이페이지
│   │   │   ├── guide/            # 이용안내
│   │   │   └── terms/            # 약관
│   │   └── admin/                # 관리자
│   ├── components/               # 공통 컴포넌트
│   ├── stores/                   # Zustand 상태관리
│   ├── lib/                      # 유틸리티
│   │   └── api.ts                # API 클라이언트
│   ├── classes/                  # 헬퍼 클래스
│   └── types/                    # TypeScript 타입
│
├── backend/                      # 백엔드 (AWS Lambda)
│   └── plic/
│       ├── functions/            # Lambda 함수 코드
│       └── template.yaml         # CloudFormation 템플릿
│
└── HANDOVER.md                   # 이 문서
```

---

## 3. 기술 스택

### 프론트엔드
- Next.js 16.1.1, React 19, TypeScript
- Tailwind CSS, Zustand

### 백엔드
- AWS Lambda (Node.js 20)
- API Gateway, DynamoDB, Cognito
- AWS SAM (배포)

---

## 4. 로컬 개발 환경

### 프론트엔드
```bash
cd ~/Desktop/PLIC
npm install
npm run dev
# http://localhost:3000
```

### AWS CLI 설정
```bash
aws configure
# Access Key ID: [별도 전달]
# Secret Access Key: [별도 전달]
# Region: ap-northeast-2
# Output: json
```

---

## 5. 배포 방법

### 프론트엔드 (Vercel)
```bash
npm run build
vercel --prod
```

### 백엔드 (AWS SAM)
```bash
cd backend/plic
sam build --parallel
sam deploy --no-confirm-changeset
```

---

## 6. API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /auth/signup | 회원가입 |
| POST | /auth/verify | 이메일 인증 |
| POST | /auth/login | 로그인 |
| POST | /auth/refresh | 토큰 갱신 |
| GET | /users/me | 내 정보 |
| PUT | /users/me | 내 정보 수정 |
| GET | /users/me/grade | 등급 정보 |
| GET | /deals | 거래 목록 |
| POST | /deals | 거래 생성 |
| GET | /deals/{did} | 거래 상세 |
| GET | /content/banners | 배너 |
| GET | /content/notices | 공지사항 |
| GET | /content/faqs | FAQ |

---

## 7. 테스트 계정

### 관리자
- URL: https://plic.kr/admin
- 이메일: [별도 전달]
- 비밀번호: [별도 전달]

### 일반 사용자
- 직접 회원가입 (비밀번호: 8자 이상, 대문자/소문자/숫자 포함)

---

## 8. 주의사항

1. **plic-discounts 테이블**: CloudFormation 관리 X, AWS 콘솔에서 직접 수정
2. **환경변수**:
   - 프론트: src/lib/api.ts의 API_BASE_URL
   - 백엔드: template.yaml의 Environment
3. **보안**: 민감한 정보(API 키, 토큰 등)는 절대 코드에 하드코딩하지 말 것
