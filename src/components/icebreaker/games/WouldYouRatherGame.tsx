'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, XCircle } from 'lucide-react';
import type { IcebreakerSession, IcebreakerPlayer, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User, IcebreakerWouldYouRather } from '@/types/database';

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
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onUpdatePlayerData,
  onEndGame,
}: WouldYouRatherGameProps) {
  const gameData = session.game_data as GameData;
  const [choicePool, setChoicePool] = useState<IcebreakerWouldYouRather[]>([]);
  const [poolIndex, setPoolIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const initialLoadDone = useRef(false);

  // 現在のラウンド用の投票キー（ラウンドごとにリセット）
  const voteKey = `vote_${session.current_round}`;

  // プレイヤーの投票を取得
  const getPlayerVote = (player: IcebreakerPlayer): 'A' | 'B' | null => {
    const playerData = player.player_data as PlayerData & { [key: string]: string };
    return playerData[voteKey] as 'A' | 'B' | null;
  };

  // 自分がすでに投票済みかチェック
  const currentPlayer = players.find((p) => p.user_id === userId);
  const hasVoted = currentPlayer ? !!getPlayerVote(currentPlayer) : false;

  // 投票したプレイヤーをフィルタ
  const votesA = players.filter((p) => getPlayerVote(p) === 'A');
  const votesB = players.filter((p) => getPlayerVote(p) === 'B');

  // メンバー情報を取得するヘルパー
  const getMember = (odUserId: string) => members.find((m) => m.id === odUserId);

  const handleVote = async (option: 'A' | 'B') => {
    if (hasVoted) return; // 既に投票済み
    await onUpdatePlayerData({ [voteKey]: option });
  };

  const fetchChoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/icebreaker/content/would-you-rather?limit=20&random=true');
      if (response.ok) {
        const { data } = await response.json();
        setChoicePool(data);
        setPoolIndex(0);
        return data as IcebreakerWouldYouRather[];
      }
    } catch (error) {
      console.error('Failed to fetch choices:', error);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, []);

  const handleNewChoice = async () => {
    let pool = choicePool;
    let index = poolIndex;

    // プールが空または使い切った場合は再取得
    if (pool.length === 0 || index >= pool.length) {
      pool = await fetchChoices();
      index = 0;
    }

    if (pool.length > 0 && index < pool.length) {
      const newGameData: GameData = {
        ...gameData,
        optionA: pool[index].option_a,
        optionB: pool[index].option_b,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
        current_round: session.current_round + 1,
      });
      setPoolIndex(index + 1);
    }
  };

  useEffect(() => {
    if (isHost && !gameData.optionA && !initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchChoices().then(async (pool) => {
        if (pool.length > 0) {
          const firstChoice = pool[0];
          if (!firstChoice) return;

          const newGameData: GameData = {
            ...gameData,
            optionA: firstChoice.option_a,
            optionB: firstChoice.option_b,
          };
          await onUpdateSession({
            game_data: newGameData as unknown as IcebreakerSession['game_data'],
            current_round: session.current_round + 1,
          });
          setPoolIndex(1);
        }
      });
    }
  }, [isHost, gameData, fetchChoices, onUpdateSession, session.current_round]);

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
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            onClick={() => handleVote('A')}
            className={`bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden ${
              hasVoted ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-blue-400">A</span>
              <p className="text-xl font-bold text-white flex-1">
                {isLoading ? '読み込み中...' : gameData.optionA || '読み込み中...'}
              </p>
            </div>
            {/* 投票アイコンのスタック */}
            <div className="flex flex-wrap gap-1.5 mt-3 min-h-[32px]">
              <AnimatePresence>
                {votesA.map((player, index) => {
                  const member = getMember(player.user_id);
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: 50, scale: 0.5 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                        delay: index * 0.05,
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm overflow-hidden ring-2 ring-blue-400"
                    >
                      {member?.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.display_name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                          {member?.display_name?.[0] || '?'}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            onClick={() => handleVote('B')}
            className={`bg-gradient-to-r from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-2xl p-6 relative overflow-hidden ${
              hasVoted ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-pink-400">B</span>
              <p className="text-xl font-bold text-white flex-1">
                {isLoading ? '読み込み中...' : gameData.optionB || '読み込み中...'}
              </p>
            </div>
            {/* 投票アイコンのスタック */}
            <div className="flex flex-wrap gap-1.5 mt-3 min-h-[32px]">
              <AnimatePresence>
                {votesB.map((player, index) => {
                  const member = getMember(player.user_id);
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: 50, scale: 0.5 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                        delay: index * 0.05,
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm overflow-hidden ring-2 ring-pink-400"
                    >
                      {member?.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.display_name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-pink-500 flex items-center justify-center">
                          {member?.display_name?.[0] || '?'}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Instructions */}
      <div className="text-center text-slate-400 text-sm">
        {hasVoted ? '投票済み！理由を話し合いましょう' : 'タップして投票しよう（1回だけ）'}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {isHost && (
          <button
            onClick={handleNewChoice}
            disabled={isLoading}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
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
