'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, XCircle, Eye, EyeOff, Send, HelpCircle, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { shuffleArray } from '@/lib/icebreaker/games';
import type { IcebreakerSession, IcebreakerPlayer, IcebreakerScore, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface GuessFavoriteGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  scores: IcebreakerScore[];
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
  onAwardPoints: (awards: { user_id: string; points: number }[]) => Promise<void>;
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
  onAwardPoints,
}: GuessFavoriteGameProps) {
  const gameData = session.game_data as GameData;
  const [myAnswer, setMyAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectingFor, setSelectingFor] = useState<string | null>(null);
  const pointsAwardedRef = useRef(false);
  const lastRoundRef = useRef(session.current_round);
  const currentPlayer = players.find((p) => p.user_id === userId);
  const myPlayerData = currentPlayer?.player_data as PlayerData;

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  // Clear own player data when a new round starts
  useEffect(() => {
    if (session.current_round !== lastRoundRef.current) {
      lastRoundRef.current = session.current_round;
      pointsAwardedRef.current = false;
      onUpdatePlayerData({ myFavorite: null, guesses: null });
    }
  }, [session.current_round, onUpdatePlayerData]);

  const handleNewCategory = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const newGameData: GameData = {
        category: randomCategory,
        guessingPhase: false,
        revealed: false,
        shuffledPlayerIds: undefined,
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
      // Only update own player data - no race condition
      await onUpdatePlayerData({ myFavorite: myAnswer.trim() });
      setMyAnswer('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGuessing = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Build shuffled order from players who have submitted
      const submittedPlayerIds = players
        .filter((p) => {
          const pd = p.player_data as PlayerData;
          return !!pd?.myFavorite;
        })
        .map((p) => p.user_id);

      const shuffledIds = shuffleArray([...submittedPlayerIds]);

      const newGameData: GameData = {
        ...gameData,
        shuffledPlayerIds: shuffledIds,
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

  const handleGuess = async (answerUserId: string, guessedUserId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const currentGuesses = myPlayerData?.guesses || {};
      await onUpdatePlayerData({
        guesses: { ...currentGuesses, [answerUserId]: guessedUserId },
      });
      setSelectingFor(null);
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

      // Award points for correct guesses
      if (!pointsAwardedRef.current) {
        pointsAwardedRef.current = true;
        const awards: { user_id: string; points: number }[] = [];

        for (const player of players) {
          const pd = player.player_data as PlayerData;
          if (!pd?.guesses) continue;

          let correctCount = 0;
          for (const [answerUserId, guessedUserId] of Object.entries(pd.guesses)) {
            if (guessedUserId === answerUserId) {
              correctCount++;
            }
          }

          if (correctCount > 0) {
            awards.push({ user_id: player.user_id, points: correctCount });
          }
        }

        if (awards.length > 0) {
          await onAwardPoints(awards);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isHost && !gameData.category) {
      handleNewCategory();
    }
  }, []);

  // Derive submission status from player data (no race condition)
  const hasSubmitted = !!myPlayerData?.myFavorite;
  const allSubmitted = players.every((p) => {
    const pd = p.player_data as PlayerData;
    return !!pd?.myFavorite;
  });

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
                const pd = player.player_data as PlayerData;
                const submitted = !!pd?.myFavorite;
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
            {gameData.revealed ? '答え合わせ！' : '誰の回答かアイコンをセットしよう！'}
          </p>
          <div className="space-y-3">
            {gameData.shuffledPlayerIds?.map((answerUserId, index) => {
              const answerPlayer = players.find((p) => p.user_id === answerUserId);
              const pd = answerPlayer?.player_data as PlayerData;
              const answer = pd?.myFavorite;
              const actualMember = getMemberInfo(answerUserId);

              // Current player's guess for this answer
              const myGuessForThis = myPlayerData?.guesses?.[answerUserId];
              const guessedMember = myGuessForThis ? getMemberInfo(myGuessForThis) : null;
              const isCorrect = myGuessForThis === answerUserId;
              const isSelecting = selectingFor === answerUserId;

              return (
                <motion.div
                  key={answerUserId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-slate-800/50 border rounded-xl overflow-hidden ${
                    gameData.revealed
                      ? isCorrect
                        ? 'border-green-500/50'
                        : myGuessForThis
                        ? 'border-red-500/30'
                        : 'border-slate-700'
                      : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <p className="text-lg text-white font-medium flex-1">{answer}</p>
                    {gameData.revealed ? (
                      <div className="flex items-center gap-2">
                        {myGuessForThis && (
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            isCorrect
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isCorrect ? <Check className="w-3 h-3" /> : '×'}
                          </span>
                        )}
                        <UserAvatar
                          displayName={actualMember?.display_name || ''}
                          avatarUrl={actualMember?.avatar_url}
                          gender={actualMember?.gender || 'male'}
                          size="sm"
                        />
                        <span className="text-slate-400 text-sm">{actualMember?.display_name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectingFor(isSelecting ? null : answerUserId)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                      >
                        {guessedMember ? (
                          <>
                            <UserAvatar
                              displayName={guessedMember.display_name || ''}
                              avatarUrl={guessedMember.avatar_url}
                              gender={guessedMember.gender || 'male'}
                              size="xs"
                            />
                            <span className="text-slate-300 text-sm">{guessedMember.display_name}</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-500 text-sm">???</span>
                          </>
                        )}
                        {isSelecting ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Player selection panel */}
                  {isSelecting && !gameData.revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-4 pb-4 pt-2 border-t border-slate-700"
                    >
                      <p className="text-xs text-slate-500 mb-2">誰の回答？</p>
                      <div className="flex flex-wrap gap-2">
                        {players.map((p) => {
                          const member = getMemberInfo(p.user_id);
                          const isCurrentGuess = myGuessForThis === p.user_id;
                          return (
                            <button
                              key={p.user_id}
                              onClick={() => handleGuess(answerUserId, p.user_id)}
                              disabled={isLoading}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                                isCurrentGuess
                                  ? 'bg-pink-500/30 border border-pink-500/50'
                                  : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                              }`}
                            >
                              <UserAvatar
                                displayName={member?.display_name || ''}
                                avatarUrl={member?.avatar_url}
                                gender={member?.gender || 'male'}
                                size="xs"
                              />
                              <span className="text-sm text-slate-300">{member?.display_name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Guess progress */}
          {!gameData.revealed && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-2">推理状況</p>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const member = getMemberInfo(p.user_id);
                  const pd = p.player_data as PlayerData;
                  const guessCount = pd?.guesses ? Object.keys(pd.guesses).length : 0;
                  const totalAnswers = gameData.shuffledPlayerIds?.length || 0;
                  const allGuessed = guessCount >= totalAnswers;
                  return (
                    <div
                      key={p.user_id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                        allGuessed ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      <UserAvatar
                        displayName={member?.display_name || ''}
                        avatarUrl={member?.avatar_url}
                        gender={member?.gender || 'male'}
                        size="xs"
                      />
                      <span>{guessCount}/{totalAnswers}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reveal answers button */}
          {isHost && !gameData.revealed && (
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

          {/* Show correct guessers after reveal */}
          {gameData.revealed && (() => {
            const results = players.map((p) => {
              const pd = p.player_data as PlayerData;
              const guesses = pd?.guesses || {};
              const correctCount = Object.entries(guesses).filter(
                ([answerUserId, guessedUserId]) => guessedUserId === answerUserId
              ).length;
              return { player: p, correctCount };
            }).filter(r => r.correctCount > 0).sort((a, b) => b.correctCount - a.correctCount);

            if (results.length > 0) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-3"
                >
                  <p className="text-green-400 text-sm font-medium mb-2">
                    <Check className="w-4 h-4 inline mr-1" />
                    正解者
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.map(({ player: p, correctCount }) => {
                      const member = getMemberInfo(p.user_id);
                      return (
                        <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-full">
                          <UserAvatar
                            displayName={member?.display_name || ''}
                            avatarUrl={member?.avatar_url}
                            gender={member?.gender || 'male'}
                            size="xs"
                          />
                          <span className="text-xs text-green-400 font-medium">
                            {member?.display_name} (+{correctCount}pt)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            }
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center text-slate-500 text-sm"
              >
                誰も正解できませんでした
              </motion.div>
            );
          })()}
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
