import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminVerificationClient } from './client';
import type { User, IdentityVerificationRequest } from '@/types/database';

export type VerificationRequestWithUser = IdentityVerificationRequest & {
  user: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender' | 'birth_date'>;
};

const DEFAULT_PAGE_SIZE = 20;

interface AdminVerificationPageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function AdminVerificationPage({ searchParams }: AdminVerificationPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/line?redirect=/admin/verification');
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();
  const resolvedSearchParams = await searchParams;

  const page = Math.max(1, parseInt(resolvedSearchParams?.page || '1', 10));
  const pageSize = DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  // Fetch pending verification requests with user data
  const { data: requests, count: totalCount } = await supabase
    .from('identity_verification_requests')
    .select(
      `
      *,
      user:users!user_id(id, display_name, avatar_url, gender, birth_date)
    `,
      { count: 'exact' }
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1);

  return (
    <AdminVerificationClient
      initialRequests={(requests || []) as VerificationRequestWithUser[]}
      pagination={{
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      }}
    />
  );
}
