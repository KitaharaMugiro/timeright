import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { isWithin48Hours } from '@/lib/utils';
import { EntryClient } from './client';
import type { Event } from '@/types/database';

interface EntryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // subscription_status をクライアントに渡す（決済はイベント申込時に行う）

  const supabase = await createServiceClient();

  // Get event
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('status', 'open')
    .single();

  const event = eventData as Event | null;
  if (!event) {
    notFound();
  }

  // Check if user already entered
  const { data: existingParticipation } = await supabase
    .from('participations')
    .select('*')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .neq('status', 'canceled')
    .single();

  if (existingParticipation) {
    redirect('/dashboard');
  }

  // Check if entry is allowed (no entries within 48 hours)
  const canEntry = !isWithin48Hours(event.event_date);
  if (!canEntry) {
    redirect('/dashboard');
  }

  return (
    <EntryClient
      event={event}
      canInvite={canEntry}
      subscriptionStatus={user.subscription_status}
      subscriptionPeriodEnd={user.subscription_period_end}
    />
  );
}
