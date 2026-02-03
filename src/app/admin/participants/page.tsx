import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminParticipantsClient } from './client';

export default async function AdminParticipantsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  if (!user.is_admin) {
    redirect('/dashboard');
  }

  return <AdminParticipantsClient />;
}
