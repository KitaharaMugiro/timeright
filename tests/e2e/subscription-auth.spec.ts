import { test, expect } from '@playwright/test';
import { login, logout } from './auth-setup';

/**
 * サブスクリプション認証付きE2Eテスト
 *
 * このファイルは認証機能を使った実際のテストの例です
 */

test.describe('Dashboard Access with Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にログアウト
    await logout(page);
  });

  test('Active subscription user can access dashboard', async ({ page }) => {
    // アクティブユーザーでログイン
    const user = await login.asActive(page);
    expect(user).toBeTruthy();
    expect(user.subscription_status).toBe('active');

    // ダッシュボードにアクセス
    await page.goto('/dashboard');

    // リダイレクトされずにダッシュボードが表示されることを確認
    await expect(page).toHaveURL('/dashboard');
    // ダッシュボードにはユーザー名が表示される
    await expect(page.locator('h1')).toContainText('こんにちは');
  });

  test('Canceled user with valid period can access dashboard', async ({ page }) => {
    // 解約済みだが期限内のユーザーでログイン
    const user = await login.asCanceledValid(page);
    expect(user).toBeTruthy();
    expect(user.subscription_status).toBe('canceled');
    expect(user.subscription_period_end).toBeTruthy();

    // ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 期限内なのでアクセス可能
    await expect(page).toHaveURL('/dashboard');
    // ダッシュボードにはユーザー名が表示される
    await expect(page.locator('h1')).toContainText('こんにちは');
  });

  test('Canceled user with expired period is redirected', async ({ page }) => {
    // 解約済みで期限切れのユーザーでログイン
    const user = await login.asCanceledExpired(page);
    expect(user).toBeTruthy();
    expect(user.subscription_status).toBe('canceled');

    // ダッシュボードにアクセス
    await page.goto('/dashboard');

    // サブスク登録ページにリダイレクト
    await expect(page).toHaveURL('/onboarding/subscribe');
  });

  test('User with no subscription is redirected', async ({ page }) => {
    // サブスクなしユーザーでログイン
    const user = await login.asNone(page);
    expect(user).toBeTruthy();
    expect(user.subscription_status).toBe('none');

    // ダッシュボードにアクセス
    await page.goto('/dashboard');

    // サブスク登録ページにリダイレクト
    await expect(page).toHaveURL('/onboarding/subscribe');
  });
});

test.describe('Subscription Settings Page', () => {
  test('Active user sees correct status and manage button', async ({ page }) => {
    // アクティブユーザーでログイン
    await login.asActive(page);

    // サブスクリプション設定ページにアクセス
    await page.goto('/settings/subscription');

    // ステータスバッジを確認
    const statusBadge = page.locator('[class*="bg-green"]').filter({ hasText: '有効' });
    await expect(statusBadge).toBeVisible();

    // 管理ボタンを確認
    const manageButton = page.getByRole('button', { name: /支払い方法・解約の管理/ });
    await expect(manageButton).toBeVisible();
  });

  test('Canceled user sees end date and re-subscribe button', async ({ page }) => {
    // 解約済みユーザーでログイン
    const user = await login.asCanceledValid(page);

    // サブスクリプション設定ページにアクセス
    await page.goto('/settings/subscription');

    // 解約済みステータス
    const statusBadge = page.locator('[class*="bg-neutral"]').filter({ hasText: '解約済み' });
    await expect(statusBadge).toBeVisible();

    // 期限日が表示されていることを確認
    const periodEndDate = new Date(user.subscription_period_end);
    const dateStr = periodEndDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    await expect(page.locator('text=' + dateStr)).toBeVisible();

    // 再登録ボタンを確認
    const resubscribeButton = page.getByRole('button', { name: '再登録する' });
    await expect(resubscribeButton).toBeVisible();
  });

  test('Past due user sees payment warning', async ({ page }) => {
    // 支払い遅延ユーザーでログイン
    await login.asPastDue(page);

    // サブスクリプション設定ページにアクセス
    await page.goto('/settings/subscription');

    // 支払い遅延ステータス
    const statusBadge = page.locator('[class*="bg-amber"]').filter({ hasText: '支払い遅延' });
    await expect(statusBadge).toBeVisible();

    // 警告メッセージ
    await expect(page.locator('text=/お支払いに問題が発生/')).toBeVisible();

    // 支払い方法更新ボタン
    const updateButton = page.getByRole('button', { name: /支払い方法を更新/ });
    await expect(updateButton).toBeVisible();
  });
});

test.describe('Full User Journey', () => {
  test('User navigates from dashboard to subscription settings', async ({ page }) => {
    // アクティブユーザーでログイン
    await login.asActive(page);

    // ダッシュボードにアクセス
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // 設定ページへ移動（リンクがある場合）
    // 注: 実際のUIに合わせて調整が必要
    await page.goto('/settings');

    // サブスクリプション設定へ移動
    await page.goto('/settings/subscription');
    await expect(page).toHaveURL('/settings/subscription');

    // ステータスが表示されている
    await expect(page.locator('text=現在のプラン')).toBeVisible();
  });
});
