'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, XCircle, Eye, EyeOff, Send, HelpCircle, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { shuffleArray } from '@/lib/icebreaker/games';
import type { IcebreakerSession, IcebreakerPlayer, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface GuessFavoriteGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

const CATEGORIES = [
  '好きな色',
  '好きな食べ物',
  '行きたい国',
  '好きな動物',
  '好きな映画のジャンル',
  '好きな季節',
  '理想の休日の過ごし方',
  '好きな音楽',
];

export function GuessFavoriteGame({
  session,
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onUpdatePlayerData,
  onEndGame,
}: GuessFavoriteGameProps) {
  const gameData = session.game_data as GameData;
  const [myAnswer, setMyAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentPlayer = players.find((p) => p.user_id === userId);
  const myPlayerData = currentPlayer?.player_data as PlayerData;

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const handleNewCategory = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const newGameData: GameData = {
        category: randomCategory,
        answers: [],
        guessingPhase: false,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
        current_round: session.current_round + 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!myAnswer.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onUpdatePlayerData({ myFavorite: myAnswer.trim() });

      const currentAnswers = gameData.answers || [];
      const newGameData: GameData = {
        ...gameData,
        answers: [...currentAnswers, { userId, answer: myAnswer.trim() }],
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
      setMyAnswer('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGuessing = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Shuffle answers so players can't guess by order
      const shuffledAnswers = shuffleArray([...(gameData.answers || [])]);
      const newGameData: GameData = {
        ...gameData,
        answers: shuffledAnswers,
        guessingPhase: true,
        revealed: false,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealAnswers = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newGameData: GameData = {
        ...gameData,
        revealed: true,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isHost && !gameData.category) {
      handleNewCategory();
    }
  }, []);

  const hasSubmitted = gameData.answers?.some((a) => a.userId === userId);
  const allSubmitted = players.every((p) =>
    gameData.answers?.some((a) => a.userId === p.user_id)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">好きなもの当て</h2>
        <p className="text-slate-400 text-sm mt-1">誰の回答か当てましょう</p>
      </div>

      {/* Category */}
      <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-6 text-center">
        <p className="text-slate-400 text-sm mb-2">お題</p>
        <p className="text-2xl font-bold text-white">
          {gameData.category || '読み込み中...'}
        </p>
      </div>

      {/* Answer phase */}
      {!gameData.guessingPhase && (
        <>
          {/* Submit answer */}
          {!hasSubmitted && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm text-center">あなたの回答を入力</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  placeholder="回答を入力..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!myAnswer.trim() || isLoading}
                  className="px-4 py-3 bg-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-400 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submitted status */}
          {hasSubmitted && (
            <div className="text-center text-green-400">
              回答済み！他の人を待っています...
            </div>
          )}

          {/* Submission status */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">回答状況</p>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const member = getMemberInfo(player.user_id);
                const submitted = gameData.answers?.some((a) => a.userId === player.user_id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      submitted ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'
                    }`}
                  >
                    {submitted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span className="text-sm">{member?.display_name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start guessing button */}
          {isHost && allSubmitted && (
            <button
              onClick={handleStartGuessing}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> : null}
              {isLoading ? '読み込み中...' : '推理スタート！'}
            </button>
          )}
        </>
      )}

      {/* Guessing phase */}
      {gameData.guessingPhase && (
        <div className="space-y-4">
          <p className="text-center text-amber-400 font-medium">
            {gameData.revealed ? '答え合わせ！' : '誰の回答か当ててみましょう！'}
          </p>
          <div className="space-y-3">
            {gameData.answers?.map((answer, index) => {
              const member = getMemberInfo(answer.userId);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg text-white font-medium">{answer.answer}</p>
                    {gameData.revealed ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          displayName={member?.display_name || ''}
                          avatarUrl={member?.avatar_url}
                          gender={member?.gender || 'male'}
                          size="sm"
                        />
                        <span className="text-slate-400 text-sm">{member?.display_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500">
                        <HelpCircle className="w-5 h-5" />
                        <span className="text-sm">???</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Reveal answers button */}
          {!gameData.revealed && (
            <button
              onClick={handleRevealAnswers}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
              ) : (
                <Eye className="w-5 h-5 inline mr-2" />
              )}
              {isLoading ? '読み込み中...' : '答え合わせ'}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isHost && gameData.guessingPhase && gameData.revealed && (
          <button
            onClick={handleNewCategory}
            disabled={isLoading}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '読み込み中...' : '次のお題'}
          </button>
        )}
        {isHost && (
          <button
            onClick={onEndGame}
            disabled={isLoading}
            className="py-3 px-6 bg-slate-800 text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
            終了
          </button>
        )}
      </div>
    </div>
  );
}
