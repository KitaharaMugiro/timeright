import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getMemberStageInfo } from '@/lib/member-stage';
import { createServiceClient } from '@/lib/supabase/server';
import { ProfileClient } from './client';
import type { UserBadgeWithBadge } from '@/types/database';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createServiceClient();
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', user.id)
    .order('awarded_at', { ascending: true });

  const stageInfo = getMemberStageInfo(user.stage_points ?? 0);

  return (
    <ProfileClient
      user={user}
      stageInfo={stageInfo}
      userBadges={(userBadges as unknown as UserBadgeWithBadge[]) || []}
    />
  );
}
