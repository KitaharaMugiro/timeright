import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import type { AuthSession, User } from '@/types/database';

const SESSION_COOKIE_NAME = 'session_id';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function hasValidSubscription(
  user: Pick<User, 'subscription_status' | 'subscription_period_end'>
): boolean {
  return (
    user.subscription_status === 'active' ||
    (user.subscription_status === 'canceled' &&
      user.subscription_period_end &&
      new Date(user.subscription_period_end) > new Date())
  );
}

export async function createSession(userId: string): Promise<{ id: string; expiresAt: string }> {
  const id = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('auth_sessions')
    .insert({ id, user_id: userId, expires_at: expiresAt });

  if (error) {
    throw error;
  }

  return { id, expiresAt };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.from('auth_sessions').delete().eq('id', sessionId);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const supabase = await createServiceClient();
  const { data: session } = await supabase
    .from('auth_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  const authSession = session as AuthSession | null;
  if (!authSession) {
    return null;
  }

  if (new Date(authSession.expires_at) <= new Date()) {
    await supabase.from('auth_sessions').delete().eq('id', sessionId);
    return null;
  }

  return authSession;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user_id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getCurrentUserId();

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
  if (!hasValidSubscription(user)) {
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
