import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { ReviewClient } from './client';
import { isReviewAccessible, formatDate, formatTime } from '@/lib/utils';
import type { Match, Event, User, Review } from '@/types/database';

interface ReviewPageProps {
  params: Promise<{ matchId: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { matchId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Get match
  const { data: matchData } = await supabase
    .from('matches')
    .select('*, events(*)')
    .eq('id', matchId)
    .single();

  const match = matchData as (Match & { events: Event }) | null;
  if (!match) {
    notFound();
  }

  const tableMembers = (match.table_members as string[]) || [];

  // Check if user is part of this match
  if (!tableMembers.includes(user.id)) {
    redirect('/dashboard');
  }

  // Check if 2 hours have passed since event start
  if (!isReviewAccessible(match.events.event_date)) {
    const eventDate = new Date(match.events.event_date);
    const reviewAccessTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">レビューはまだできません</h1>
          <p className="text-slate-400">
            イベント開始から2時間後にレビューできます。
          </p>
          <p className="text-sm text-slate-500 mt-2">
            レビュー可能時刻: {formatDate(reviewAccessTime.toISOString())} {formatTime(reviewAccessTime.toISOString())}
          </p>
        </div>
      </div>
    );
  }

  // Get other members' info (filter out guest IDs that start with 'guest:')
  const otherMemberIds = tableMembers.filter(
    (id: string) => id !== user.id && !id.startsWith('guest:')
  );
  const { data: membersData } = otherMemberIds.length > 0
    ? await supabase
        .from('users')
        .select('id, display_name, personality_type, job, avatar_url, gender')
        .in('id', otherMemberIds)
    : { data: [] };

  const members = (membersData || []) as Pick<User, 'id' | 'display_name' | 'personality_type' | 'job' | 'avatar_url' | 'gender'>[];

  // Get existing reviews by this user for this match
  const { data: existingReviewsData } = await supabase
    .from('reviews')
    .select('target_user_id')
    .eq('reviewer_id', user.id)
    .eq('match_id', matchId);

  const existingReviews = (existingReviewsData || []) as Pick<Review, 'target_user_id'>[];
  const reviewedUserIds = existingReviews.map((r) => r.target_user_id);

  return (
    <ReviewClient
      match={match}
      members={members}
      reviewedUserIds={reviewedUserIds}
    />
  );
}
