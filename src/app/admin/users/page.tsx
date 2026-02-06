import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminUsersClient } from './client';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  if (!user.is_admin) {
    redirect('/dashboard');
  }

  return <AdminUsersClient />;
}
