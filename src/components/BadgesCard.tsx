'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/magicui';
import type { UserBadgeWithBadge } from '@/types/database';

interface BadgesCardProps {
  isIdentityVerified: boolean;
  userBadges: UserBadgeWithBadge[];
}

const colorConfig: Record<string, {
  gradient: string;
  border: string;
  bg: string;
  text: string;
}> = {
  yellow: {
    gradient: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/30',
    text: 'text-yellow-400',
  },
  emerald: {
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/30',
    text: 'text-emerald-400',
  },
  blue: {
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/30',
    text: 'text-blue-400',
  },
  purple: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/30',
    text: 'text-purple-400',
  },
};

export function BadgesCard({ isIdentityVerified, userBadges }: BadgesCardProps) {
  // Filter out identity_verified badge from userBadges (handled separately)
  const regularBadges = userBadges.filter(ub => ub.badge.slug !== 'identity_verified');

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">あなたのバッジ</h3>
      </div>

      <div className="space-y-3">
        {/* Render badges from DB */}
        {regularBadges.map((userBadge, index) => {
          const badge = userBadge.badge;
          const colors = colorConfig[badge.color] || colorConfig.yellow;

          return (
            <motion.div
              key={userBadge.id}
              className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${colors.gradient} border ${colors.border}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                {badge.icon_type === 'emoji' && badge.icon_emoji ? (
                  <span className="text-xl">{badge.icon_emoji}</span>
                ) : badge.icon_type === 'lucide' ? (
                  <Shield className={`w-5 h-5 ${colors.text}`} />
                ) : (
                  <span className="text-xl">🏅</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${colors.text}`}>{badge.name}</p>
                <p className="text-xs text-slate-400">{badge.description}</p>
              </div>
            </motion.div>
          );
        })}

        {/* Identity Verification Badge - handled separately */}
        {isIdentityVerified ? (
          <motion.div
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * regularBadges.length }}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-400">本人確認済み</p>
              <p className="text-xs text-slate-400">身分証明書で本人確認完了</p>
            </div>
          </motion.div>
        ) : (
          <Link href="/profile/verification">
            <motion.div
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * regularBadges.length }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-500">本人確認</p>
                <p className="text-xs text-slate-600">タップして本人確認をしましょう</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </motion.div>
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
