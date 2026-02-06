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
  const body = await request.json().catch(() => ({}));
  const note = body.note as string | undefined;

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
      status: 'rejected',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[Admin Verification] Failed to update request:', updateError);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }

  logAdminActivity(verificationRequest.user_id, 'admin_verification_reject', admin.id, {
    verification_request_id: id,
    note,
  });
  console.log(`[Admin Verification] Rejected request ${id}`);

  return NextResponse.json({ success: true });
}
