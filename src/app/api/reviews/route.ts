import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { isReviewAccessible } from '@/lib/utils';
import { addStagePoints, STAGE_POINTS, getReviewReceivedPoints } from '@/lib/member-stage';
import type { Match, Event } from '@/types/database';

interface ReviewRequest {
  match_id: string;
  target_user_id: string;
  rating: number;
  memo: string | null;
  block_flag: boolean;
  is_no_show?: boolean;
}

const NO_SHOW_PENALTY = -100;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    const { match_id, target_user_id, rating, memo, block_flag, is_no_show }: ReviewRequest =
      await request.json();

    // Validate rating (0 is allowed for No-Show)
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 0 and 5' },
        { status: 400 }
      );
    }

    // Validate No-Show flag consistency
    if (rating === 0 && !is_no_show) {
      return NextResponse.json(
        { error: 'Rating 0 requires is_no_show flag' },
        { status: 400 }
      );
    }

    // Check match exists and user is part of it
    const { data: matchData } = await supabase
      .from('matches')
      .select('table_members, events!inner(event_date)')
      .eq('id', match_id)
      .single();

    const match = matchData as (Pick<Match, 'table_members'> & { events: Pick<Event, 'event_date'> }) | null;
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const tableMembers = (match.table_members as string[]) || [];

    // Check if 2 hours have passed since event start
    if (!isReviewAccessible(match.events.event_date)) {
      return NextResponse.json(
        { error: 'Reviews are not yet available. Please wait until 2 hours after the event starts.' },
        { status: 403 }
      );
    }

    if (!tableMembers.includes(userId)) {
      return NextResponse.json(
        { error: 'You are not part of this match' },
        { status: 403 }
      );
    }

    if (!tableMembers.includes(target_user_id)) {
      return NextResponse.json(
        { error: 'Target user is not part of this match' },
        { status: 400 }
      );
    }

    if (userId === target_user_id) {
      return NextResponse.json(
        { error: 'Cannot review yourself' },
        { status: 400 }
      );
    }

    // Check for existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', userId)
      .eq('target_user_id', target_user_id)
      .eq('match_id', match_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Already reviewed this user for this match' },
        { status: 400 }
      );
    }

    // Create review
    const { data: reviewData, error: insertError } = await (supabase.from('reviews') as any).insert({
      reviewer_id: userId,
      target_user_id,
      match_id,
      rating,
      memo,
      block_flag,
      is_no_show: is_no_show || false,
    }).select('id').single();

    if (insertError) {
      console.error('Insert review error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // ステージポイント付与（非同期で実行、エラーがあってもレビュー自体は成功）
    try {
      // レビューを送った人: +20pt
      await addStagePoints(userId, STAGE_POINTS.REVIEW_SENT, 'review_sent', reviewData.id);

      if (is_no_show) {
        // No-Show報告の場合: 対象者に -100pt ペナルティ
        await addStagePoints(target_user_id, NO_SHOW_PENALTY, 'no_show', reviewData.id);
      } else {
        // 通常レビュー: 評価に応じて +5〜25pt
        await addStagePoints(target_user_id, getReviewReceivedPoints(rating), 'review_received', reviewData.id);
      }
    } catch (pointError) {
      console.error('Failed to add stage points:', pointError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Review error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
