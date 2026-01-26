import { Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * テストユーザーでログイン（API経由）
 *
 * @param page - Playwrightのページ
 * @param userId - ログインするユーザーのID
 */
export async function loginAsUser(page: Page, userId: string) {
  // テストログインAPIを呼び出し
  const response = await page.request.post(`${BASE_URL}/api/test/login`, {
    data: { userId },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return result.user;
}

/**
 * テストユーザー定義
 */
export const TEST_USERS = {
  ACTIVE: '11111111-1111-1111-1111-111111111111',
  CANCELED_VALID: '22222222-2222-2222-2222-222222222222',
  CANCELED_EXPIRED: '33333333-3333-3333-3333-333333333333',
  NONE: '44444444-4444-4444-4444-444444444444',
  PAST_DUE: '55555555-5555-5555-5555-555555555555',
  ADMIN: '99999999-9999-9999-9999-999999999999',
  INCOMPLETE: '66666666-6666-6666-6666-666666666666',
} as const;

/**
 * 各サブスクリプション状態でログイン
 */
export const login = {
  asActive: (page: Page) => loginAsUser(page, TEST_USERS.ACTIVE),
  asCanceledValid: (page: Page) => loginAsUser(page, TEST_USERS.CANCELED_VALID),
  asCanceledExpired: (page: Page) => loginAsUser(page, TEST_USERS.CANCELED_EXPIRED),
  asNone: (page: Page) => loginAsUser(page, TEST_USERS.NONE),
  asPastDue: (page: Page) => loginAsUser(page, TEST_USERS.PAST_DUE),
  asAdmin: (page: Page) => loginAsUser(page, TEST_USERS.ADMIN),
  asIncomplete: (page: Page) => loginAsUser(page, TEST_USERS.INCOMPLETE),
};

/**
 * ログアウト
 */
export async function logout(page: Page) {
  // テストログアウトAPIを呼び出し
  await page.request.delete(`${BASE_URL}/api/test/login`);
  // Cookieもクリア
  await page.context().clearCookies();
}
