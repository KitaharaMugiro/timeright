import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { InviteEnterClient } from './client';
import type { User } from '@/types/database';

export default async function InviteEnterPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  // Check for pending invite from cookie (from direct link)
  const pendingInvite = cookieStore.get('pending_invite')?.value;

  // Get user subscription status if logged in
  let hasActiveSubscription = false;
  if (userId) {
    const supabase = await createServiceClient();
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const user = userData as Pick<User, 'subscription_status'> | null;
    hasActiveSubscription = user?.subscription_status === 'active';
  }

  return (
    <InviteEnterClient
      isLoggedIn={!!userId}
      hasActiveSubscription={hasActiveSubscription}
      pendingInviteToken={pendingInvite || null}
    />
  );
}
