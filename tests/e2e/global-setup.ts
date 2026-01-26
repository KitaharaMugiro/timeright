import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Playwrightグローバルセットアップ
 * テスト実行前に1度だけ実行されます
 */
async function globalSetup() {
  console.log('\n🚀 E2E Test Environment Setup\n');

  // 環境変数のチェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
    console.error('\n📝 Please set up your test environment:');
    console.error('   1. Copy .env.example to .env.test.local');
    console.error('   2. Start local Supabase: npm run supabase:start');
    console.error('   3. Run tests: npm run test:e2e\n');
    throw new Error('Missing required environment variables');
  }

  console.log('✅ Environment variables configured');
  console.log(`   Supabase URL: ${supabaseUrl}`);

  // ローカルSupabaseが起動しているかチェック
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.log('\n🔍 Checking local Supabase status...');

    try {
      const { stdout } = await execAsync('npx supabase status 2>&1');

      if (stdout.includes('RUNNING') || stdout.includes('API URL')) {
        console.log('✅ Local Supabase is running');
      } else {
        console.log('⚠️  Local Supabase might not be running');
        console.log('   Run: npm run supabase:start');
      }
    } catch (error) {
      console.log('⚠️  Could not check Supabase status');
      console.log('   Make sure Supabase is running: npm run supabase:start');
    }

    // テストデータをシード
    console.log('\n🌱 Seeding test database...');

    try {
      const { stdout, stderr } = await execAsync('npm run db:seed:test 2>&1');

      if (stderr && !stderr.includes('NOTICE')) {
        console.log('⚠️  Seed output:', stderr);
      }

      // NOTICEメッセージを抽出して表示
      const notices = stdout.match(/NOTICE:.*$/gm);
      if (notices) {
        notices.forEach(notice => {
          console.log('   ' + notice.replace('NOTICE:', '').trim());
        });
      }

      console.log('✅ Test database seeded successfully\n');
    } catch (error: any) {
      console.error('❌ Failed to seed test database');
      console.error('   Error:', error.message);

      // シードエラーは警告として扱う（既にデータがある場合もエラーになる可能性があるため）
      console.log('⚠️  Continuing with existing data...\n');
    }
  } else {
    console.log('\n📡 Using remote Supabase instance');
    console.log('⚠️  Make sure test data is already seeded on the remote database\n');
  }

  console.log('✨ Setup complete! Starting tests...\n');
}

export default globalSetup;
