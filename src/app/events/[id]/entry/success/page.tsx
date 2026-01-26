import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import type { Event, Participation } from '@/types/database';
import { SuccessClient } from './client';

interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntrySuccessPage({ params }: SuccessPageProps) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Get event
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  const event = eventData as Event | null;
  if (!event) {
    notFound();
  }

  // Get user's participation for this event
  const { data: participationData } = await supabase
    .from('participations')
    .select('*')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .neq('status', 'canceled')
    .single();

  const participation = participationData as Participation | null;

  // If no participation found, redirect to dashboard
  if (!participation) {
    redirect('/dashboard');
  }

  return (
    <SuccessClient
      event={event}
      participation={participation}
    />
  );
}
