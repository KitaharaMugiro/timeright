'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Loader2, LogOut } from 'lucide-react';
import { getGameDefinition } from '@/lib/icebreaker/games';
import { UserAvatar } from '@/components/UserAvatar';
import type { IcebreakerSession, IcebreakerPlayer } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface GameLobbyProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onSetReady: (ready: boolean) => Promise<void>;
  onStartGame: () => Promise<void>;
  onLeaveSession: () => Promise<void>;
  allPlayersReady: boolean;
}

export function GameLobby({
  session,
  players,
  members,
  userId,
  isHost,
  onSetReady,
  onStartGame,
  onLeaveSession,
  allPlayersReady,
}: GameLobbyProps) {
  const [isLoading, setIsLoading] = useState(false);
  const game = getGameDefinition(session.game_type);
  const currentPlayer = players.find((p) => p.user_id === userId);
  const isReady = currentPlayer?.is_ready ?? false;

  const handleSetReady = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onSetReady(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onStartGame();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onLeaveSession();
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  return (
    <div className="space-y-6">
      {/* Game info */}
      <div className="text-center">
        <div className="text-5xl mb-3">{game.emoji}</div>
        <h2 className="text-2xl font-bold text-white">{game.name}</h2>
        <p className="text-slate-400 mt-2">{game.description}</p>
      </div>

      {/* Instructions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h3 className="font-medium text-white mb-2">遊び方</h3>
        <ul className="space-y-1">
          {game.instructions.map((instruction, index) => (
            <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
              <span className="text-amber-400 font-bold">{index + 1}.</span>
              {instruction}
            </li>
          ))}
        </ul>
      </div>

      {/* Host banner */}
      {(() => {
        const hostMember = members.find((m) => m.id === session.host_user_id);
        const hostName = hostMember?.display_name ?? '参加者';
        return (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-amber-300 text-sm font-medium">
              {isHost ? 'あなたがホストです（ゲームの進行を担当します）' : `${hostName}さんがホストです`}
            </span>
          </div>
        );
      })()}

      {/* Players */}
      <div>
        <h3 className="font-medium text-white mb-3">
          参加者 ({players.length}人)
        </h3>
        <div className="space-y-2">
          {players.map((player) => {
            const member = getMemberInfo(player.user_id);
            const playerIsHost = player.user_id === session.host_user_id;
            const isMe = player.user_id === userId;
            const displayName = member?.display_name ?? '参加者';

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  playerIsHost
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-slate-800/30 border border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    displayName={displayName}
                    avatarUrl={member?.avatar_url}
                    gender={member?.gender || 'male'}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {displayName}
                        {isMe && <span className="text-slate-400 text-xs ml-1">(あなた)</span>}
                      </span>
                      {playerIsHost && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" />
                          ホスト
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  {player.is_ready ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <Check className="w-4 h-4" />
                      準備OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      準備中
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {!isReady && (
          <button
            onClick={handleSetReady}
            disabled={isLoading}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
            ) : null}
            {isLoading ? '送信中...' : '準備OK！'}
          </button>
        )}

        {isReady && !isHost && (
          <div className="text-center text-slate-400">
            ホストがゲームを開始するのを待っています...
          </div>
        )}

        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={!allPlayersReady || players.length < game.minPlayers || isLoading}
            className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
            ) : null}
            {isLoading
              ? '読み込み中...'
              : players.length < game.minPlayers
              ? `あと${game.minPlayers - players.length}人必要`
              : allPlayersReady
              ? 'ゲームを開始！'
              : '全員の準備を待っています...'}
          </button>
        )}

        {/* Leave session button */}
        <button
          onClick={handleLeaveSession}
          disabled={isLoading}
          className="w-full py-2 text-slate-400 text-sm flex items-center justify-center gap-2 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          このゲームを抜ける
        </button>
      </div>
    </div>
  );
}
