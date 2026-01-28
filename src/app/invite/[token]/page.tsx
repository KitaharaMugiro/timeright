import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { isWithin48Hours } from '@/lib/utils';
import { InviteClient } from './client';
import type { Participation, Event, User } from '@/types/database';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  const supabase = await createServiceClient();

  // Get participation by invite token
  const { data: participationData } = await supabase
    .from('participations')
    .select('*, events(*), users!participations_user_id_fkey(display_name)')
    .eq('invite_token', token)
    .single();

  const participation = participationData as (Participation & { events: Event; users: { display_name: string } }) | null;
  if (!participation) {
    notFound();
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
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">グループが満員です</h1>
          <p className="text-slate-400">
            この招待リンクは既に使用されています（グループ上限: 3人）
          </p>
        </div>
      </div>
    );
  }

  // Check if event is still open
  if (participation.events.status !== 'open') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">このイベントは終了しました</h1>
          <p className="text-slate-400">
            招待リンクの有効期限が切れています。
          </p>
        </div>
      </div>
    );
  }

  // Check if within 48 hours
  if (isWithin48Hours(participation.events.event_date)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">招待の受付が終了しました</h1>
          <p className="text-slate-400">
            開催2日前を過ぎたため、このイベントへの招待参加はできません。
          </p>
        </div>
      </div>
    );
  }

  // If user is logged in, check if they can join
  if (userId) {
    // Check if this is the inviter themselves
    if (userId === participation.user_id) {
      redirect('/dashboard');
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
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">既にエントリー済みです</h1>
            <p className="text-slate-400">
              このイベントには既にエントリーしています。
            </p>
          </div>
        </div>
      );
    }

    // Check subscription
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, has_used_invite_coupon')
      .eq('id', userId)
      .single();

    const user = userData as Pick<User, 'subscription_status' | 'has_used_invite_coupon'> | null;
    if (user?.subscription_status !== 'active') {
      redirect('/onboarding/subscribe');
    }
  }

  // Determine if user is eligible for invite coupon
  // - Not logged in users are potentially eligible (will be checked at checkout)
  // - Logged in users who haven't used the coupon yet are eligible
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

  return (
    <InviteClient
      token={token}
      participation={participation}
      inviterName={inviterName}
      isLoggedIn={!!userId}
      isEligibleForCoupon={isEligibleForCoupon}
      groupMemberCount={currentGroupSize}
      maxGroupSize={maxGroupSize}
    />
  );
}
