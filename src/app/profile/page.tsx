import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getMemberStageInfo } from '@/lib/member-stage';
import { ProfileClient } from './client';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const stageInfo = getMemberStageInfo(user.stage_points);

  return <ProfileClient user={user} stageInfo={stageInfo} />;
}
