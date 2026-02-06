import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { generateInviteToken, generateShortCode } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import type { User, EntryType, ParticipationMood, BudgetLevel, Participation, Event } from '@/types/database';
import { logActivity } from '@/lib/activity-log';

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

          logActivity(userId, 'subscription_start', { stripe_customer_id: customerId });

          // Award founding member badge (Gold Badge)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: foundingBadge } = await (supabase.from('badges') as any)
            .select('id')
            .eq('slug', 'founding_member')
            .single() as { data: { id: string } | null };

          if (foundingBadge) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('user_badges') as any).upsert(
              {
                user_id: userId,
                badge_id: foundingBadge.id,
                awarded_reason: 'Initial subscription',
              },
              { onConflict: 'user_id,badge_id' }
            );
          }

          // Mark invite coupon as used if this checkout used the invite coupon
          const isInviteCoupon = session.metadata?.is_invite_coupon === 'true';
          if (isInviteCoupon) {
            await (supabase.from('users') as any)
              .update({
                has_used_invite_coupon: true,
                pending_invite_token: null,
              })
              .eq('id', userId);
          }

          // Mark referral as completed if user was referred (legacy support)
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
            const budgetLevel = (parseInt(session.metadata?.budget_level || '2', 10) || 2) as BudgetLevel;

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
              const shortCode = generateShortCode();

              await (supabase.from('participations') as any).insert({
                user_id: userId,
                event_id: eventId,
                group_id: groupId,
                entry_type: entryType,
                mood,
                mood_text: moodText,
                budget_level: budgetLevel,
                invite_token: inviteToken,
                short_code: shortCode,
                status: 'pending',
              });
            }
          }

          // 招待からの参加登録を作成
          const inviteTokenFromMetadata = session.metadata?.invite_token;
          if (inviteTokenFromMetadata) {
            const mood = (session.metadata?.mood || 'lively') as ParticipationMood;
            const moodText = session.metadata?.mood_text || null;
            const budgetLevel = (parseInt(session.metadata?.budget_level || '2', 10) || 2) as BudgetLevel;

            // Get the original participation by invite token
            const { data: participationData } = await supabase
              .from('participations')
              .select('*, events(*)')
              .eq('invite_token', inviteTokenFromMetadata)
              .single();

            const originalParticipation = participationData as (Participation & { events: Event }) | null;

            if (originalParticipation && originalParticipation.events.status === 'open') {
              // Check for existing participation
              const { data: existingData } = await supabase
                .from('participations')
                .select('id, entry_type, group_id')
                .eq('user_id', userId)
                .eq('event_id', originalParticipation.event_id)
                .neq('status', 'canceled')
                .single();

              const existingParticipation = existingData as { id: string; entry_type: string; group_id: string } | null;

              if (existingParticipation) {
                // Solo entry exists - link to friend's group
                const { count: groupCount } = await supabase
                  .from('participations')
                  .select('*', { count: 'exact', head: true })
                  .eq('group_id', originalParticipation.group_id)
                  .eq('event_id', originalParticipation.event_id)
                  .neq('status', 'canceled');

                if (!groupCount || groupCount < 3) {
                  await (supabase.from('participations') as any)
                    .update({
                      group_id: originalParticipation.group_id,
                      entry_type: 'pair',
                      mood,
                      mood_text: moodText,
                      budget_level: budgetLevel,
                    })
                    .eq('id', existingParticipation.id);
                }
              } else {
                // Check group size limit (max 3 members)
                const { count: groupCount } = await supabase
                  .from('participations')
                  .select('*', { count: 'exact', head: true })
                  .eq('group_id', originalParticipation.group_id)
                  .eq('event_id', originalParticipation.event_id)
                  .neq('status', 'canceled');

                if (!groupCount || groupCount < 3) {
                  // Create participation with same group_id
                  await (supabase.from('participations') as any).insert({
                    user_id: userId,
                    event_id: originalParticipation.event_id,
                    group_id: originalParticipation.group_id,
                    entry_type: 'pair',
                    mood,
                    mood_text: moodText,
                    budget_level: budgetLevel,
                    invite_token: generateInviteToken(),
                    short_code: generateShortCode(),
                    status: 'pending',
                  });
                }
              }
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
          logActivity(user.id, 'payment_failed', { stripe_customer_id: customerId });
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
          logActivity(user.id, 'subscription_cancel', { stripe_customer_id: customerId });
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
