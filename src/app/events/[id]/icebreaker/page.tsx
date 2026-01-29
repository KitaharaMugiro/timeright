import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { IcebreakerClient } from './client';
import { isWithinEventWindow, formatDate, formatTime } from '@/lib/utils';
import type { Match, Event, User } from '@/types/database';

interface IcebreakerPageProps {
  params: Promise<{ id: string }>;
}

export default async function IcebreakerPage({ params }: IcebreakerPageProps) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Get event
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  const event = eventData as Event | null;
  if (!event) {
    notFound();
  }

  // Get match for this user in this event
  const { data: matchesData } = await supabase
    .from('matches')
    .select('*')
    .eq('event_id', eventId);

  const matches = matchesData as Match[] | null;
  const userMatch = matches?.find((m) => m.table_members.includes(user.id));

  if (!userMatch) {
    redirect('/dashboard');
  }

  // Check if within 3-hour event window
  if (!isWithinEventWindow(event.event_date, 3)) {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();

    if (diffMs > 0) {
      // Event hasn't started yet
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">まだ始まっていません</h1>
            <p className="text-slate-400">
              Ice Breakerはイベント開始後に使えます。
            </p>
            <p className="text-sm text-slate-500 mt-2">
              開始時刻: {formatDate(event.event_date)} {formatTime(event.event_date)}
            </p>
          </div>
        </div>
      );
    } else {
      // Event window has ended
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">終了しました</h1>
            <p className="text-slate-400">
              Ice Breakerの時間は終了しました。
            </p>
            <p className="text-sm text-slate-500 mt-2">
              素敵な時間を過ごせましたか？
            </p>
          </div>
        </div>
      );
    }
  }

  // Get table members info
  const { data: membersData } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, gender')
    .in('id', userMatch.table_members);

  const members = (membersData || []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];

  return (
    <IcebreakerClient
      matchId={userMatch.id}
      userId={user.id}
      members={members}
      eventDate={event.event_date}
    />
  );
}
