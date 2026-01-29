import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminClient } from './client';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    // クッキーが残っているが DB にユーザーがいない場合、クッキーを削除
    const cookieStore = await cookies();
    cookieStore.delete('user_id');
    redirect('/api/auth/line?redirect=/admin');
  }

  if (!user.is_admin) {
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
