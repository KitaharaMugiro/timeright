import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { VerificationClient } from './client';

export default async function VerificationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // If already verified, redirect back to profile
  if (user.is_identity_verified) {
    redirect('/profile');
  }

  return <VerificationClient />;
}
