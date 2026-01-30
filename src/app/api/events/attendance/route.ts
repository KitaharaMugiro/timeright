import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { AttendanceStatus, Event, Participation, StagePointReason } from '@/types/database';

interface AttendanceRequest {
  participation_id: string;
  action: 'cancel' | 'late';
  late_minutes?: number;
  cancel_reason?: string;
}

// Penalty points
const PENALTY_NORMAL_CANCEL = -30;
const PENALTY_LATE_CANCEL = -50;
const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { participation_id, action, late_minutes, cancel_reason }: AttendanceRequest = await request.json();

    if (!participation_id || !action) {
      return NextResponse.json(
        { error: 'participation_id and action are required' },
        { status: 400 }
      );
    }

    if (action === 'late' && (!late_minutes || late_minutes <= 0)) {
      return NextResponse.json(
        { error: 'late_minutes is required for late action' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get participation with event info
    const { data: participationData } = await supabase
      .from('participations')
      .select('*, events(*)')
      .eq('id', participation_id)
      .eq('user_id', userId)
      .single();

    const participation = participationData as (Participation & { events: Event }) | null;

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Can only update attendance if matched
    if (participation.status !== 'matched') {
      return NextResponse.json(
        { error: 'マッチング確定後のみ出欠を変更できます' },
        { status: 400 }
      );
    }

    // Cannot update attendance after event has ended
    const eventDate = new Date(participation.events.event_date);
    const eventEndTime = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000); // Assume 3 hours for dinner
    if (new Date() > eventEndTime) {
      return NextResponse.json(
        { error: 'イベント終了後は出欠を変更できません' },
        { status: 400 }
      );
    }

    // Already canceled or late
    if (participation.attendance_status === 'canceled') {
      return NextResponse.json(
        { error: '既にキャンセル済みです' },
        { status: 400 }
      );
    }

    let attendanceStatus: AttendanceStatus;
    let penaltyPoints = 0;
    let penaltyReason: StagePointReason | null = null;

    if (action === 'cancel') {
      attendanceStatus = 'canceled';

      // Calculate penalty based on time until event
      const hoursUntilEvent = eventDate.getTime() - Date.now();
      if (hoursUntilEvent < HOURS_24_IN_MS) {
        penaltyPoints = PENALTY_LATE_CANCEL;
        penaltyReason = 'late_cancel';
      } else {
        penaltyPoints = PENALTY_NORMAL_CANCEL;
        penaltyReason = 'cancel';
      }
    } else {
      // late
      attendanceStatus = 'late';
    }

    // Update attendance status
    const { error: updateError } = await (supabase.from('participations') as any)
      .update({
        attendance_status: attendanceStatus,
        attendance_updated_at: new Date().toISOString(),
        late_minutes: action === 'late' ? late_minutes : null,
        cancel_reason: action === 'cancel' ? (cancel_reason || null) : null,
      })
      .eq('id', participation_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update attendance' },
        { status: 500 }
      );
    }

    // Apply penalty points for cancel
    if (penaltyPoints !== 0 && penaltyReason) {
      await (supabase.rpc as any)('add_stage_points', {
        p_user_id: userId,
        p_points: penaltyPoints,
        p_reason: penaltyReason,
        p_reference_id: participation_id,
      });
    }

    return NextResponse.json({
      success: true,
      penalty_points: penaltyPoints,
      message: action === 'cancel'
        ? `キャンセルしました。${penaltyPoints}ポイントが減算されました。`
        : `遅刻連絡を登録しました。他のメンバーにダッシュボードで表示されます。`,
    });
  } catch (err) {
    console.error('Attendance update error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
