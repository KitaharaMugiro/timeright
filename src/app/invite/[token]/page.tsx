import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { isWithin48Hours, generateShortCode } from '@/lib/utils';
import { InviteClient } from './client';
import type { Participation, Event } from '@/types/database';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const supabase = await createServiceClient();

  // Get participation by invite token or short_code
  let participation: (Participation & { events: Event; users: { display_name: string } }) | null = null;

  // Try invite_token first
  const { data: byToken } = await supabase
    .from('participations')
    .select('*, events(*), users!participations_user_id_fkey(display_name)')
    .eq('invite_token', token)
    .single();

  if (byToken) {
    participation = byToken as Participation & { events: Event; users: { display_name: string } };
  } else {
    // Try short_code (case insensitive)
    const { data: byShortCode } = await supabase
      .from('participations')
      .select('*, events(*), users!participations_user_id_fkey(display_name)')
      .ilike('short_code', token.toUpperCase())
      .single();

    if (byShortCode) {
      participation = byShortCode as Participation & { events: Event; users: { display_name: string } };
    }
  }

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

  const inviterName = participation.users?.display_name || '友達';
  const lineOfficialUrl = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL || '';

  // Generate short_code if it doesn't exist (for older participations)
  let shortCode = participation.short_code || '';
  if (!shortCode) {
    shortCode = generateShortCode();
    await (supabase.from('participations') as any)
      .update({ short_code: shortCode })
      .eq('id', participation.id);
  }

  return (
    <InviteClient
      token={token}
      shortCode={shortCode}
      participation={participation}
      inviterName={inviterName}
      groupMemberCount={currentGroupSize}
      maxGroupSize={maxGroupSize}
      lineOfficialUrl={lineOfficialUrl}
    />
  );
}
