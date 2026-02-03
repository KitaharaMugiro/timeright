import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all events with their participations
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Fetch participations with user info
    const { data: participations, error: participationsError } = await supabase
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
      .order('created_at', { ascending: false });

    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      return NextResponse.json({ error: 'Failed to fetch participations' }, { status: 500 });
    }

    // Fetch all reviews to identify no-shows and get ratings
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        reviewer_id,
        target_user_id,
        match_id,
        rating,
        comment,
        block_flag,
        is_no_show,
        created_at,
        match:matches!reviews_match_id_fkey(
          event_id
        )
      `);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Fetch matches to link reviews to events
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, event_id, restaurant_name, table_members');

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    // Create a map of user reviews by event
    const userReviewsByEvent: Record<string, Record<string, {
      receivedReviews: typeof reviews;
      givenReviews: typeof reviews;
      noShowCount: number;
      avgRating: number | null;
      blockCount: number;
    }>> = {};

    // Initialize for all events
    events?.forEach(event => {
      userReviewsByEvent[event.id] = {};
    });

    // Process reviews
    reviews?.forEach(review => {
      const eventId = (review.match as { event_id: string } | null)?.event_id;
      if (!eventId) return;

      // Initialize user entries if not exists
      if (!userReviewsByEvent[eventId]) {
        userReviewsByEvent[eventId] = {};
      }

      // For target user (received review)
      if (!userReviewsByEvent[eventId][review.target_user_id]) {
        userReviewsByEvent[eventId][review.target_user_id] = {
          receivedReviews: [],
          givenReviews: [],
          noShowCount: 0,
          avgRating: null,
          blockCount: 0,
        };
      }
      userReviewsByEvent[eventId][review.target_user_id].receivedReviews.push(review);
      if (review.is_no_show) {
        userReviewsByEvent[eventId][review.target_user_id].noShowCount++;
      }
      if (review.block_flag) {
        userReviewsByEvent[eventId][review.target_user_id].blockCount++;
      }

      // For reviewer (given review)
      if (!userReviewsByEvent[eventId][review.reviewer_id]) {
        userReviewsByEvent[eventId][review.reviewer_id] = {
          receivedReviews: [],
          givenReviews: [],
          noShowCount: 0,
          avgRating: null,
          blockCount: 0,
        };
      }
      userReviewsByEvent[eventId][review.reviewer_id].givenReviews.push(review);
    });

    // Calculate average ratings
    Object.keys(userReviewsByEvent).forEach(eventId => {
      Object.keys(userReviewsByEvent[eventId]).forEach(userId => {
        const userData = userReviewsByEvent[eventId][userId];
        if (userData.receivedReviews.length > 0) {
          const sum = userData.receivedReviews.reduce((acc, r) => acc + r.rating, 0);
          userData.avgRating = sum / userData.receivedReviews.length;
        }
      });
    });

    // Get total no-show counts per user (across all events)
    const totalNoShowsByUser: Record<string, number> = {};
    reviews?.forEach(review => {
      if (review.is_no_show) {
        totalNoShowsByUser[review.target_user_id] = (totalNoShowsByUser[review.target_user_id] || 0) + 1;
      }
    });

    // Group participations by event
    const eventParticipants: Record<string, typeof participations> = {};
    participations?.forEach(p => {
      if (!eventParticipants[p.event_id]) {
        eventParticipants[p.event_id] = [];
      }
      eventParticipants[p.event_id].push(p);
    });

    // Build response
    const result = events?.map(event => ({
      event,
      participants: (eventParticipants[event.id] || []).map(p => ({
        ...p,
        reviewData: userReviewsByEvent[event.id]?.[p.user_id] || null,
        totalNoShows: totalNoShowsByUser[p.user_id] || 0,
      })),
      match: matches?.find(m => m.event_id === event.id) || null,
    }));

    return NextResponse.json({ events: result });
  } catch (error) {
    console.error('Error in participants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
