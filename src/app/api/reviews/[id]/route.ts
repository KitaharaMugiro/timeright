import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';

interface UpdateMemoRequest {
  memo: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;
    const { memo }: UpdateMemoRequest = await request.json();

    const supabase = await createServiceClient();

    // Check that the user owns this review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, reviewer_id')
      .eq('id', reviewId)
      .single() as { data: { id: string; reviewer_id: string } | null };

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.reviewer_id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this review' },
        { status: 403 }
      );
    }

    // Update the memo
    const { error: updateError } = await (supabase
      .from('reviews') as any)
      .update({ memo })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Update memo error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update memo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update memo error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
