'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, XCircle, Send, Eye } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import type { IcebreakerSession, IcebreakerPlayer, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User as UserType } from '@/types/database';

interface TwoTruthsGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<UserType, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
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
}: TwoTruthsGameProps) {
  const gameData = session.game_data as GameData;
  const currentPlayer = players.find((p) => p.user_id === userId);
  const myPlayerData = currentPlayer?.player_data as PlayerData;

  const [phase, setPhase] = useState<Phase>('setup');
  const [statements, setStatements] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState<number>(0);

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const handleSubmitStatements = async () => {
    if (statements.some((s) => !s.trim())) return;

    await onUpdatePlayerData({
      myStatements: statements,
      myLieIndex: lieIndex,
    });
  };

  const handleSelectPresenter = async (presenterId: string) => {
    const presenter = players.find((p) => p.user_id === presenterId);
    if (!presenter) return;

    const presenterData = presenter.player_data as PlayerData;
    const newGameData: GameData = {
      ...gameData,
      currentPlayerId: presenterId,
      statements: presenterData.myStatements,
      lieIndex: presenterData.myLieIndex,
      revealed: false,
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
      current_round: session.current_round + 1,
    });
    setPhase('playing');
  };

  const handleReveal = async () => {
    const newGameData: GameData = {
      ...gameData,
      revealed: true,
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
    setPhase('reveal');
  };

  const handleNextRound = async () => {
    const newGameData: GameData = {
      currentPlayerId: undefined,
      statements: undefined,
      lieIndex: undefined,
      revealed: false,
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
    setPhase('setup');
  };

  // Sync phase with game data
  useEffect(() => {
    if (gameData.currentPlayerId && gameData.revealed) {
      setPhase('reveal');
    } else if (gameData.currentPlayerId) {
      setPhase('playing');
    } else {
      setPhase('setup');
    }
  }, [gameData.currentPlayerId, gameData.revealed]);

  const hasSubmitted = !!myPlayerData?.myStatements;
  const isPresenter = gameData.currentPlayerId === userId;
  const presenterMember = gameData.currentPlayerId ? getMemberInfo(gameData.currentPlayerId) : null;

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
                disabled={statements.some((s) => !s.trim())}
                className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
              >
                <Send className="w-5 h-5 inline mr-2" />
                送信
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
                      disabled={!ready}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        ready
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

          {/* Statements */}
          <div className="space-y-3">
            {gameData.statements.map((statement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-amber-400">{index + 1}</span>
                  <p className="text-white flex-1">{statement}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-slate-400">
            どれが嘘でしょう？みんなで話し合ってください！
          </p>

          {isHost && (
            <button
              onClick={handleReveal}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors"
            >
              <Eye className="w-5 h-5 inline mr-2" />
              正解を発表！
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isLie ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {isLie ? '嘘！' : '本当'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {isHost && (
            <button
              onClick={handleNextRound}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              次の人へ
            </button>
          )}
        </>
      )}

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
