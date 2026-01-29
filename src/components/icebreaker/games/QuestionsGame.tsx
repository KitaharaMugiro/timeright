'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, MessageCircle, XCircle } from 'lucide-react';
import { getRandomQuestions } from '@/lib/icebreaker/data/questions';
import type { IcebreakerSession, IcebreakerPlayer, GameData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface QuestionsGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

export function QuestionsGame({
  session,
  isHost,
  onUpdateSession,
  onEndGame,
}: QuestionsGameProps) {
  const [category, setCategory] = useState<'casual' | 'fun' | 'deep'>('casual');
  const gameData = session.game_data as GameData;
  const currentQuestion = gameData.currentQuestion;

  const handleNewQuestion = async () => {
    const questions = getRandomQuestions(1, category);
    if (questions.length > 0) {
      const newGameData: GameData = {
        ...gameData,
        currentQuestion: questions[0].question,
        questionHistory: [
          ...(gameData.questionHistory || []),
          ...(currentQuestion ? [currentQuestion] : []),
        ],
      };
      await onUpdateSession({ game_data: newGameData as unknown as IcebreakerSession['game_data'] });
    }
  };

  useEffect(() => {
    if (isHost && !currentQuestion) {
      handleNewQuestion();
    }
  }, []);

  const categories = [
    { id: 'casual', label: 'カジュアル', emoji: '💬' },
    { id: 'fun', label: 'おもしろ', emoji: '🎉' },
    { id: 'deep', label: '深い話', emoji: '💭' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat.id
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Question display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-8 text-center"
        >
          <MessageCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white leading-relaxed">
            {currentQuestion || '質問を読み込み中...'}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Instructions */}
      <div className="text-center text-slate-400 text-sm">
        全員が順番に答えましょう。理由を添えると盛り上がります！
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {isHost && (
          <button
            onClick={handleNewQuestion}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            次の質問
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

      {/* Question count */}
      <div className="text-center text-slate-500 text-xs">
        {(gameData.questionHistory?.length || 0) + 1}問目
      </div>
    </div>
  );
}
