import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AffiliateClient } from './client';

export default async function AffiliatePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const supabase = await createServiceClient();

  // Check if user already has any affiliate code applied
  const { data: existingUses } = await (supabase as any)
    .from('affiliate_code_uses')
    .select('*, affiliate_codes(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const appliedCodes = (existingUses || []).map((use: any) => ({
    code: use.affiliate_codes?.code || '',
    name: use.affiliate_codes?.name || '',
    appliedAt: use.created_at,
  }));

  return <AffiliateClient appliedCodes={appliedCodes} />;
}
