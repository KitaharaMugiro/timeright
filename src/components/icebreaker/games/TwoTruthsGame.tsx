'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, XCircle, Send, Eye, Loader2, Check, X } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import type { IcebreakerSession, IcebreakerPlayer, IcebreakerScore, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User as UserType } from '@/types/database';

interface TwoTruthsGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<UserType, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  scores: IcebreakerScore[];
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
  onAwardPoints: (awards: { user_id: string; points: number }[]) => Promise<void>;
}

type Phase = 'setup' | 'playing' | 'reveal';

export function TwoTruthsGame({
  session,
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onUpdatePlayerData,
  onEndGame,
  onAwardPoints,
}: TwoTruthsGameProps) {
  const gameData = session.game_data as GameData;
  const currentPlayer = players.find((p) => p.user_id === userId);
  const myPlayerData = currentPlayer?.player_data as PlayerData;

  const [phase, setPhase] = useState<Phase>('setup');
  const [statements, setStatements] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const pointsAwardedRef = useRef(false);

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const handleSubmitStatements = async () => {
    if (statements.some((s) => !s.trim()) || isLoading) return;
    setIsLoading(true);
    try {
      await onUpdatePlayerData({
        myStatements: statements,
        myLieIndex: lieIndex,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPresenter = async (presenterId: string) => {
    if (isLoading) return;
    const presenter = players.find((p) => p.user_id === presenterId);
    if (!presenter) return;

    setIsLoading(true);
    try {
      const presenterData = presenter.player_data as PlayerData;
      const originalStatements = presenterData.myStatements || [];
      const originalLieIndex = presenterData.myLieIndex ?? 0;

      const indices = [0, 1, 2];
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      const shuffledStatements = indices.map((i) => originalStatements[i]);
      const newLieIndex = indices.indexOf(originalLieIndex);

      const newGameData: GameData = {
        ...gameData,
        currentPlayerId: presenterId,
        statements: shuffledStatements,
        lieIndex: newLieIndex,
        revealed: false,
      };
      pointsAwardedRef.current = false;
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
        current_round: session.current_round + 1,
      });
      setPhase('playing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuess = async (guessIndex: number) => {
    if (isLoading || isPresenter || myPlayerData?.lieGuess !== undefined) return;
    setIsLoading(true);
    try {
      await onUpdatePlayerData({ lieGuess: guessIndex });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = async () => {
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

      // Award points to correct guessers
      if (!pointsAwardedRef.current) {
        pointsAwardedRef.current = true;
        const correctGuessers = players.filter((p) => {
          const pd = p.player_data as PlayerData;
          return p.user_id !== gameData.currentPlayerId && pd.lieGuess === gameData.lieIndex;
        });
        if (correctGuessers.length > 0) {
          await onAwardPoints(
            correctGuessers.map((p) => ({ user_id: p.user_id, points: 1 }))
          );
        }
      }

      setPhase('reveal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newGameData: GameData = {
        currentPlayerId: undefined,
        statements: undefined,
        lieIndex: undefined,
        revealed: false,
      };
      pointsAwardedRef.current = false;
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
      setPhase('setup');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync phase with game data
  useEffect(() => {
    if (gameData.currentPlayerId && gameData.revealed) {
      setPhase('reveal');
    } else if (gameData.currentPlayerId) {
      setPhase('playing');
    } else {
      setPhase('setup');
      pointsAwardedRef.current = false;
    }
  }, [gameData.currentPlayerId, gameData.revealed]);

  const hasSubmitted = !!myPlayerData?.myStatements;
  const isPresenter = gameData.currentPlayerId === userId;
  const presenterMember = gameData.currentPlayerId ? getMemberInfo(gameData.currentPlayerId) : null;
  const myGuess = myPlayerData?.lieGuess;
  const hasGuessed = myGuess !== undefined;

  // Count guessers for playing phase
  const guessersCount = players.filter((p) => {
    const pd = p.player_data as PlayerData;
    return p.user_id !== gameData.currentPlayerId && pd.lieGuess !== undefined;
  }).length;
  const nonPresenterCount = players.filter((p) => p.user_id !== gameData.currentPlayerId).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">2つの真実と1つの嘘</h2>
        <p className="text-slate-400 text-sm mt-1">嘘を見破ろう！</p>
      </div>

      {/* Phase: Setup */}
      {phase === 'setup' && (
        <>
          {/* Input statements */}
          {!hasSubmitted && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm text-center">
                自分について3つ書いてください（2つ本当、1つ嘘）
              </p>
              {statements.map((statement, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={statement}
                    onChange={(e) => {
                      const newStatements = [...statements];
                      newStatements[index] = e.target.value;
                      setStatements(newStatements);
                    }}
                    placeholder={`${index + 1}つ目の発言...`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-16 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => setLieIndex(index)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                      lieIndex === index
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {lieIndex === index ? '嘘' : '嘘？'}
                  </button>
                </div>
              ))}
              <button
                onClick={handleSubmitStatements}
                disabled={statements.some((s) => !s.trim()) || isLoading}
                className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 inline mr-2" />
                )}
                {isLoading ? '送信中...' : '送信'}
              </button>
            </div>
          )}

          {/* Submitted - waiting */}
          {hasSubmitted && (
            <div className="text-center text-green-400 py-4">
              送信済み！発表者を待っています...
            </div>
          )}

          {/* Host: Select presenter */}
          {isHost && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-3">発表者を選ぶ</p>
              <div className="space-y-2">
                {players.map((player) => {
                  const member = getMemberInfo(player.user_id);
                  const playerData = player.player_data as PlayerData;
                  const ready = !!playerData?.myStatements;
                  return (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPresenter(player.user_id)}
                      disabled={!ready || isLoading}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        ready && !isLoading
                          ? 'bg-slate-700/50 hover:bg-slate-700'
                          : 'bg-slate-800/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          displayName={member?.display_name || ''}
                          avatarUrl={member?.avatar_url}
                          gender={member?.gender || 'male'}
                          size="sm"
                        />
                        <span className="text-white">{member?.display_name}</span>
                      </div>
                      <span className={`text-sm ${ready ? 'text-green-400' : 'text-slate-500'}`}>
                        {ready ? '準備OK' : '準備中'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Phase: Playing */}
      {phase === 'playing' && gameData.statements && (
        <>
          {/* Presenter info */}
          <div className="flex items-center justify-center gap-3 py-2">
            <UserAvatar
              displayName={presenterMember?.display_name || ''}
              avatarUrl={presenterMember?.avatar_url}
              gender={presenterMember?.gender || 'male'}
              size="md"
            />
            <span className="text-xl text-white font-bold">
              {presenterMember?.display_name}
            </span>
          </div>

          {/* Statements - tappable for non-presenters */}
          <div className="space-y-3">
            {gameData.statements.map((statement, index) => {
              const isSelected = myGuess === index;
              const canGuess = !isPresenter && !hasGuessed && !isLoading;

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  onClick={() => canGuess && handleGuess(index)}
                  disabled={!canGuess}
                  className={`w-full text-left rounded-xl p-4 border transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60'
                      : canGuess
                      ? 'bg-slate-800/50 border-slate-700 hover:border-amber-500/40'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${isSelected ? 'text-amber-400' : 'text-amber-400'}`}>
                      {index + 1}
                    </span>
                    <p className="text-white flex-1">{statement}</p>
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded-full text-xs font-bold">
                        嘘？
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Guess status */}
          {!isPresenter && (
            <p className="text-center text-slate-400 text-sm">
              {hasGuessed
                ? '回答済み！正解発表を待っています...'
                : '嘘だと思う文をタップ！'}
            </p>
          )}

          {isPresenter && (
            <p className="text-center text-slate-400">
              みんなが嘘を予想中です...
            </p>
          )}

          {/* Guess progress */}
          <div className="text-center text-xs text-slate-500">
            回答: {guessersCount}/{nonPresenterCount}人
          </div>

          {isHost && (
            <button
              onClick={handleReveal}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
              ) : (
                <Eye className="w-5 h-5 inline mr-2" />
              )}
              {isLoading ? '読み込み中...' : '正解を発表！'}
            </button>
          )}
        </>
      )}

      {/* Phase: Reveal */}
      {phase === 'reveal' && gameData.statements && (
        <>
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-4xl mb-2"
            >
              🎭
            </motion.div>
            <p className="text-xl font-bold text-white">正解発表！</p>
          </div>

          <div className="space-y-3">
            {gameData.statements.map((statement, index) => {
              const isLie = index === gameData.lieIndex;
              const iGuessedThis = myGuess === index;
              const iGotItRight = iGuessedThis && isLie;
              const iGotItWrong = iGuessedThis && !isLie;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.3 }}
                  className={`rounded-xl p-4 border ${
                    isLie
                      ? 'bg-red-500/20 border-red-500/50'
                      : 'bg-green-500/20 border-green-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${isLie ? 'text-red-400' : 'text-green-400'}`}>
                      {index + 1}
                    </span>
                    <p className="text-white flex-1">{statement}</p>
                    <div className="flex items-center gap-2">
                      {iGotItRight && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/30 text-green-400 rounded-full text-xs font-bold">
                          <Check className="w-3 h-3" /> +1pt
                        </span>
                      )}
                      {iGotItWrong && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full text-xs">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isLie ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {isLie ? '嘘！' : '本当'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Show who guessed correctly */}
          {(() => {
            const correctGuessers = players.filter((p) => {
              const pd = p.player_data as PlayerData;
              return p.user_id !== gameData.currentPlayerId && pd.lieGuess === gameData.lieIndex;
            });
            if (correctGuessers.length > 0) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-3"
                >
                  <p className="text-green-400 text-sm font-medium mb-2">
                    正解者 (+1pt)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {correctGuessers.map((p) => {
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
                            {member?.display_name}
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
                transition={{ delay: 1 }}
                className="text-center text-slate-500 text-sm"
              >
                誰も正解できませんでした
              </motion.div>
            );
          })()}

          {isHost && (
            <button
              onClick={handleNextRound}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? '読み込み中...' : '次の人へ'}
            </button>
          )}
        </>
      )}

      {/* End button (host only) */}
      {isHost && (
        <button
          onClick={onEndGame}
          disabled={isLoading}
          className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
        >
          <XCircle className="w-5 h-5" />
          ゲームを終了
        </button>
      )}
    </div>
  );
}
