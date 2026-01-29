'use client';

import { motion } from 'framer-motion';
import { Users, Play } from 'lucide-react';
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
  return (
    <div className="space-y-6">
      {/* Active session banner */}
      {activeSession && activeSession.status !== 'finished' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-400 font-medium">
                {getGameEmoji(activeSession.game_type)} {getGameName(activeSession.game_type)}
              </p>
              <p className="text-sm text-slate-400">
                {activeSession.status === 'waiting' ? '待機中' : 'プレイ中'}
              </p>
            </div>
            <button
              onClick={onJoinSession}
              className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-400 transition-colors"
            >
              <Play className="w-4 h-4" />
              参加する
            </button>
          </div>
        </motion.div>
      )}

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
