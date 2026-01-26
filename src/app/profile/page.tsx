import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ProfileClient } from './client';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return <ProfileClient user={user} />;
}
