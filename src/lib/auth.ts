import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return null;
  }

  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireActiveSubscription(): Promise<User> {
  const user = await requireAuth();

  // Allow access if:
  // 1. Status is 'active'
  // 2. Status is 'canceled' but still within the subscription period
  const hasValidSubscription =
    user.subscription_status === 'active' ||
    (user.subscription_status === 'canceled' &&
     user.subscription_period_end &&
     new Date(user.subscription_period_end) > new Date());

  if (!hasValidSubscription) {
    throw new Error('Subscription required');
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (!('is_admin' in user) || !user.is_admin) {
    throw new Error('Admin access required');
  }
  return user as User & { is_admin: boolean };
}
