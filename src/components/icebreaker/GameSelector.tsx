'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Play, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { IcebreakerSession, IcebreakerGameType } from '@/lib/icebreaker/types';
import type { IcebreakerGameCategory, IcebreakerGame } from '@/types/database';

interface GameSelectorProps {
  categories: IcebreakerGameCategory[];
  games: IcebreakerGame[];
  onSelect: (gameType: IcebreakerGameType) => void;
  activeSession: IcebreakerSession | null;
  onJoinSession: () => void;
}

export function GameSelector({
  categories,
  games,
  onSelect,
  activeSession,
  onJoinSession,
}: GameSelectorProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const hasActiveSession = activeSession && activeSession.status !== 'finished';

  // Find game info for active session
  const activeGame = hasActiveSession
    ? games.find((g) => g.game_type === activeSession.game_type)
    : null;

  // If there's an active session, show join prompt instead of game selection
  if (hasActiveSession && activeGame) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6"
        >
          <div className="text-center space-y-4">
            <div className="text-5xl">{activeGame.emoji}</div>
            <div>
              <h2 className="text-xl font-bold text-white">{activeGame.name}</h2>
              <p className="text-amber-400 text-sm mt-1">
                {activeSession.status === 'waiting' ? 'メンバーを待っています...' : 'ゲーム進行中'}
              </p>
            </div>
            <p className="text-slate-400 text-sm">他のメンバーがこのゲームを始めました</p>
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

  // Group games by category
  const gamesByCategory = categories.map((category) => ({
    category,
    games: games
      .filter((g) => g.category_id === category.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  // Games without category
  const uncategorizedGames = games
    .filter((g) => !g.category_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Get games to display
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const displayedGames = selectedCategoryId
    ? games.filter((g) => g.category_id === selectedCategoryId)
    : [];

  // No active session - show game selection
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">ゲームを選ぶ</h2>
        <p className="text-slate-400 text-sm">みんなで楽しめるゲームを選んでください</p>
      </div>

      {/* Category selection or game grid */}
      {!selectedCategoryId ? (
        <>
          {/* Category cards */}
          <div className="space-y-3">
            {gamesByCategory.map(({ category, games: categoryGames }, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategoryId(category.id)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-800 hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{category.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <span>{categoryGames.length}個のゲーム</span>
                    </div>
                  </div>
                  <div className="flex -space-x-1">
                    {categoryGames.slice(0, 3).map((game) => (
                      <span key={game.id} className="text-lg">
                        {game.emoji}
                      </span>
                    ))}
                    {categoryGames.length > 3 && (
                      <span className="text-xs text-slate-500 ml-1">+{categoryGames.length - 3}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}

            {/* Uncategorized games */}
            {uncategorizedGames.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categories.length * 0.05 }}
                onClick={() => setSelectedCategoryId('uncategorized')}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-800 hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🎮</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      その他
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <span>{uncategorizedGames.length}個のゲーム</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Back to categories */}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            カテゴリに戻る
          </button>

          {/* Category header */}
          {selectedCategory && (
            <div className="flex items-center gap-3 pb-2">
              <span className="text-3xl">{selectedCategory.emoji}</span>
              <div>
                <h3 className="font-bold text-white">{selectedCategory.name}</h3>
                <p className="text-xs text-slate-400">{selectedCategory.description}</p>
              </div>
            </div>
          )}

          {/* Game grid */}
          <div className="grid grid-cols-2 gap-3">
            {(selectedCategoryId === 'uncategorized' ? uncategorizedGames : displayedGames).map(
              (game, index) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(game.game_type)}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-800 hover:border-amber-500/50 transition-all group"
                >
                  <div className="text-3xl mb-2">{game.emoji}</div>
                  <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{game.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    <span>
                      {game.min_players}-{game.max_players}人
                    </span>
                  </div>
                </motion.button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
