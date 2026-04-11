# Plic — Claude Code 규칙

> 원본: ~/tedos/templates/CLAUDE-common.md
> 임의 수정 금지 — 변경은 Ted 승인 후 전 프로젝트 일괄 반영

## Git 워크플로

```
main       ← 프로덕션 배포 (Ted 승인 필수)
  ↑ PR
staging    ← 개발 통합 (Ted 승인 필수)
  ↑ PR
feature/*  ← 작업 브랜치
```

- main, staging에 직접 push 금지 — 반드시 PR
- PR 생성 시 커밋 컨벤션 준수: `type(scope): 설명`
  - feat, fix, chore, refactor, docs, test, style
- feature 브랜치는 머지 후 삭제
- force push 금지

## 배포 규칙

- 로컬에서 `sst deploy --stage production` 절대 금지
- 프로덕션 배포는 GitHub Actions → Ted 승인 → 자동 배포
- staging 배포도 Ted 승인 필수
- 배포 전 빌드 + 린트 통과 확인

## 코드 규칙

- TypeScript strict 권장
- 환경변수는 `.env` 파일 또는 SSM Parameter Store에서 관리
- `.env` 파일은 절대 Git에 커밋하지 않는다
- API Key, Secret 등 시크릿을 코드에 하드코딩하지 않는다
- `node_modules/`, `.next/`, `.sst/`, `.open-next/` 등 빌드 산출물 커밋 금지

## AWS 규칙

- 팀원(Developer)은 인프라 생성/삭제 불가
  - Lambda 함수, DynamoDB 테이블, S3 버킷, RDS 등 생성/삭제 금지
  - 코드 업데이트, 데이터 CRUD는 가능
- 인프라 변경이 필요하면 Ted에게 요청
- AWS 콘솔(웹) 직접 접근하지 않는다 — CLI/SDK만 사용

## 리뷰 규칙

- 모든 PR은 CODEOWNERS에 의해 Ted 리뷰가 자동 요청됨
- 리뷰 승인 없이 머지 불가
- 리뷰 요청 시 변경 내용 요약을 PR 설명에 작성
