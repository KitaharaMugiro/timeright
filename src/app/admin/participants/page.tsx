import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminParticipantsClient } from './client';

export default async function AdminParticipantsPage() {
  const supabase = await createClient();

  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    redirect('/dashboard');
  }

  return <AdminParticipantsClient />;
}
