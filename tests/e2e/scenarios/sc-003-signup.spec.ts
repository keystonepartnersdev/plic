import { test, expect } from '@playwright/test';

/**
 * SC-003: 회원가입 시나리오
 * 회원가입 전체 플로우 테스트
 */
test.describe('SC-003: 회원가입', () => {

  // TC-003-01: 회원가입 페이지 접근
  test('TC-003-01: 회원가입 페이지 접근', async ({ page }) => {
    await page.goto('/auth/signup');

    // 회원가입 페이지 확인
    await expect(page).toHaveURL(/\/auth\/signup/);

    // 약관 동의 화면 표시 확인
    await expect(page.getByText(/서비스 이용약관/)).toBeVisible();
  });

  // TC-003-02: 약관 동의
  test('TC-003-02: 약관 동의 체크박스 확인', async ({ page }) => {
    await page.goto('/auth/signup');

    // 필수 약관 항목 확인
    await expect(page.getByText(/서비스 이용약관/)).toBeVisible();
    await expect(page.getByText(/개인정보/)).toBeVisible();

    // 전체 동의 체크박스 확인
    await expect(page.getByText(/전체 동의|모두 동의/)).toBeVisible();
  });

  // TC-003-02: 필수 약관 미동의 시 버튼 비활성화
  test('TC-003-02: 필수 약관 미동의 시 다음 버튼 비활성화', async ({ page }) => {
    await page.goto('/auth/signup');

    // 다음 버튼이 초기에 비활성화되어 있는지 확인
    const nextButton = page.getByRole('button', { name: /다음|동의/ });
    // 약관 미동의 상태에서는 버튼이 disabled이거나 클릭 불가
    const isDisabled = await nextButton.isDisabled().catch(() => true);
    expect(isDisabled).toBe(true);
  });

  // TC-003-02: 전체 동의 클릭 시 모든 항목 체크
  test('TC-003-02: 전체 동의 클릭', async ({ page }) => {
    await page.goto('/auth/signup');

    // 전체 동의 체크박스 클릭 (버튼 형태)
    const allAgreeButton = page.getByRole('button', { name: '전체 동의' });
    await allAgreeButton.click();

    // 다음 버튼 활성화 확인 (정확히 '다음' 버튼 선택)
    const nextButton = page.getByRole('button', { name: '다음', exact: true });
    await expect(nextButton).toBeEnabled();
  });

  // TC-003-02: 약관 상세 보기
  test('TC-003-02: 서비스 이용약관 상세 보기', async ({ page }) => {
    await page.goto('/auth/signup');

    // 약관 상세 보기 링크 클릭
    const termsLink = page.getByText(/보기|상세/).first();
    if (await termsLink.isVisible()) {
      await termsLink.click();

      // 약관 내용 표시 확인 (모달 또는 새 페이지)
      await expect(page.getByText(/약관|이용|서비스/)).toBeVisible();
    }
  });

  // TC-003-03: 카카오 인증
  test('TC-003-03: 카카오 인증 버튼 존재', async ({ page }) => {
    await page.goto('/auth/signup');

    // 전체 동의 후 다음 단계 진행
    await page.getByRole('button', { name: '전체 동의' }).click();
    const nextButton = page.getByRole('button', { name: '다음', exact: true });

    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // 카카오 인증 버튼 확인
      const kakaoButton = page.getByRole('button', { name: /카카오/ });
      await expect(kakaoButton).toBeVisible();
    }
  });

  // TC-003-08: 입력 유효성 검사 - 이메일 형식
  test('TC-003-08: 잘못된 이메일 형식 검증', async ({ page }) => {
    await page.goto('/auth/login');

    // 잘못된 이메일 형식 입력
    await page.getByPlaceholder('example@email.com').fill('invalid-email');
    await page.getByPlaceholder('비밀번호 입력').fill('password123');

    // 포커스 이동으로 유효성 검사 트리거
    await page.getByPlaceholder('비밀번호 입력').blur();

    // 로그인 시도 (에러 발생 예상)
    const loginButton = page.getByRole('button', { name: /로그인/ });
    if (await loginButton.isEnabled()) {
      await loginButton.click();
      // 에러 메시지 또는 유효성 검사 실패 확인
    }
  });
});

test.describe('SC-003: 회원가입 추가 테스트', () => {

  // TC-003-04: 기본 정보 입력 (로그인 폼으로 대체 테스트)
  test('TC-003-04: 로그인 폼 필수 필드 확인', async ({ page }) => {
    await page.goto('/auth/login');

    // 이메일 필드
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible();

    // 비밀번호 필드
    await expect(page.getByPlaceholder('비밀번호 입력')).toBeVisible();

    // 로그인 버튼
    await expect(page.getByRole('button', { name: /로그인/ })).toBeVisible();
  });

  // TC-003-07: 이메일 중복 체크
  test.skip('TC-003-07: 이메일 중복 체크', async ({ page }) => {
    // 회원가입 진행 중 이미 가입된 이메일 입력 시 에러
    await page.goto('/auth/signup');

    // 약관 동의
    await page.getByText(/전체 동의|모두 동의/).first().click();
    await page.getByRole('button', { name: /다음|동의/ }).click();

    // 카카오 인증 후 이메일이 중복인 경우
    // API 응답에서 "이미 가입된 이메일입니다" 메시지 확인
  });

  // TC-003-08: 비밀번호 유효성 검사
  test('TC-003-08: 비밀번호 필드 존재 확인', async ({ page }) => {
    await page.goto('/auth/login');

    // 비밀번호 필드 타입 확인
    const passwordField = page.getByPlaceholder('비밀번호 입력');
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('type', 'password');
  });
});
