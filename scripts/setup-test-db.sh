#!/bin/bash

# E2Eテストデータベースの自動セットアップスクリプト
# このスクリプトは以下を実行します：
# 1. Supabaseの初期化
# 2. ローカルSupabaseの起動
# 3. 環境変数ファイルの作成
# 4. テストデータのシード

set -e  # エラーが発生したら即座に終了

echo ""
echo "🚀 E2Eテストデータベース セットアップスクリプト"
echo "================================================"
echo ""

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Dockerが起動しているかチェック
echo "🔍 Dockerの状態を確認中..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Dockerが起動していません${NC}"
    echo "   Docker Desktopを起動してから再実行してください"
    exit 1
fi
echo -e "${GREEN}✅ Docker起動確認完了${NC}"
echo ""

# Supabaseディレクトリの確認と初期化
if [ ! -d "supabase" ]; then
    echo "📦 Supabaseプロジェクトを初期化中..."
    npx supabase init
    echo -e "${GREEN}✅ Supabase初期化完了${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Supabaseプロジェクトは既に初期化されています${NC}"
    echo ""
fi

# ローカルSupabaseが既に起動しているかチェック
echo "🔍 ローカルSupabaseの状態を確認中..."
if npx supabase status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ローカルSupabaseは既に起動しています${NC}"
    echo ""
    read -p "既存のSupabaseを停止して再起動しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 ローカルSupabaseを停止中..."
        npx supabase stop
        echo -e "${GREEN}✅ 停止完了${NC}"
        echo ""

        echo "🚀 ローカルSupabaseを起動中（これには数分かかる場合があります）..."
        npx supabase start
        echo -e "${GREEN}✅ Supabase起動完了${NC}"
        echo ""
    fi
else
    echo "🚀 ローカルSupabaseを起動中（これには数分かかる場合があります）..."
    npx supabase start
    echo -e "${GREEN}✅ Supabase起動完了${NC}"
    echo ""
fi

# Supabaseの状態を取得
echo "📊 Supabase接続情報を取得中..."
STATUS_OUTPUT=$(npx supabase status)
echo ""

# 環境変数を抽出（新しいフォーマットに対応）
API_URL=$(echo "$STATUS_OUTPUT" | grep -E "Project URL|API URL:" | awk '{print $NF}' | head -1)
# 新しいフォーマットではPublishableとSecretキーが使われている
PUBLISHABLE_KEY=$(echo "$STATUS_OUTPUT" | grep "Publishable" | awk '{print $NF}')
SECRET_KEY=$(echo "$STATUS_OUTPUT" | grep "Secret" | awk '{print $NF}')

# 古いフォーマットとの互換性
if [ -z "$PUBLISHABLE_KEY" ]; then
    PUBLISHABLE_KEY=$(echo "$STATUS_OUTPUT" | grep "anon key:" | awk '{print $3}')
fi
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(echo "$STATUS_OUTPUT" | grep "service_role key:" | awk '{print $3}')
fi

# 変数名を統一
ANON_KEY="$PUBLISHABLE_KEY"
SERVICE_ROLE_KEY="$SECRET_KEY"

if [ -z "$API_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Supabase情報の取得に失敗しました${NC}"
    echo "   手動で npx supabase status を実行して確認してください"
    exit 1
fi

echo -e "${GREEN}✅ 接続情報取得完了${NC}"
echo "   API URL: $API_URL"
echo ""

# .env.test.local ファイルの作成
echo "📝 環境変数ファイルを作成中..."
ENV_FILE=".env.test.local"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE は既に存在します${NC}"
    echo ""
    read -p "上書きしますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "既存のファイルを保持します"
    else
        cat > "$ENV_FILE" << EOF
# E2Eテスト環境用の環境変数
# 自動生成: $(date)

# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=$API_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

# Stripe Configuration (Test Mode)
# TODO: Stripe Dashboardから取得して設定してください
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Application Configuration
BASE_URL=http://localhost:3000
NODE_ENV=test
EOF
        echo -e "${GREEN}✅ $ENV_FILE を作成しました${NC}"
    fi
else
    cat > "$ENV_FILE" << EOF
# E2Eテスト環境用の環境変数
# 自動生成: $(date)

# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=$API_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

# Stripe Configuration (Test Mode)
# TODO: Stripe Dashboardから取得して設定してください
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Application Configuration
BASE_URL=http://localhost:3000
NODE_ENV=test
EOF
    echo -e "${GREEN}✅ $ENV_FILE を作成しました${NC}"
fi
echo ""

# マイグレーションの適用を確認
echo "🔍 マイグレーション状態を確認中..."
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')

if [ "$MIGRATION_COUNT" -gt 1 ]; then
    echo "📦 ${MIGRATION_COUNT}個のマイグレーションが見つかりました"
    echo ""
    read -p "データベースをリセットして全マイグレーションを適用しますか？ (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "🔄 データベースをリセット中..."
        npx supabase db reset
        echo -e "${GREEN}✅ データベースリセット完了${NC}"
        echo ""
    fi
fi

# テストデータのシード
echo "🌱 テストデータをシード中..."
if [ -f "supabase/seed.test.sql" ]; then
    npm run db:seed:test
    echo -e "${GREEN}✅ テストデータのシード完了${NC}"
else
    echo -e "${RED}❌ supabase/seed.test.sql が見つかりません${NC}"
fi
echo ""

# Playwrightのインストール確認
echo "🎭 Playwrightの状態を確認中..."
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}⚠️  Playwrightブラウザがインストールされていません${NC}"
    echo ""
    read -p "Playwrightブラウザをインストールしますか？ (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "📥 Playwrightブラウザをインストール中（これには数分かかります）..."
        npx playwright install --with-deps
        echo -e "${GREEN}✅ Playwrightインストール完了${NC}"
    else
        echo -e "${YELLOW}⚠️  後で 'npx playwright install --with-deps' を実行してください${NC}"
    fi
else
    echo -e "${GREEN}✅ Playwrightは既にインストールされています${NC}"
fi
echo ""

# セットアップ完了
echo ""
echo "================================================"
echo -e "${GREEN}✨ セットアップ完了！${NC}"
echo "================================================"
echo ""
echo "📋 次のステップ："
echo ""
echo "1. Stripe設定（オプション）"
echo "   .env.test.local を編集してStripeのテストキーを設定"
echo ""
echo "2. テストを実行"
echo "   npm run test:e2e           # 全テストを実行"
echo "   npm run test:e2e:ui        # UIモードで実行（推奨）"
echo "   npm run test:e2e:headed    # ブラウザを表示して実行"
echo ""
echo "3. Supabase Studioでデータを確認"
echo "   http://localhost:54323"
echo ""
echo "4. テストデータを再シード"
echo "   npm run db:seed:test"
echo ""
echo "5. Supabaseを停止"
echo "   npm run supabase:stop"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}"
echo ""
