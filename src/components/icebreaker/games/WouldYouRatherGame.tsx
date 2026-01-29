'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, XCircle } from 'lucide-react';
import { getRandomChoices } from '@/lib/icebreaker/data/would-you-rather';
import type { IcebreakerSession, IcebreakerPlayer, GameData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface WouldYouRatherGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

export function WouldYouRatherGame({
  session,
  isHost,
  onUpdateSession,
  onEndGame,
}: WouldYouRatherGameProps) {
  const gameData = session.game_data as GameData;

  const handleNewChoice = async () => {
    const choices = getRandomChoices(1);
    if (choices.length > 0) {
      const newGameData: GameData = {
        ...gameData,
        optionA: choices[0].optionA,
        optionB: choices[0].optionB,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
        current_round: session.current_round + 1,
      });
    }
  };

  useEffect(() => {
    if (isHost && !gameData.optionA) {
      handleNewChoice();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">どっちがいい？</h2>
        <p className="text-slate-400 text-sm mt-1">選んで理由を話しましょう</p>
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${gameData.optionA}-${gameData.optionB}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4"
        >
          {/* Option A */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-blue-400">A</span>
              <p className="text-xl font-bold text-white flex-1">
                {gameData.optionA || '読み込み中...'}
              </p>
            </div>
          </motion.div>

          {/* VS */}
          <div className="text-center">
            <span className="inline-block px-4 py-1 bg-slate-800 rounded-full text-slate-400 font-bold text-sm">
              VS
            </span>
          </div>

          {/* Option B */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-2xl p-6 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-pink-400">B</span>
              <p className="text-xl font-bold text-white flex-1">
                {gameData.optionB || '読み込み中...'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Instructions */}
      <div className="text-center text-slate-400 text-sm">
        指で選んで、その理由を話してみましょう！
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {isHost && (
          <button
            onClick={handleNewChoice}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            次のお題
          </button>
        )}
        {isHost && (
          <button
            onClick={onEndGame}
            className="py-3 px-6 bg-slate-800 text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
            終了
          </button>
        )}
      </div>

      {/* Round count */}
      <div className="text-center text-slate-500 text-xs">
        {session.current_round}問目
      </div>
    </div>
  );
}
