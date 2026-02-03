import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { extractInviteToken, isWithin48Hours } from '@/lib/utils';
import type { Participation, Event, User } from '@/types/database';
import { getCurrentUserId, hasValidSubscription } from '@/lib/auth';

interface ResolveRequest {
  input: string;
}

export async function POST(request: NextRequest) {
  try {
    const { input }: ResolveRequest = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: '招待コードを入力してください' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();
    const userId = await getCurrentUserId();

    // Extract token from input (could be URL, short code, or full token)
    const extracted = extractInviteToken(input);

    let participation: (Participation & { events: Event; users: { display_name: string } }) | null = null;

    if (extracted) {
      // Try as short_code first (6 characters)
      if (extracted.length === 6) {
        const { data: byShortCode } = await supabase
          .from('participations')
          .select('*, events(*), users!participations_user_id_fkey(display_name)')
          .ilike('short_code', extracted)
          .single();

        if (byShortCode) {
          participation = byShortCode as Participation & { events: Event; users: { display_name: string } };
        }
      }

      // If not found, try as invite_token
      if (!participation) {
        const { data: byToken } = await supabase
          .from('participations')
          .select('*, events(*), users!participations_user_id_fkey(display_name)')
          .eq('invite_token', extracted)
          .single();

        if (byToken) {
          participation = byToken as Participation & { events: Event; users: { display_name: string } };
        }
      }
    }

    if (!participation) {
      return NextResponse.json(
        { error: '招待コードが見つかりません。コードを確認してください。' },
        { status: 404 }
      );
    }

    // Get current group member count
    const { count: groupMemberCount } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', participation.group_id)
      .eq('event_id', participation.event_id)
      .neq('status', 'canceled');

    const currentGroupSize = groupMemberCount || 1;
    const maxGroupSize = 3;

    // Check if group is full
    if (currentGroupSize >= maxGroupSize) {
      return NextResponse.json(
        { error: 'この招待リンクは既に使用されています（グループ上限: 3人）' },
        { status: 400 }
      );
    }

    // Check if event is still open
    if (participation.events.status !== 'open') {
      return NextResponse.json(
        { error: 'このイベントは終了しました' },
        { status: 400 }
      );
    }

    // Check if within 48 hours
    if (isWithin48Hours(participation.events.event_date)) {
      return NextResponse.json(
        { error: '開催2日前を過ぎたため、このイベントへの招待参加はできません' },
        { status: 400 }
      );
    }

    // Check if logged in user can join
    if (userId) {
      // Check if this is the inviter themselves
      if (userId === participation.user_id) {
        return NextResponse.json(
          { error: '自分自身を招待することはできません' },
          { status: 400 }
        );
      }

      // Check if user already entered this event
      const { data: existingParticipation } = await supabase
        .from('participations')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', participation.event_id)
        .neq('status', 'canceled')
        .single();

      if (existingParticipation) {
        return NextResponse.json(
          { error: 'このイベントには既にエントリーしています' },
          { status: 400 }
        );
      }

      // Check subscription
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status, subscription_period_end, has_used_invite_coupon')
        .eq('id', userId)
        .single();

      const user = userData as Pick<User, 'subscription_status' | 'subscription_period_end' | 'has_used_invite_coupon'> | null;
      if (user && !hasValidSubscription(user)) {
        // User needs to subscribe - still return invite info but flag it
        // The client will handle the redirect to subscription page
      }
    }

    // Determine if user is eligible for invite coupon
    let isEligibleForCoupon = true;
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('has_used_invite_coupon')
        .eq('id', userId)
        .single();
      isEligibleForCoupon = !(userData as { has_used_invite_coupon: boolean } | null)?.has_used_invite_coupon;
    }

    const inviterName = participation.users?.display_name || '友達';

    return NextResponse.json({
      token: participation.invite_token,
      inviterName,
      eventDate: participation.events.event_date,
      area: participation.events.area,
      groupMemberCount: currentGroupSize,
      maxGroupSize,
      isEligibleForCoupon,
    });
  } catch (err) {
    console.error('Resolve invite error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
