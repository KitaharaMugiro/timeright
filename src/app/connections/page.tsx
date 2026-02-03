import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { ConnectionsClient } from './client';
import type { Review, User, Event, Match } from '@/types/database';

export interface ConnectionWithDetails {
  review: Review;
  person: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'job' | 'gender' | 'personality_type'>;
  event: Pick<Event, 'id' | 'event_date' | 'area'>;
  match: Pick<Match, 'id' | 'restaurant_name'>;
}

const DEFAULT_PAGE_SIZE = 20;

interface ConnectionsPageProps {
  searchParams?: { page?: string };
}

export default async function ConnectionsPage({ searchParams }: ConnectionsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const pageSize = DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  // Get reviews by this user with related data (paged)
  const { data: reviews, count: totalCount } = await supabase
    .from('reviews')
    .select(`
      *,
      target:users!reviews_target_user_id_fkey(id, display_name, avatar_url, job, gender, personality_type),
      matches!inner(id, restaurant_name, events!inner(id, event_date, area))
    `, { count: 'exact' })
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Transform into ConnectionWithDetails
  const connections: ConnectionWithDetails[] = (reviews || []).map((review: any) => ({
    review: {
      id: review.id,
      reviewer_id: review.reviewer_id,
      target_user_id: review.target_user_id,
      match_id: review.match_id,
      rating: review.rating,
      comment: review.comment,
      memo: review.memo,
      block_flag: review.block_flag,
      is_no_show: review.is_no_show || false,
      created_at: review.created_at,
    },
    person: review.target,
    event: review.matches.events,
    match: {
      id: review.matches.id,
      restaurant_name: review.matches.restaurant_name,
    },
  }));

  return (
    <ConnectionsClient
      connections={connections}
      pagination={{
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      }}
    />
  );
}
