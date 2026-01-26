import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminClient } from './client';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || !user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Get all events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  return <AdminClient events={events || []} />;
}
