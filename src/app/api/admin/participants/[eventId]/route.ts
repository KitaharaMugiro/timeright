import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ParticipationStatus } from '@/types/database';

const VALID_PARTICIPATION_STATUSES: ParticipationStatus[] = ['pending', 'matched', 'canceled'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Optional filters
    const search = searchParams.get('search')?.toLowerCase();
    const noShowFilter = searchParams.get('noShow'); // 'suspected' | 'confirmed'
    const statusParam = searchParams.get('status');
    const statusFilter: ParticipationStatus | null = statusParam && VALID_PARTICIPATION_STATUSES.includes(statusParam as ParticipationStatus)
      ? (statusParam as ParticipationStatus)
      : null;

    // Fetch participations for this event
    let participationsQuery = supabase
      .from('participations')
      .select(`
        *,
        user:users!participations_user_id_fkey(
          id,
          display_name,
          avatar_url,
          gender,
          birth_date,
          job,
          line_user_id,
          member_stage,
          is_identity_verified,
          created_at
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      participationsQuery = participationsQuery.eq('status', statusFilter);
    }

    const { data: participations, error: participationsError } = await participationsQuery;

    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      return NextResponse.json({ error: 'Failed to fetch participations' }, { status: 500 });
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ participants: [], match: null });
    }

    // Get user IDs
    const userIds = participations.map(p => p.user_id);

    // Fetch reviews where these users are targets (to get no-show and rating info)
    const { data: reviewsAsTarget } = await supabase
      .from('reviews')
      .select(`
        id,
        target_user_id,
        rating,
        is_no_show,
        block_flag,
        match:matches!reviews_match_id_fkey(event_id)
      `)
      .in('target_user_id', userIds);

    // Calculate per-user review stats
    const userStats: Record<string, {
      totalNoShows: number;
      eventNoShows: number;
      avgRating: number | null;
      blockCount: number;
      reviewCount: number;
    }> = {};

    userIds.forEach(userId => {
      userStats[userId] = {
        totalNoShows: 0,
        eventNoShows: 0,
        avgRating: null,
        blockCount: 0,
        reviewCount: 0,
      };
    });

    reviewsAsTarget?.forEach(review => {
      const userId = review.target_user_id;
      if (!userStats[userId]) return;

      userStats[userId].reviewCount++;
      if (review.is_no_show) {
        userStats[userId].totalNoShows++;
        if ((review.match as { event_id: string } | null)?.event_id === eventId) {
          userStats[userId].eventNoShows++;
        }
      }
      if (review.block_flag) {
        userStats[userId].blockCount++;
      }
    });

    // Calculate average ratings
    reviewsAsTarget?.forEach(review => {
      const userId = review.target_user_id;
      if (!userStats[userId]) return;

      const current = userStats[userId].avgRating;
      if (current === null) {
        userStats[userId].avgRating = review.rating;
      } else {
        // Running average
        const count = reviewsAsTarget.filter(r => r.target_user_id === userId).indexOf(review) + 1;
        userStats[userId].avgRating = current + (review.rating - current) / count;
      }
    });

    // Recalculate average properly
    Object.keys(userStats).forEach(userId => {
      const reviews = reviewsAsTarget?.filter(r => r.target_user_id === userId) || [];
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        userStats[userId].avgRating = sum / reviews.length;
      }
    });

    // Fetch match info for this event
    const { data: match } = await supabase
      .from('matches')
      .select('id, restaurant_name, restaurant_url')
      .eq('event_id', eventId)
      .single();

    // Build response with filters applied
    let result = participations.map(p => ({
      ...p,
      reviewStats: userStats[p.user_id] || null,
    }));

    // Apply search filter (client-side style but on server)
    if (search) {
      result = result.filter(p => {
        const user = p.user as { display_name: string; job: string | null };
        return (
          user.display_name.toLowerCase().includes(search) ||
          (user.job && user.job.toLowerCase().includes(search))
        );
      });
    }

    // Apply no-show filter
    if (noShowFilter === 'suspected') {
      result = result.filter(p => (userStats[p.user_id]?.totalNoShows || 0) > 0);
    } else if (noShowFilter === 'confirmed') {
      result = result.filter(p => (userStats[p.user_id]?.totalNoShows || 0) >= 2);
    }

    return NextResponse.json({
      participants: result,
      match: match || null,
    });
  } catch (error) {
    console.error('Error in event participants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
