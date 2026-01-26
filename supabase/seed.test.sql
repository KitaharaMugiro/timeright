-- テスト環境用のシードデータ
-- このファイルは開発・テスト環境でのみ使用してください

-- 既存のテストデータをクリア
TRUNCATE users, events, participations, matches, reviews CASCADE;

-- テストユーザーの作成
INSERT INTO users (
  id,
  email,
  display_name,
  avatar_url,
  gender,
  birth_date,
  job,
  personality_type,
  stripe_customer_id,
  subscription_status,
  subscription_period_end,
  line_user_id,
  is_admin,
  created_at
) VALUES
  -- 1. アクティブなサブスクリプションユーザー
  (
    '11111111-1111-1111-1111-111111111111',
    'active@test.com',
    'アクティブユーザー',
    'https://i.pravatar.cc/150?u=active',
    'male',
    '1990-01-01',
    'エンジニア',
    'Leader',
    'cus_test_active123',
    'active',
    NOW() + INTERVAL '30 days',
    'line_active_123',
    false,
    NOW() - INTERVAL '60 days'
  ),

  -- 2. 解約済みだが期限内のユーザー（あと7日）
  (
    '22222222-2222-2222-2222-222222222222',
    'canceled-valid@test.com',
    '解約済ユーザー（期限内）',
    'https://i.pravatar.cc/150?u=canceled-valid',
    'female',
    '1992-05-15',
    'デザイナー',
    'Supporter',
    'cus_test_canceled123',
    'canceled',
    NOW() + INTERVAL '7 days',
    'line_canceled_valid_456',
    false,
    NOW() - INTERVAL '90 days'
  ),

  -- 3. 解約済みで期限切れのユーザー（昨日期限切れ）
  (
    '33333333-3333-3333-3333-333333333333',
    'canceled-expired@test.com',
    '解約済ユーザー（期限切れ）',
    'https://i.pravatar.cc/150?u=canceled-expired',
    'male',
    '1988-12-20',
    'マネージャー',
    'Analyst',
    'cus_test_expired123',
    'canceled',
    NOW() - INTERVAL '1 day',
    'line_canceled_expired_789',
    false,
    NOW() - INTERVAL '120 days'
  ),

  -- 4. サブスクリプションなしのユーザー
  (
    '44444444-4444-4444-4444-444444444444',
    'none@test.com',
    'サブスクなしユーザー',
    'https://i.pravatar.cc/150?u=none',
    'female',
    '1995-03-10',
    '学生',
    'Entertainer',
    NULL,
    'none',
    NULL,
    'line_none_101',
    false,
    NOW() - INTERVAL '5 days'
  ),

  -- 5. 支払い遅延ユーザー
  (
    '55555555-5555-5555-5555-555555555555',
    'pastdue@test.com',
    '支払い遅延ユーザー',
    'https://i.pravatar.cc/150?u=pastdue',
    'male',
    '1993-07-22',
    'コンサルタント',
    'Leader',
    'cus_test_pastdue123',
    'past_due',
    NOW() + INTERVAL '5 days',
    'line_pastdue_202',
    false,
    NOW() - INTERVAL '45 days'
  ),

  -- 6. 管理者ユーザー（アクティブ）
  (
    '99999999-9999-9999-9999-999999999999',
    'admin@test.com',
    '管理者',
    'https://i.pravatar.cc/150?u=admin',
    'male',
    '1985-01-01',
    '管理者',
    'Leader',
    'cus_test_admin123',
    'active',
    NOW() + INTERVAL '365 days',
    'line_admin_999',
    true,
    NOW() - INTERVAL '365 days'
  ),

  -- 7. 性格診断未完了ユーザー（オンボーディング途中）
  (
    '66666666-6666-6666-6666-666666666666',
    'incomplete@test.com',
    '未完了ユーザー',
    NULL,
    'female',
    '1994-08-18',
    'マーケター',
    NULL, -- personality_type が NULL
    NULL,
    'none',
    NULL,
    'line_incomplete_303',
    false,
    NOW() - INTERVAL '1 day'
  ),

  -- 8. ペア参加用ユーザー1
  (
    '77777777-7777-7777-7777-777777777777',
    'pair1@test.com',
    'ペアユーザー1',
    'https://i.pravatar.cc/150?u=pair1',
    'male',
    '1991-06-12',
    '営業',
    'Entertainer',
    'cus_test_pair1',
    'active',
    NOW() + INTERVAL '20 days',
    'line_pair1_404',
    false,
    NOW() - INTERVAL '30 days'
  ),

  -- 9. ペア参加用ユーザー2
  (
    '88888888-8888-8888-8888-888888888888',
    'pair2@test.com',
    'ペアユーザー2',
    'https://i.pravatar.cc/150?u=pair2',
    'female',
    '1993-04-25',
    '人事',
    'Supporter',
    'cus_test_pair2',
    'active',
    NOW() + INTERVAL '20 days',
    'line_pair2_505',
    false,
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  subscription_status = EXCLUDED.subscription_status,
  subscription_period_end = EXCLUDED.subscription_period_end;

-- テストイベントの作成
INSERT INTO events (
  id,
  event_date,
  area,
  status,
  created_at
) VALUES
  -- 1. 今後の渋谷イベント（7日後）
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NOW() + INTERVAL '7 days',
    '渋谷',
    'open',
    NOW() - INTERVAL '3 days'
  ),

  -- 2. 今後の新宿イベント（14日後）
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    NOW() + INTERVAL '14 days',
    '新宿',
    'open',
    NOW() - INTERVAL '2 days'
  ),

  -- 3. 今後の池袋イベント（21日後）
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    NOW() + INTERVAL '21 days',
    '池袋',
    'open',
    NOW() - INTERVAL '1 day'
  ),

  -- 4. マッチング済みイベント（過去）
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    NOW() - INTERVAL '7 days',
    '六本木',
    'matched',
    NOW() - INTERVAL '14 days'
  ),

  -- 5. クローズ済みイベント（過去）
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NOW() - INTERVAL '14 days',
    '表参道',
    'closed',
    NOW() - INTERVAL '21 days'
  )
