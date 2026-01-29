'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, XCircle, Trophy } from 'lucide-react';
import { getRandomPrompts } from '@/lib/icebreaker/data/common-things';
import type { IcebreakerSession, IcebreakerPlayer, GameData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface CommonThingsGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

export function CommonThingsGame({
  session,
  isHost,
  onUpdateSession,
  onEndGame,
}: CommonThingsGameProps) {
  const gameData = session.game_data as GameData;
  const [newItem, setNewItem] = useState('');
  const foundItems = gameData.foundItems || [];
  const prompts = getRandomPrompts(5);

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    const newGameData: GameData = {
      ...gameData,
      foundItems: [...foundItems, newItem.trim()],
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
    setNewItem('');
  };

  const isComplete = foundItems.length >= 10;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">10の共通点を見つけよう！</h2>
        <p className="text-slate-400 text-sm mt-1">ペアで細かい共通点を探してください</p>
      </div>

      {/* Progress */}
      <div className="relative">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>見つけた共通点</span>
          <span className="font-bold text-amber-400">{foundItems.length} / 10</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(foundItems.length / 10) * 100}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
      </div>

      {/* Completion celebration */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 text-center"
        >
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">すごい！10個見つけました！</p>
        </motion.div>
      )}

      {/* Found items list */}
      <div className="space-y-2">
        {foundItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3"
          >
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white flex-1">{item}</span>
            <span className="text-slate-500 text-sm">#{index + 1}</span>
          </motion.div>
        ))}
      </div>

      {/* Add new item */}
      {!isComplete && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="共通点を入力..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            className="px-4 py-3 bg-amber-500 text-slate-900 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Prompts */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
        <p className="text-sm text-slate-400 mb-2">ヒント（こんな話題で探してみて）</p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm"
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>

      {/* End button */}
      <button
        onClick={onEndGame}
        className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <XCircle className="w-5 h-5" />
        ゲームを終了
      </button>
    </div>
  );
}
