import { Page } from '@playwright/test';
import { TestUsers, TestAdmins } from './test-data';

/**
 * 테스트용 사용자 로그인 (localStorage 주입 방식)
 * 실제 API 호출 없이 인증 상태를 시뮬레이션
 */
export async function loginAsUser(
  page: Page,
  user = TestUsers.normal,
) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate((userData) => {
    const userState = {
      state: {
        currentUser: {
          uid: userData.uid,
          name: userData.name,
          phone: userData.phone || '010-1234-5678',
          email: userData.email,
          grade: userData.grade || 'basic',
          status: userData.status || 'active',
          socialProvider: 'kakao',
          socialId: 'test-kakao-id',
          isVerified: true,
          businessInfo: null,
          feeRate: userData.feeRate || 5.5,
          monthlyLimit: userData.monthlyLimit || 20000000,
          monthlyUsed: 0,
          usedAmount: 0,
          totalPaymentAmount: 0,
          totalDealCount: 5,
          points: 1000,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-02-04T00:00:00.000Z',
        },
        isLoggedIn: true,
        users: [],
        registeredCards: [],
      },
      version: 3,
    };
    localStorage.setItem('plic-user-storage', JSON.stringify(userState));
  }, user);

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/**
 * 테스트용 관리자 로그인
 */
export async function loginAsAdmin(
  page: Page,
  admin = TestAdmins.superAdmin,
) {
  await page.goto('/admin/login');
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate((adminData) => {
    const adminState = {
      state: {
        currentAdmin: {
          aid: adminData.aid,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        isLoggedIn: true,
        admins: [],
      },
      version: 1,
    };
    localStorage.setItem('plic-admin-storage', JSON.stringify(adminState));
  }, admin);

  await page.reload();
  await page.waitForTimeout(1500);
}

/**
 * 로그아웃 (localStorage 클리어)
 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('plic-user-storage');
    localStorage.removeItem('plic-admin-storage');
  });
  await page.reload();
}
