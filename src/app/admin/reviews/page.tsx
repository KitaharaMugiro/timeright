import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminReviewsClient } from './client';
import type { Review, User, Match, Event } from '@/types/database';

export type ReviewWithRelations = Review & {
  reviewer: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'job' | 'gender'>;
  target: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'job' | 'gender'>;
  matches: Pick<Match, 'id' | 'restaurant_name'> & {
    events: Pick<Event, 'id' | 'event_date' | 'area'>;
  };
};

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/line?redirect=/admin/reviews');
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Fetch reviews with related data
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviewer_id(id, display_name, avatar_url, job, gender),
      target:users!target_user_id(id, display_name, avatar_url, job, gender),
      matches!inner(id, restaurant_name, events!inner(id, event_date, area))
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  return <AdminReviewsClient initialReviews={(reviews || []) as ReviewWithRelations[]} />;
}
