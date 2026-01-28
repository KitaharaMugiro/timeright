# E2Eテスト環境のセットアップ

このガイドでは、E2Eテストを実行するためのテストデータベース環境を設定する方法を説明します。

## 📋 概要

テストを実行するには、以下の3つのアプローチがあります：

1. **ローカルSupabase（推奨）** - Docker経由でローカルSupabase環境を起動
2. **専用テストプロジェクト** - Supabase上に専用のテストプロジェクトを作成
3. **モックデータ** - APIコールをモックして実行（認証のみ）

## 🚀 方法1: ローカルSupabase（推奨）

### ステップ1: Supabase CLIの初期化

```bash
# Supabase プロジェクトを初期化
npx supabase init

# ローカルSupabaseを起動（Dockerが必要）
npx supabase start
```

初回起動時、以下の情報が表示されます：

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: your-super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### ステップ2: 環境変数の設定

`.env.test.local` ファイルを作成：

```bash
# Supabaseローカル環境
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # 上記で表示されたservice_role key

# Stripe（テストモード）
STRIPE_SECRET_KEY=sk_test_... # Stripeのテストシークレットキー
STRIPE_WEBHOOK_SECRET=whsec_test_... # ローカルwebhook用のシークレット
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Stripeのテスト公開可能キー
```

### ステップ3: マイグレーションの適用

```bash
# データベースをリセットしてマイグレーションを適用
npx supabase db reset
```

### ステップ4: テストデータのシード

```bash
# シードスクリプトを実行
npm run db:seed:test
```

または手動でSQLを実行：

```bash
# Supabase Studio（http://localhost:54323）で実行
# または CLIで実行
npx supabase db execute --file supabase/seed.test.sql
```

### ステップ5: Playwrightの環境設定

`.env.test.local` が自動的にテスト実行時に読み込まれます。

### ステップ6: テストの実行

```bash
# 全てのE2Eテストを実行
npm run test:e2e

# サブスクリプションテストのみ実行
npx playwright test tests/e2e/subscription-cancellation.spec.ts

# UIモードで実行
npm run test:e2e:ui
```

---

## 🌐 方法2: 専用テストプロジェクト

### ステップ1: Supabaseでテストプロジェクトを作成

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. 新しいプロジェクト「timeright-test」を作成
3. プロジェクトのURL、anon key、service_role keyをコピー

### ステップ2: 環境変数の設定

`.env.test` ファイルを作成：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key

# Stripe テストモード
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### ステップ3: マイグレーションとシード

```bash
# テストプロジェクトに接続
npx supabase link --project-ref your-test-project-ref

# マイグレーションを適用
npx supabase db push

# シードデータを実行
npm run db:seed:test
```

---

## 🧪 方法3: モックデータ（API Mocking）

認証が不要な簡易テスト向け。

### ステップ1: Playwrightのモックを使用

`tests/e2e/fixtures/mock-api.ts` を参照：

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // APIレスポンスをモック
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: mockUser }),
      });
    });

    await use(page);
  },
});
```

この方法は完全な統合テストにはならないため、推奨されません。

---

## 📝 テストデータのシーディング

### シードSQLファイルの作成

`supabase/seed.test.sql` を作成：

```sql
-- テストユーザーの作成
INSERT INTO users (id, email, display_name, gender, birth_date, job, personality_type, subscription_status, subscription_period_end, is_admin)
VALUES
  -- アクティブなサブスクリプションユーザー
  ('11111111-1111-1111-1111-111111111111', 'active@test.com', 'Active User', 'male', '1990-01-01', 'Engineer', 'Leader', 'active', NOW() + INTERVAL '30 days', false),

  -- 解約済みだが期限内のユーザー
  ('22222222-2222-2222-2222-222222222222', 'canceled-valid@test.com', 'Canceled Valid User', 'female', '1992-05-15', 'Designer', 'Supporter', 'canceled', NOW() + INTERVAL '7 days', false),

  -- 解約済みで期限切れのユーザー
  ('33333333-3333-3333-3333-333333333333', 'canceled-expired@test.com', 'Canceled Expired User', 'male', '1988-12-20', 'Manager', 'Analyst', 'canceled', NOW() - INTERVAL '1 day', false),

  -- サブスクリプションなしのユーザー
  ('44444444-4444-4444-4444-444444444444', 'none@test.com', 'No Subscription User', 'female', '1995-03-10', 'Student', 'Entertainer', 'none', NULL, false),

  -- 支払い遅延ユーザー
  ('55555555-5555-5555-5555-555555555555', 'pastdue@test.com', 'Past Due User', 'male', '1993-07-22', 'Consultant', 'Leader', 'past_due', NOW() + INTERVAL '5 days', false),

  -- 管理者ユーザー
  ('99999999-9999-9999-9999-999999999999', 'admin@test.com', 'Admin User', 'male', '1985-01-01', 'Admin', 'Leader', 'active', NOW() + INTERVAL '365 days', true)
