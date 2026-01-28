# E2Eテスト クイックスタートガイド

このガイドでは、5分でE2Eテスト環境をセットアップして実行する方法を説明します。

## 📦 必要なもの

- Node.js 18以上
- Docker Desktop（ローカルSupabase用）
- npm または yarn

## 🚀 5分でセットアップ

### ステップ1: 依存関係のインストール

```bash
npm install
```

### ステップ2: ローカルSupabaseの起動

```bash
# Supabaseプロジェクトを初期化（初回のみ）
npx supabase init

# ローカルSupabaseを起動（Dockerが必要）
npm run supabase:start
```

起動すると、以下のような情報が表示されます：

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### ステップ3: 環境変数の設定

```bash
# テンプレートをコピー
cp .env.test.local.example .env.test.local
```

`.env.test.local` を編集して、ステップ2で表示された値を設定：

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...     # 上記で表示されたservice_role key
```

### ステップ4: データベースのセットアップ

```bash
# マイグレーションを適用してテストデータをシード
npm run db:reset:test
```

成功すると以下のメッセージが表示されます：

```
✅ Test seed data inserted successfully!
📊 Users: 9, Events: 5, Participations: 4, Matches: 1, Reviews: 2
🔐 Test user credentials:
   - active@test.com (Active subscription)
   - canceled-valid@test.com (Canceled but valid until X days)
   ...
```

### ステップ5: Playwrightのインストール

```bash
# Playwrightブラウザをインストール（初回のみ）
npx playwright install --with-deps
```

### ステップ6: テストの実行

```bash
# 全てのE2Eテストを実行
npm run test:e2e

# または、UIモードで実行（推奨）
npm run test:e2e:ui
```

## ✅ 完了！

テストが実行されます。初回は全てのブラウザがダウンロードされるため、時間がかかる場合があります。

---

## 📝 テストユーザー

シードデータには以下のテストユーザーが含まれています：

| Email | サブスク状態 | 説明 |
|-------|------------|------|
| `active@test.com` | active | 有効なサブスクリプション（あと30日） |
| `canceled-valid@test.com` | canceled | 解約済みだが期限内（あと7日） |
| `canceled-expired@test.com` | canceled | 解約済みで期限切れ（昨日） |
| `none@test.com` | none | サブスクリプションなし |
| `pastdue@test.com` | past_due | 支払い遅延 |
| `admin@test.com` | active | 管理者ユーザー |

全ユーザーのパスワードはありません（テスト環境では認証をモックします）。

---

## 🎯 よく使うコマンド

```bash
# Supabaseの起動
npm run supabase:start

# Supabaseの停止
npm run supabase:stop

# Supabaseのステータス確認
npm run supabase:status

# テストデータの再シード
npm run db:seed:test

# データベースをリセットして再シード
npm run db:reset:test

# E2Eテストの実行
npm run test:e2e

# UIモードで実行（デバッグに便利）
npm run test:e2e:ui

# ヘッドレスモードで実行
npm run test:e2e:headed

# 特定のテストのみ実行
npx playwright test tests/e2e/subscription-cancellation.spec.ts

# テストレポートを表示
npm run test:e2e:report
```

---

## 🌐 Supabase Studioの使用

ローカルSupabaseが起動している間、以下のURLでデータベースを確認できます：

```
http://localhost:54323
```

ここで以下が可能です：
- テーブルデータの確認・編集
- SQLクエリの実行
- ログの確認
- APIドキュメントの閲覧

---

## 🐛 トラブルシューティング

### Dockerが起動していない

```bash
# Dockerが起動しているか確認
docker ps

# Dockerを起動してから再試行
npm run supabase:start
```

### ポート54321が使用中

```bash
# 既存のSupabaseを停止
npm run supabase:stop

# または、別のポートを使用（config.tomlを編集）
```

### マイグレーションエラー

```bash
# データベースをクリーンにリセット
npm run db:reset:test
```

### 環境変数が読み込まれない

```bash
# .env.test.local が正しい場所にあるか確認
ls -la .env.test.local

# Playwrightのグローバルセットアップが実行されているか確認
npm run test:e2e -- --reporter=list
```

---

## 📚 詳細ドキュメント

より詳しい情報は以下をご覧ください：

- [E2Eテスト環境セットアップ詳細](./e2e-setup.md)
- [Supabase CLI ドキュメント](https://supabase.com/docs/guides/cli)
- [Playwright ドキュメント](https://playwright.dev/)

---

## 💡 ヒント

### 開発中のワークフロー

1. コード変更
2. `npm run db:reset:test` でデータをリセット（必要に応じて）
3. `npm run test:e2e:ui` でUIモードでテスト
4. テストが通ったらコミット

### CI/CD環境

GitHub Actionsなどでは、以下のように設定します：

```yaml
- name: Start Supabase
  run: npx supabase start

- name: Seed database
  run: npm run db:seed:test

- name: Run E2E tests
  run: npm run test:e2e
```

詳細は [e2e-setup.md](./e2e-setup.md#cicd環境) を参照。

---

## 🎉 次のステップ

- テストケースを追加する
- Page Object Modelパターンを学ぶ
- カスタムフィクスチャを作成する
- CI/CDパイプラインに統合する

Happy Testing! 🚀
