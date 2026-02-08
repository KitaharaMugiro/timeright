import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AffiliatesAdminClient } from './client';

export default async function AdminAffiliatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.is_admin) redirect('/dashboard');

  return (
    <AdminLayout>
      <AffiliatesAdminClient />
    </AdminLayout>
  );
}
