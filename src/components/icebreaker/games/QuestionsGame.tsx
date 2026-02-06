'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, MessageCircle, XCircle } from 'lucide-react';
import type { IcebreakerSession, IcebreakerPlayer, GameData } from '@/lib/icebreaker/types';
import type { User, IcebreakerQuestion } from '@/types/database';

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
  const [questionPool, setQuestionPool] = useState<IcebreakerQuestion[]>([]);
  const [poolIndex, setPoolIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const initialLoadDone = useRef(false);

  const gameData = session.game_data as GameData;
  const currentQuestion = gameData.currentQuestion;

  const fetchQuestions = useCallback(async (cat: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/icebreaker/content/questions?category=${cat}&limit=20&random=true`
      );
      if (response.ok) {
        const { data } = await response.json();
        setQuestionPool(data);
        setPoolIndex(0);
        return data as IcebreakerQuestion[];
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, []);

  const handleNewQuestion = async () => {
    let pool = questionPool;
    let index = poolIndex;

    // プールが空または使い切った場合は再取得
    if (pool.length === 0 || index >= pool.length) {
      pool = await fetchQuestions(category);
      index = 0;
    }

    if (pool.length > 0 && index < pool.length) {
      const newGameData: GameData = {
        ...gameData,
        currentQuestion: pool[index].question,
        questionHistory: [
          ...(gameData.questionHistory || []),
          ...(currentQuestion ? [currentQuestion] : []),
        ],
      };
      await onUpdateSession({ game_data: newGameData as unknown as IcebreakerSession['game_data'] });
      setPoolIndex(index + 1);
    }
  };

  // カテゴリー変更時にプールをリセット
  useEffect(() => {
    if (initialLoadDone.current) {
      setQuestionPool([]);
      setPoolIndex(0);
    }
  }, [category]);

  // 初回ロード
  useEffect(() => {
    if (isHost && !currentQuestion && !initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchQuestions(category).then(async (pool) => {
        if (pool.length > 0) {
          const firstQuestion = pool[0]?.question;
          if (!firstQuestion) return;

          const newGameData: GameData = {
            ...gameData,
            currentQuestion: firstQuestion,
            questionHistory: gameData.questionHistory || [],
          };
          await onUpdateSession({
            game_data: newGameData as unknown as IcebreakerSession['game_data'],
          });
          setPoolIndex(1);
        }
      });
    }
  }, [isHost, currentQuestion, fetchQuestions, category, gameData, onUpdateSession]);

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
            {isLoading ? '質問を読み込み中...' : currentQuestion || '質問を読み込み中...'}
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
            disabled={isLoading}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
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
