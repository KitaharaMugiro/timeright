import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

interface ActivityItem {
  id: string;
  type: string;
  date: string;
  detail: string;
  meta?: Record<string, unknown>;
}

// Action types that are already covered by legacy queries with rich joined data
const LEGACY_ACTION_TYPES = ['signup', 'event_join', 'event_cancel', 'review_submit'];

function getActivityDetail(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case 'login': return 'ログイン';
    case 'attendance_late': return `遅刻連絡 (${metadata.late_minutes}分)`;
    case 'attendance_cancel': return '当日キャンセル';
    case 'subscription_start': return 'サブスクリプション開始';
    case 'subscription_cancel': return 'サブスクリプション解約';
    case 'payment_failed': return '支払い失敗';
    case 'account_delete': return 'アカウント削除';
    case 'profile_update': return 'プロフィール更新';
    case 'avatar_upload': return 'アバター変更';
    case 'onboarding_complete': return 'オンボーディング完了';
    case 'invite_accept': return '招待を承諾';
    case 'verification_submit': return '本人確認書類を提出';
    case 'admin_match_create': return 'マッチング確定 (管理者)';
    case 'admin_event_cancel': return 'イベントキャンセル (管理者)';
    case 'admin_verification_approve': return '本人確認承認 (管理者)';
    case 'admin_verification_reject': return '本人確認却下 (管理者)';
    case 'admin_message_send': return 'メッセージ送信 (管理者)';
    default: return action;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const supabase = await createServiceClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, gender, birth_date, job, subscription_status, subscription_period_end, member_stage, stage_points, is_identity_verified, line_user_id, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activities: ActivityItem[] = [];

    // === NEW: Fetch from user_activity_logs (for new action types) ===
    const { data: logEntries } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .not('action', 'in', `(${LEGACY_ACTION_TYPES.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(200);

    logEntries?.forEach(entry => {
      const metadata = (entry.metadata || {}) as Record<string, unknown>;
      activities.push({
        id: `log-${entry.id}`,
        type: entry.action,
        date: entry.created_at,
        detail: getActivityDetail(entry.action, metadata),
        meta: metadata,
      });
    });

    // === LEGACY: Reconstruct from existing tables (rich joined data) ===

    // 1. Signup
    activities.push({
      id: `signup-${user.id}`,
      type: 'signup',
      date: user.created_at,
      detail: '新規登録',
    });

    // 2. Participations (with event info)
    const { data: participations } = await supabase
      .from('participations')
      .select('id, status, entry_type, mood, cancel_reason, created_at, attendance_status, event_id, events:event_id(event_date, area, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    participations?.forEach(p => {
      const event = p.events as unknown as { event_date: string; area: string; status: string } | null;
      const eventInfo = event ? `${event.area}` : '';

      if (p.status === 'canceled') {
        activities.push({
          id: `cancel-${p.id}`,
          type: 'cancel',
          date: p.created_at,
          detail: `イベントをキャンセル${eventInfo ? ` (${eventInfo})` : ''}`,
          meta: {
            event_id: p.event_id,
            event_date: event?.event_date,
            area: event?.area,
            cancel_reason: p.cancel_reason,
            entry_type: p.entry_type,
          },
        });
      } else {
        activities.push({
          id: `participation-${p.id}`,
          type: 'participation',
          date: p.created_at,
          detail: `イベントに${p.entry_type === 'pair' ? 'ペア' : 'ソロ'}参加${eventInfo ? ` (${eventInfo})` : ''}`,
          meta: {
            event_id: p.event_id,
            event_date: event?.event_date,
            area: event?.area,
            status: p.status,
            mood: p.mood,
            entry_type: p.entry_type,
            attendance_status: p.attendance_status,
          },
        });
      }
    });

    // 3. Reviews sent (as reviewer)
    const { data: reviewsSent } = await supabase
      .from('reviews')
      .select('id, rating, comment, block_flag, is_no_show, created_at, target_user_id, matches:match_id(event_id, events:event_id(event_date, area)), target:target_user_id(display_name)')
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });

    reviewsSent?.forEach(r => {
      const target = r.target as unknown as { display_name: string } | null;
      const match = r.matches as unknown as { event_id: string; events: { event_date: string; area: string } } | null;
      const targetName = target?.display_name || '不明';
      const flags: string[] = [];
      if (r.block_flag) flags.push('ブロック');
      if (r.is_no_show) flags.push('No Show');

      activities.push({
        id: `review-sent-${r.id}`,
        type: 'review_sent',
        date: r.created_at,
        detail: `${targetName}にレビュー投稿 (${r.rating}点)${flags.length ? ` [${flags.join(', ')}]` : ''}`,
        meta: {
          rating: r.rating,
          comment: r.comment,
          block_flag: r.block_flag,
          is_no_show: r.is_no_show,
          target_name: targetName,
          event_date: match?.events?.event_date,
          area: match?.events?.area,
        },
      });
    });

    // 4. Reviews received (as target)
    const { data: reviewsReceived } = await supabase
      .from('reviews')
      .select('id, rating, comment, block_flag, is_no_show, created_at, reviewer_id, matches:match_id(event_id, events:event_id(event_date, area)), reviewer:reviewer_id(display_name)')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    reviewsReceived?.forEach(r => {
      const reviewer = r.reviewer as unknown as { display_name: string } | null;
      const reviewerName = reviewer?.display_name || '不明';
      const flags: string[] = [];
      if (r.block_flag) flags.push('ブロック');
      if (r.is_no_show) flags.push('No Show');

      activities.push({
        id: `review-received-${r.id}`,
        type: 'review_received',
        date: r.created_at,
        detail: `${reviewerName}からレビュー受領 (${r.rating}点)${flags.length ? ` [${flags.join(', ')}]` : ''}`,
        meta: {
          rating: r.rating,
          comment: r.comment,
          block_flag: r.block_flag,
          is_no_show: r.is_no_show,
          reviewer_name: reviewerName,
        },
      });
    });

    // Sort all activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ user, activities });
  } catch (error) {
    console.error('Error in user activity API:', error);
    if ((error as Error).message === 'Unauthorized' || (error as Error).message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
