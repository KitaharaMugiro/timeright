import { cookies } from 'next/headers';
import { InviteEnterClient } from './client';

export default async function InviteEnterPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  // Check for pending invite from cookie (from direct link)
  const pendingInvite = cookieStore.get('pending_invite')?.value;

  return (
    <InviteEnterClient
      isLoggedIn={!!userId}
      pendingInviteToken={pendingInvite || null}
    />
  );
}
