'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import type { IcebreakerScore } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface ScoreboardProps {
  scores: IcebreakerScore[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  currentUserId: string;
}

export function Scoreboard({ scores, members, currentUserId }: ScoreboardProps) {
  const hasAnyPoints = scores.some((s) => s.points > 0);

  if (!hasAnyPoints) return null;

  // Build sorted score list (only members with points)
  const sortedScores = [...scores]
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-slate-400 font-medium">スコア</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {sortedScores.map((score) => {
            const member = members.find((m) => m.id === score.user_id);
            if (!member) return null;
            const isMe = score.user_id === currentUserId;

            return (
              <motion.div
                key={score.user_id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                  isMe
                    ? 'bg-amber-500/20 border border-amber-500/40'
                    : 'bg-slate-800/60 border border-slate-700'
                }`}
              >
                <UserAvatar
                  displayName={member.display_name}
                  avatarUrl={member.avatar_url}
                  gender={member.gender}
                  size="xs"
                />
                <span className={`text-xs font-medium ${isMe ? 'text-amber-400' : 'text-slate-300'}`}>
                  {member.display_name}
                </span>
                <motion.span
                  key={score.points}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-bold text-amber-400"
                >
                  {score.points}pt
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
