import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import type { User, EntryType, ParticipationMood, BudgetLevel } from '@/types/database';
import Stripe from 'stripe';
import { getCurrentUserId } from '@/lib/auth';

interface CheckoutRequest {
  event_id?: string;
  entry_type?: EntryType;
  mood?: ParticipationMood;
  mood_text?: string | null;
  budget_level?: BudgetLevel;
  // For invite flow
  invite_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

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

    // Add invite info to metadata if provided
    if (body.invite_token) {
      metadata.invite_token = body.invite_token;
      metadata.mood = body.mood || 'lively';
      if (body.mood_text) {
        metadata.mood_text = body.mood_text;
      }
      metadata.budget_level = String(body.budget_level || 2);
    }

    // Set success/cancel URLs based on the flow
    let successUrl: string;
    let cancelUrl: string;

    if (body.event_id) {
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${body.event_id}/entry/success`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${body.event_id}/entry?canceled=true`;
    } else if (body.invite_token) {
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?invite_success=true`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/enter?canceled=true`;
    } else {
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/subscribe?canceled=true`;
    }

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

    // Apply invite coupon if user has pending invite (from login flow) or invite_token (from direct flow)
    const hasInviteToken = user.pending_invite_token || body.invite_token;
    const isEligibleForInviteCoupon =
      hasInviteToken &&
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
    } else if (process.env.STRIPE_SOUGYOU_MEMBERSHIP_COUPON_ID) {
      // Apply founding member coupon for non-invite signups
      // This coupon provides permanent discount for early adopters (first 1,000 members)
      sessionParams.discounts = [
        {
          coupon: process.env.STRIPE_SOUGYOU_MEMBERSHIP_COUPON_ID,
        },
      ];
      sessionParams.metadata = {
        ...sessionParams.metadata,
        is_sougyou_member: 'true',
      };
    } else {
      // Allow promotion codes only when no automatic discount is applied
      // (Stripe doesn't allow both discounts and allow_promotion_codes)
      sessionParams.allow_promotion_codes = true;
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
