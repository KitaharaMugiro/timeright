import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';
import Stripe from 'stripe';

export async function POST() {
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

    // Create checkout session without pre-filling email
    // User will enter their email in the checkout form
    // Stripe customer will be created/linked via webhook after successful payment
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/subscribe?canceled=true`,
      metadata: {
        user_id: userId,
      },
    };

    // Apply referral coupon if user was referred
    if (user.referred_by && process.env.STRIPE_REFERRAL_COUPON_ID) {
      sessionParams.discounts = [
        {
          coupon: process.env.STRIPE_REFERRAL_COUPON_ID,
        },
      ];
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
