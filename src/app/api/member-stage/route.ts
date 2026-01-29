import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMemberStageInfo } from '@/lib/member-stage';

export async function GET() {
  try {
    const user = await requireAuth();

    const stageInfo = getMemberStageInfo(user.stage_points);

    return NextResponse.json(stageInfo);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to get member stage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
