import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Fetch reviews received by this user (others reviewing them)
    const { data: reviewsReceived, error: receivedError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        is_no_show,
        block_flag,
        created_at,
        match_id,
        reviewer:users!reviews_reviewer_id_fkey(
          id,
          display_name,
          avatar_url,
          gender
        ),
        match:matches!reviews_match_id_fkey(
          id,
          event_id,
          events(
            event_date,
            area
          )
        )
      `)
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    if (receivedError) {
      console.error('Error fetching received reviews:', receivedError);
      return NextResponse.json({ error: 'Failed to fetch received reviews' }, { status: 500 });
    }

    // Fetch reviews written by this user (them reviewing others)
    const { data: reviewsGiven, error: givenError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        memo,
        is_no_show,
        block_flag,
        created_at,
        match_id,
        target:users!reviews_target_user_id_fkey(
          id,
          display_name,
          avatar_url,
          gender
        ),
        match:matches!reviews_match_id_fkey(
          id,
          event_id,
          events(
            event_date,
            area
          )
        )
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });

    if (givenError) {
      console.error('Error fetching given reviews:', givenError);
      return NextResponse.json({ error: 'Failed to fetch given reviews' }, { status: 500 });
    }

    // Fetch user info
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, gender')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      user,
      reviewsReceived: reviewsReceived || [],
      reviewsGiven: reviewsGiven || [],
    });
  } catch (error) {
    console.error('Error in user reviews API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
