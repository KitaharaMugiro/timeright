import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ParticipationStatus } from '@/types/database';

const VALID_PARTICIPATION_STATUSES: ParticipationStatus[] = ['pending', 'matched', 'canceled'];
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
    );
    const offset = (page - 1) * pageSize;

    // Pre-filter by no-show if requested (reduce scope before pagination)
    let noShowUserIds: string[] | null = null;
    if (noShowFilter === 'suspected' || noShowFilter === 'confirmed') {
      let participantIdsQuery = supabase
        .from('participations')
        .select('user_id')
        .eq('event_id', eventId);

      if (statusFilter) {
        participantIdsQuery = participantIdsQuery.eq('status', statusFilter);
      }

      const { data: participantIds } = await participantIdsQuery;

      const eventUserIds = Array.from(new Set((participantIds || []).map(p => p.user_id).filter(Boolean)));
      if (eventUserIds.length === 0) {
        return NextResponse.json({
          participants: [],
          match: null,
          pagination: {
            page,
            pageSize,
            totalCount: 0,
            totalPages: 0,
          },
        });
      }

      const minNoShows = noShowFilter === 'confirmed' ? 2 : 1;
      const { data: noShowCounts } = await supabase
        .from('reviews')
        .select('target_user_id, count:count()')
        .eq('is_no_show', true)
        .in('target_user_id', eventUserIds);

      noShowUserIds = (noShowCounts || [])
        .filter((row: { target_user_id: string; count: number | null }) => Number(row.count || 0) >= minNoShows)
        .map(row => row.target_user_id);

      if (noShowUserIds.length === 0) {
        return NextResponse.json({
          participants: [],
          match: null,
          pagination: {
            page,
            pageSize,
            totalCount: 0,
            totalPages: 0,
          },
        });
      }
    }

    // Fetch participations for this event (paged)
    let participationsQuery = supabase
      .from('participations')
      .select(
        `
        id,
        user_id,
        event_id,
        status,
        group_id,
        entry_type,
        mood,
        mood_text,
        budget_level,
        created_at,
        user:users!inner(
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
      `,
        { count: 'exact' }
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (statusFilter) {
      participationsQuery = participationsQuery.eq('status', statusFilter);
    }

    if (search) {
      participationsQuery = participationsQuery.or(
        `display_name.ilike.%${search}%,job.ilike.%${search}%`,
        { foreignTable: 'users' }
      );
    }

    if (noShowUserIds) {
      participationsQuery = participationsQuery.in('user_id', noShowUserIds);
    }

    const { data: participations, error: participationsError, count: totalCount } = await participationsQuery;

    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      return NextResponse.json({ error: 'Failed to fetch participations' }, { status: 500 });
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({
        participants: [],
        match: null,
        pagination: {
          page,
          pageSize,
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / pageSize),
        },
      });
    }

    // Get user IDs
    const userIds = participations.map(p => p.user_id);

    // Fetch reviews where these users are targets (to get no-show and rating info)
    const { data: reviewsAsTarget } = await supabase
      .from('reviews')
      .select('target_user_id, rating, is_no_show, block_flag')
      .in('target_user_id', userIds);

    // Calculate per-user review stats
    const userStats: Record<string, {
      totalNoShows: number;
      eventNoShows: number;
      avgRating: number | null;
      blockCount: number;
      reviewCount: number;
      ratingSum: number;
      ratingCount: number;
    }> = {};

    userIds.forEach(userId => {
      userStats[userId] = {
        totalNoShows: 0,
        eventNoShows: 0,
        avgRating: null,
        blockCount: 0,
        reviewCount: 0,
        ratingSum: 0,
        ratingCount: 0,
      };
    });

    reviewsAsTarget?.forEach(review => {
      const userId = review.target_user_id;
      if (!userStats[userId]) return;

      userStats[userId].reviewCount++;
      if (review.is_no_show) {
        userStats[userId].totalNoShows++;
      }
      if (review.block_flag) {
        userStats[userId].blockCount++;
      }
      if (typeof review.rating === 'number') {
        userStats[userId].ratingSum += review.rating;
        userStats[userId].ratingCount += 1;
      }
    });

    Object.keys(userStats).forEach(userId => {
      const stats = userStats[userId];
      if (stats.ratingCount > 0) {
        stats.avgRating = stats.ratingSum / stats.ratingCount;
      }
    });

    // Fetch match info for this event
    const { data: match } = await supabase
      .from('matches')
      .select('id, restaurant_name, restaurant_url')
      .eq('event_id', eventId)
      .single();

    // Build response with filters applied
    let result = participations.map(p => {
      const stats = userStats[p.user_id];
      return {
        ...p,
        reviewStats: stats
          ? {
              totalNoShows: stats.totalNoShows,
              eventNoShows: stats.eventNoShows,
              avgRating: stats.avgRating,
              blockCount: stats.blockCount,
              reviewCount: stats.reviewCount,
            }
          : null,
      };
    });

    return NextResponse.json({
      participants: result,
      match: match || null,
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in event participants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