ON CONFLICT (id) DO NOTHING;

-- テストイベントの作成
INSERT INTO events (id, event_date, area, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() + INTERVAL '7 days', '渋谷', 'open'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() + INTERVAL '14 days', '新宿', 'open'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '7 days', '池袋', 'closed')
ON CONFLICT (id) DO NOTHING;
```

### package.jsonにスクリプトを追加

```json
{
  "scripts": {
    "db:seed:test": "npx supabase db execute --file supabase/seed.test.sql"
  }
}
```

---

## 🔧 Playwrightグローバルセットアップ

テスト実行前に自動的にシードを実行するには、`playwright.config.ts` で設定：

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  // ... その他の設定
});
```

`tests/e2e/global-setup.ts` を作成：

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup() {
  console.log('🌱 Seeding test database...');

  try {
    await execAsync('npm run db:seed:test');
    console.log('✅ Test database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed test database:', error);
    throw error;
  }
}

export default globalSetup;
```

---

## 🎯 テストの実行コマンド

```bash
# 全てのE2Eテストを実行
npm run test:e2e

# 特定のテストファイルを実行
npx playwright test tests/e2e/subscription-cancellation.spec.ts

# UIモードで実行（デバッグに便利）
npm run test:e2e:ui

# ヘッドレスモードで実行
npm run test:e2e:headed

# デバッグモード
npm run test:e2e:debug

# レポートを表示
npm run test:e2e:report
```

---

## ⚠️ 注意事項

### セキュリティ

- **本番環境のデータベースでテストを実行しないでください**
- `.env.test.local` は `.gitignore` に追加されていることを確認
- テスト用のStripeキーはテストモード（`sk_test_`）を使用

### データのクリーンアップ

```bash
# ローカルSupabaseをリセット
npx supabase db reset

# テストプロジェクトをリセット（注意：全データが削除されます）
npx supabase db reset --linked
```

### CI/CD環境

GitHub ActionsなどのCI環境では、ローカルSupabaseをDockerで起動：

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start Supabase
        run: npx supabase start

      - name: Seed test database
        run: npm run db:seed:test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🐛 トラブルシューティング

### Supabaseが起動しない

```bash
# Dockerが起動していることを確認
docker ps

# Supabaseを停止して再起動
npx supabase stop
npx supabase start
```

### マイグレーションエラー

```bash
# マイグレーションをリセット
npx supabase db reset

# 手動でマイグレーションを適用
npx supabase migration up
```

### 認証エラー

- `.env.test.local` のキーが正しいか確認
- Supabase Studioでユーザーが作成されているか確認
- Cookieが正しく設定されているか確認

---

## 📚 関連ドキュメント

- [Supabase CLI ドキュメント](https://supabase.com/docs/guides/cli)
- [Playwright ドキュメント](https://playwright.dev/)
- [E2Eテストガイド](./e2e-guide.md)