ON CONFLICT (id) DO UPDATE SET
  event_date = EXCLUDED.event_date,
  status = EXCLUDED.status;

-- テストパーティシペーション（参加登録）
INSERT INTO participations (
  id,
  user_id,
  event_id,
  group_id,
  entry_type,
  invite_token,
  status,
  created_at
) VALUES
  -- アクティブユーザーの単独参加（渋谷イベント）
  (
    '11111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111113',
    'solo',
    'invite_token_active_shibuya_001',
    'pending',
    NOW() - INTERVAL '2 days'
  ),

  -- ペア参加（新宿イベント）
  (
    '77777777-7777-7777-7777-777777777778',
    '77777777-7777-7777-7777-777777777777',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '77777777-7777-7777-7777-777777777779',
    'pair',
    'invite_token_pair1_shinjuku_001',
    'pending',
    NOW() - INTERVAL '1 day'
  ),
  (
    '88888888-8888-8888-8888-888888888889',
    '88888888-8888-8888-8888-888888888888',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '77777777-7777-7777-7777-777777777779', -- 同じgroup_id
    'pair',
    'invite_token_pair2_shinjuku_002',
    'pending',
    NOW() - INTERVAL '1 day'
  ),

  -- マッチング済み参加（過去イベント）
  (
    '99999999-9999-9999-9999-999999999998',
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '99999999-9999-9999-9999-999999999997',
    'solo',
    'invite_token_matched_roppongi_001',
    'matched',
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- テストマッチ
INSERT INTO matches (
  id,
  event_id,
  restaurant_name,
  restaurant_url,
  table_members,
  created_at
) VALUES
  -- 過去イベントのマッチ
  (
    '11111111-1111-1111-1111-111111111114',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'イタリアン・ビストロ 六本木',
    'https://example.com/restaurant/roppongi-italian',
    '["11111111-1111-1111-1111-111111111111", "77777777-7777-7777-7777-777777777777", "88888888-8888-8888-8888-888888888888", "22222222-2222-2222-2222-222222222222"]'::jsonb,
    NOW() - INTERVAL '7 days'
  )
ON CONFLICT (id) DO UPDATE SET
  restaurant_name = EXCLUDED.restaurant_name;

-- テストレビュー
INSERT INTO reviews (
  id,
  reviewer_id,
  target_user_id,
  match_id,
  rating,
  comment,
  block_flag,
  created_at
) VALUES
  -- アクティブユーザーがペアユーザー1をレビュー
  (
    '11111111-1111-1111-1111-111111111115',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111114',
    5,
    '楽しい会話ができました！',
    false,
    NOW() - INTERVAL '6 days'
  ),

  -- ペアユーザー1がアクティブユーザーをレビュー
  (
    '77777777-7777-7777-7777-777777777778',
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111114',
    4,
    '良い雰囲気でした',
    false,
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT (reviewer_id, target_user_id, match_id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment;

-- シード完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ Test seed data inserted successfully!';
  RAISE NOTICE '📊 Users: 9, Events: 5, Participations: 4, Matches: 1, Reviews: 2';
  RAISE NOTICE '🔐 Test user credentials:';
  RAISE NOTICE '   - active@test.com (Active subscription)';
  RAISE NOTICE '   - canceled-valid@test.com (Canceled but valid until % days)', (SELECT EXTRACT(DAY FROM subscription_period_end - NOW()) FROM users WHERE email = 'canceled-valid@test.com');
  RAISE NOTICE '   - canceled-expired@test.com (Expired)';
  RAISE NOTICE '   - none@test.com (No subscription)';
  RAISE NOTICE '   - pastdue@test.com (Past due)';
  RAISE NOTICE '   - admin@test.com (Admin)';
END $$;
