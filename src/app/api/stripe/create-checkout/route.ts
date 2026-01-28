import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import type { User, EntryType, ParticipationMood, BudgetLevel } from '@/types/database';
import Stripe from 'stripe';

interface CheckoutRequest {
  event_id?: string;
  entry_type?: EntryType;
  mood?: ParticipationMood;
  mood_text?: string | null;
  budget_level?: BudgetLevel;
}

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
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = userData as User | null;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body (optional event info)
    const body: CheckoutRequest = await request.json().catch(() => ({}));

    // Build metadata
    const metadata: Record<string, string> = {
      user_id: userId,
    };

    // Add event info to metadata if provided
    if (body.event_id) {
      metadata.event_id = body.event_id;
      metadata.entry_type = body.entry_type || 'solo';
      metadata.mood = body.mood || 'lively';
      if (body.mood_text) {
        metadata.mood_text = body.mood_text;
      }
      metadata.budget_level = String(body.budget_level || 2);
    }

    // Set success/cancel URLs based on whether event info is provided
    const successUrl = body.event_id
      ? `${process.env.NEXT_PUBLIC_APP_URL}/events/${body.event_id}/entry/success`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`;

    const cancelUrl = body.event_id
      ? `${process.env.NEXT_PUBLIC_APP_URL}/events/${body.event_id}/entry?canceled=true`
      : `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/subscribe?canceled=true`;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    // Apply invite coupon if user has pending invite and hasn't used coupon yet
    const isEligibleForInviteCoupon =
      user.pending_invite_token &&
      !user.has_used_invite_coupon &&
      process.env.STRIPE_REFERRAL_COUPON_ID;

    if (isEligibleForInviteCoupon) {
      sessionParams.discounts = [
        {
          coupon: process.env.STRIPE_REFERRAL_COUPON_ID,
        },
      ];
      // Add flag to metadata for webhook processing
      sessionParams.metadata = {
        ...sessionParams.metadata,
        is_invite_coupon: 'true',
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
