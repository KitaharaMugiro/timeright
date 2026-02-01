import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminVerificationClient } from './client';
import type { User, IdentityVerificationRequest } from '@/types/database';

export type VerificationRequestWithUser = IdentityVerificationRequest & {
  user: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender' | 'birth_date'>;
};

export default async function AdminVerificationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/line?redirect=/admin/verification');
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Fetch pending verification requests with user data
  const { data: requests } = await supabase
    .from('identity_verification_requests')
    .select(
      `
      *,
      user:users!user_id(id, display_name, avatar_url, gender, birth_date)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return <AdminVerificationClient initialRequests={(requests || []) as VerificationRequestWithUser[]} />;
}
