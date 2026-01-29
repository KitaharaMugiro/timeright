import { createClient } from '@supabase/supabase-js';
import type { MemberStage, MemberStageInfo, StagePointReason } from '@/types/database';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ステージ閾値
const STAGE_THRESHOLDS: Record<MemberStage, number> = {
  bronze: 0,
  silver: 100,
  gold: 300,
  platinum: 600,
};

// ステージの順序
const STAGE_ORDER: MemberStage[] = ['bronze', 'silver', 'gold', 'platinum'];

// 評価に応じたポイント
const REVIEW_RATING_POINTS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
};

// ポイント定義
export const STAGE_POINTS = {
  PARTICIPATION: 20,
  REVIEW_SENT: 20,
  CANCEL_PENALTY: -50,
} as const;

export function getReviewReceivedPoints(rating: number): number {
  return REVIEW_RATING_POINTS[rating] || 15;
}

export function getStageFromPoints(points: number): MemberStage {
  if (points >= STAGE_THRESHOLDS.platinum) return 'platinum';
  if (points >= STAGE_THRESHOLDS.gold) return 'gold';
  if (points >= STAGE_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export function getNextStage(stage: MemberStage): MemberStage | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index === -1 || index === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[index + 1];
}

export function getStageProgressPercent(points: number): number {
  const currentStage = getStageFromPoints(points);
  const nextStage = getNextStage(currentStage);

  if (!nextStage) {
    return 100; // プラチナは常に100%
  }

  const currentThreshold = STAGE_THRESHOLDS[currentStage];
  const nextThreshold = STAGE_THRESHOLDS[nextStage];
  const progressInStage = points - currentThreshold;
  const stageRange = nextThreshold - currentThreshold;

  return Math.min(100, Math.floor((progressInStage / stageRange) * 100));
}

export function getStageMessage(stage: MemberStage, progressPercent: number): string {
  const nextStage = getNextStage(stage);

  if (!nextStage) {
    return '最高ランクに到達しています！';
  }

  const stageNames: Record<MemberStage, string> = {
    bronze: 'ブロンズ',
    silver: 'シルバー',
    gold: 'ゴールド',
    platinum: 'プラチナ',
  };

  if (progressPercent >= 80) {
    return `${stageNames[nextStage]}まであと少し！`;
  } else if (progressPercent >= 50) {
    return `${stageNames[nextStage]}が見えてきました`;
  } else {
    return `次は${stageNames[nextStage]}を目指しましょう`;
  }
}

export function getMemberStageInfo(points: number): MemberStageInfo {
  const stage = getStageFromPoints(points);
  const progressPercent = getStageProgressPercent(points);
  const nextStage = getNextStage(stage);
  const message = getStageMessage(stage, progressPercent);

  return {
    stage,
    progressPercent,
    nextStage,
    message,
  };
}

export async function addStagePoints(
  userId: string,
  points: number,
  reason: StagePointReason,
  referenceId?: string
): Promise<void> {
  const { error } = await supabaseAdmin.rpc('add_stage_points', {
    p_user_id: userId,
    p_points: points,
    p_reason: reason,
    p_reference_id: referenceId || null,
  });

  if (error) {
    console.error('Failed to add stage points:', error);
    throw error;
  }
}

export async function getUserStageInfo(userId: string): Promise<MemberStageInfo | null> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('stage_points, member_stage')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return null;
  }

  return getMemberStageInfo(user.stage_points);
}

export function canAccessEvent(userStage: MemberStage, requiredStage: MemberStage): boolean {
  const userIndex = STAGE_ORDER.indexOf(userStage);
  const requiredIndex = STAGE_ORDER.indexOf(requiredStage);
  return userIndex >= requiredIndex;
}

export function getStageDisplayName(stage: MemberStage): string {
  const names: Record<MemberStage, string> = {
    bronze: 'ブロンズ',
    silver: 'シルバー',
    gold: 'ゴールド',
    platinum: 'プラチナ',
  };
  return names[stage];
}

export function getStageColor(stage: MemberStage): string {
  const colors: Record<MemberStage, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };
  return colors[stage];
}
