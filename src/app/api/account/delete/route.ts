import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { logActivity } from '@/lib/activity-log';

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Cancel Stripe subscription if exists
    if (user.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
        });

        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        // Continue with account deletion even if Stripe fails
      }
    }

    // Log before deletion (cascade will remove the log row too)
    await logActivity(user.id, 'account_delete');

    // Delete user's reviews (as reviewer)
    await supabase
      .from('reviews')
      .delete()
      .eq('reviewer_id', user.id);

    // Delete user's participations
    await supabase
      .from('participations')
      .delete()
      .eq('user_id', user.id);

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.error('User deletion error:', error);
      return NextResponse.json(
        { error: 'アカウント削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
