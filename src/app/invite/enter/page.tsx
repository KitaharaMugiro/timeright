import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { InviteEnterClient } from './client';
import type { User } from '@/types/database';
import { getCurrentUserId, hasValidSubscription } from '@/lib/auth';

export default async function InviteEnterPage() {
  const cookieStore = await cookies();
  const userId = await getCurrentUserId();

  // Check for pending invite from cookie (from direct link)
  const pendingInvite = cookieStore.get('pending_invite')?.value;

  // Get user subscription status if logged in
  let hasActiveSubscription = false;
  if (userId) {
    const supabase = await createServiceClient();
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, subscription_period_end')
      .eq('id', userId)
      .single();

    const user = userData as Pick<User, 'subscription_status' | 'subscription_period_end'> | null;
    hasActiveSubscription = !!user && hasValidSubscription(user);
  }

  return (
    <InviteEnterClient
      isLoggedIn={!!userId}
      hasActiveSubscription={hasActiveSubscription}
      pendingInviteToken={pendingInvite || null}
    />
  );
}
