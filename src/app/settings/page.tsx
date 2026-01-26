import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { SettingsClient } from './client';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return <SettingsClient user={user} />;
}
