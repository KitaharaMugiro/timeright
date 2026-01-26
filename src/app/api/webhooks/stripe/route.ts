import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { generateInviteToken } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import type { User, EntryType, ParticipationMood } from '@/types/database';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const eventId = session.metadata?.event_id;

        if (userId && session.subscription) {
          // Fetch the subscription to get current_period_end
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          ) as unknown as { current_period_end?: number };

          // Save stripe_customer_id and update subscription status
          await (supabase.from('users') as any)
            .update({
              subscription_status: 'active',
              stripe_customer_id: customerId,
              subscription_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', userId);

          // Mark referral as completed if user was referred
          const { data: userData } = await supabase
            .from('users')
            .select('referred_by')
            .eq('id', userId)
            .single();

          const userWithReferral = userData as { referred_by: string | null } | null;
          if (userWithReferral?.referred_by) {
            await (supabase.from('referrals') as any)
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('referred_user_id', userId)
              .eq('status', 'pending');
          }

          // イベント申込情報があれば自動で参加登録を作成
          if (eventId) {
            const entryType = (session.metadata?.entry_type || 'solo') as EntryType;
            const mood = (session.metadata?.mood || 'lively') as ParticipationMood;
            const moodText = session.metadata?.mood_text || null;

            // 重複チェック
            const { data: existingParticipation } = await supabase
              .from('participations')
              .select('id')
              .eq('user_id', userId)
              .eq('event_id', eventId)
              .neq('status', 'canceled')
              .single();

            if (!existingParticipation) {
              const groupId = uuidv4();
              const inviteToken = generateInviteToken();

              await (supabase.from('participations') as any).insert({
                user_id: userId,
                event_id: eventId,
                group_id: groupId,
                entry_type: entryType,
                mood,
                mood_text: moodText,
                invite_token: inviteToken,
                status: 'pending',
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as { customer: string; subscription?: string };
        const customerId = invoice.customer;

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        const user = userData as User | null;
        if (user && invoice.subscription) {
          // Fetch the subscription to get current_period_end
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          ) as unknown as { current_period_end?: number };

          await (supabase.from('users') as any)
            .update({
              subscription_status: 'active',
              subscription_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', user.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as { customer: string };
        const customerId = invoice.customer;

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        const user = userData as User | null;
        if (user) {
          await (supabase.from('users') as any)
            .update({ subscription_status: 'past_due' })
            .eq('id', user.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as { customer: string };
        const customerId = subscription.customer;

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        const user = userData as User | null;
        if (user) {
          await (supabase.from('users') as any)
            .update({
              subscription_status: 'canceled',
              subscription_period_end: null,
            })
            .eq('id', user.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as unknown as {
          customer: string;
          status: string;
          cancel_at_period_end?: boolean;
          current_period_end?: number;
        };
        const customerId = subscription.customer;

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        const user = userData as User | null;
        if (user) {
          let status: 'active' | 'canceled' | 'past_due' = 'active';

          // Check if subscription is canceled or will be canceled at period end
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            status = 'canceled';
          } else if (subscription.cancel_at_period_end) {
            // Subscription is active but will be canceled at period end
            status = 'canceled';
          } else if (subscription.status === 'past_due') {
            status = 'past_due';
          }

          await (supabase.from('users') as any)
            .update({
              subscription_status: status,
              subscription_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', user.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
