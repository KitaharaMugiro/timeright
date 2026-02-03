import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { EventDetailClient } from './client';

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/api/auth/line?redirect=/admin/events/${eventId}`);
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Get event
  const { data: event } = await supabase
    .from('events')
    .select('id, event_date, area, status')
    .eq('id', eventId)
    .single();

  if (!event) {
    notFound();
  }

  // Get participations with user details
  const { data: participations } = await supabase
    .from('participations')
    .select(`
      id,
      user_id,
      group_id,
      status,
      mood,
      mood_text,
      budget_level,
      users(
        id,
        display_name,
        avatar_url,
        gender,
        birth_date,
        job,
        personality_type,
        subscription_status
      )
    `)
    .eq('event_id', eventId)
    .neq('status', 'canceled')
    .order('created_at', { ascending: true });

  // Get matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, event_id, restaurant_name, restaurant_url, reservation_name, table_members')
    .eq('event_id', eventId);

  // Get guests
  const { data: guests } = await supabase
    .from('guests')
    .select('id, event_id, group_id, display_name, gender')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  return (
    <EventDetailClient
      event={event}
      participations={participations || []}
      matches={matches || []}
      guests={guests || []}
    />
  );
}
