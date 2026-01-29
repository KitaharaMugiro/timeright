'use client';

import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { GlassCard } from '@/components/ui/magicui';
import type { MemberStage, MemberStageInfo } from '@/types/database';

interface MemberStageCardProps {
  stageInfo: MemberStageInfo;
}

const stageConfig: Record<MemberStage, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  bronze: {
    label: 'ブロンズ',
    color: '#CD7F32',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-700/30',
    icon: '🥉',
  },
  silver: {
    label: 'シルバー',
    color: '#C0C0C0',
    bgColor: 'bg-slate-400/20',
    borderColor: 'border-slate-400/30',
    icon: '🥈',
  },
  gold: {
    label: 'ゴールド',
    color: '#FFD700',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: '🥇',
  },
  platinum: {
    label: 'プラチナ',
    color: '#E5E4E2',
    bgColor: 'bg-slate-200/20',
    borderColor: 'border-slate-200/30',
    icon: '👑',
  },
};

export function MemberStageCard({ stageInfo }: MemberStageCardProps) {
  const config = stageConfig[stageInfo.stage];
  const nextConfig = stageInfo.nextStage ? stageConfig[stageInfo.nextStage] : null;

  return (
    <GlassCard className={`p-6 ${config.borderColor} border`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}
        >
          <span className="text-2xl">{config.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" style={{ color: config.color }} />
            <span className="text-sm text-slate-400">会員ステージ</span>
          </div>
          <p
            className="text-xl font-serif font-semibold"
            style={{ color: config.color }}
          >
            {config.label}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {stageInfo.nextStage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              次: {nextConfig?.icon} {nextConfig?.label}
            </span>
            <span className="text-slate-500">{stageInfo.progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: nextConfig?.color || config.color,
                opacity: 0.8,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${stageInfo.progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      <p className="mt-3 text-sm text-slate-400">
        {stageInfo.message}
      </p>
    </GlassCard>
  );
}
