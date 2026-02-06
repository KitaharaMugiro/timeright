import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import type { IdentityVerificationRequest } from '@/types/database';
import { logAdminActivity } from '@/lib/activity-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServiceClient();

  // Get the verification request
  const { data, error: fetchError } = await supabase
    .from('identity_verification_requests')
    .select('user_id, status')
    .eq('id', id)
    .single();

  const verificationRequest = data as Pick<IdentityVerificationRequest, 'user_id' | 'status'> | null;

  if (fetchError || !verificationRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (verificationRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 400 });
  }

  // Update verification request status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('identity_verification_requests')
    .update({
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[Admin Verification] Failed to update request:', updateError);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }

  // Update user's verification status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: userUpdateError } = await (supabase as any)
    .from('users')
    .update({ is_identity_verified: true })
    .eq('id', verificationRequest.user_id);

  if (userUpdateError) {
    console.error('[Admin Verification] Failed to update user:', userUpdateError);
  }

  // Award identity_verified badge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: badge } = await (supabase as any)
    .from('badges')
    .select('id')
    .eq('slug', 'identity_verified')
    .single();

  if (badge) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: badgeError } = await (supabase as any).from('user_badges').upsert(
      {
        user_id: verificationRequest.user_id,
        badge_id: badge.id,
        awarded_reason: 'Identity verification approved by admin',
      },
      { onConflict: 'user_id,badge_id' }
    );

    if (badgeError) {
      console.error('[Admin Verification] Failed to award badge:', badgeError);
    }
  }

  logAdminActivity(verificationRequest.user_id, 'admin_verification_approve', admin.id, {
    verification_request_id: id,
  });
  console.log(`[Admin Verification] Approved request ${id} for user ${verificationRequest.user_id}`);

  return NextResponse.json({ success: true });
}
