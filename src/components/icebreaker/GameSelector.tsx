'use client';

import { motion } from 'framer-motion';
import { Users, Play, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { GameDefinition, IcebreakerSession, IcebreakerGameType } from '@/lib/icebreaker/types';
import { getGameName, getGameEmoji } from '@/lib/icebreaker/games';

interface GameSelectorProps {
  games: GameDefinition[];
  onSelect: (gameType: IcebreakerGameType) => void;
  activeSession: IcebreakerSession | null;
  onJoinSession: () => void;
}

export function GameSelector({
  games,
  onSelect,
  activeSession,
  onJoinSession,
}: GameSelectorProps) {
  const router = useRouter();
  const hasActiveSession = activeSession && activeSession.status !== 'finished';

  // If there's an active session, show join prompt instead of game selection
  if (hasActiveSession) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6"
        >
          <div className="text-center space-y-4">
            <div className="text-5xl">
              {getGameEmoji(activeSession.game_type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {getGameName(activeSession.game_type)}
              </h2>
              <p className="text-amber-400 text-sm mt-1">
                {activeSession.status === 'waiting' ? 'メンバーを待っています...' : 'ゲーム進行中'}
              </p>
            </div>
            <p className="text-slate-400 text-sm">
              他のメンバーがこのゲームを始めました
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={onJoinSession}
                className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
              >
                <Play className="w-5 h-5" />
                参加する
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                参加しない
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // No active session - show game selection
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">ゲームを選ぶ</h2>
        <p className="text-slate-400 text-sm">
          みんなで楽しめるゲームを選んでください
        </p>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-3">
        {games.map((game, index) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(game.id)}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-800 hover:border-amber-500/50 transition-all group"
          >
            <div className="text-3xl mb-2">{game.emoji}</div>
            <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
              {game.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {game.description}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              <span>{game.minPlayers}-{game.maxPlayers}人</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
