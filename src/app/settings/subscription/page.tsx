import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { SubscriptionClient } from './client';

export default async function SubscriptionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return <SubscriptionClient user={user} />;
}
