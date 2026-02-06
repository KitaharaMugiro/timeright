'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, XCircle, Users, Mic, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { createPairs } from '@/lib/icebreaker/games';
import type { IcebreakerSession, IcebreakerPlayer, GameData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface PeerIntroGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

type Phase = 'pairing' | 'interview' | 'presentation';

export function PeerIntroGame({
  session,
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onEndGame,
}: PeerIntroGameProps) {
  const gameData = session.game_data as GameData;
  const [timeLeft, setTimeLeft] = useState(180);
  const [isLoading, setIsLoading] = useState(false);
  const autoTransitionTriggeredRef = useRef(false);

  const phase = (gameData.peerIntroPhase as Phase | undefined) || 'pairing';
  const interviewEndTime = gameData.interviewEndTime as string | undefined;

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  // Initialize pairs once per round.
  useEffect(() => {
    if (!isHost || gameData.interviewPairs) {
      return;
    }

    const playerIds = players.map((p) => p.user_id);
    const pairs = createPairs(playerIds);
    const newGameData: GameData = {
      ...gameData,
      peerIntroPhase: 'pairing',
      interviewPairs: pairs,
      currentPairIndex2: 0,
      interviewEndTime: undefined,
    };

    void onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
  }, [isHost, players, gameData, onUpdateSession]);

  // Keep interview timer synchronized for all players from shared end time.
  useEffect(() => {
    if (phase !== 'interview' || !interviewEndTime) {
      return;
    }

    const updateTimer = () => {
      const endTime = new Date(interviewEndTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [phase, interviewEndTime]);

  useEffect(() => {
    autoTransitionTriggeredRef.current = false;
  }, [interviewEndTime]);

  const handleStartInterview = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const interviewDurationSeconds = 180;
      const endTime = new Date(Date.now() + interviewDurationSeconds * 1000).toISOString();
      const newGameData: GameData = {
        ...gameData,
        peerIntroPhase: 'interview',
        interviewEndTime: endTime,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, gameData, onUpdateSession]);

  const handleStartPresentation = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newGameData: GameData = {
        ...gameData,
        peerIntroPhase: 'presentation',
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, gameData, onUpdateSession]);

  // Host auto-advances to presentation when interview timer reaches 0.
  useEffect(() => {
    if (
      isHost &&
      phase === 'interview' &&
      timeLeft === 0 &&
      !autoTransitionTriggeredRef.current
    ) {
      autoTransitionTriggeredRef.current = true;
      void handleStartPresentation();
    }
  }, [isHost, phase, timeLeft, handleStartPresentation]);

  const handleNextPair = async () => {
    if (isLoading) return;
    const currentIndex = gameData.currentPairIndex2 || 0;
    const pairs = (gameData.interviewPairs as [string, string][] | undefined) || [];

    if (currentIndex + 1 >= pairs.length) {
      return;
    }

    setIsLoading(true);
    try {
      const newGameData: GameData = {
        ...gameData,
        currentPairIndex2: currentIndex + 1,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pairs = (gameData.interviewPairs as [string, string][] | undefined) || [];
  const currentPairIndex = gameData.currentPairIndex2 || 0;
  const myPair = pairs.find((pair) => pair.includes(userId));
  const myPartner = myPair?.find((id) => id !== userId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">他己紹介</h2>
        <p className="text-slate-400 text-sm mt-1">
          ペアでインタビューして紹介しましょう
        </p>
      </div>

      {phase === 'pairing' && (
        <>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <Users className="w-5 h-5" />
              <span className="font-medium">ペア</span>
            </div>
            <div className="space-y-3">
              {pairs.map((pair, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    pair.includes(userId)
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      displayName={getMemberInfo(pair[0])?.display_name || ''}
                      avatarUrl={getMemberInfo(pair[0])?.avatar_url}
                      gender={getMemberInfo(pair[0])?.gender || 'male'}
                      size="sm"
                    />
                    <span className="text-white">
                      {getMemberInfo(pair[0])?.display_name}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      {getMemberInfo(pair[1])?.display_name}
                    </span>
                    <UserAvatar
                      displayName={getMemberInfo(pair[1])?.display_name || ''}
                      avatarUrl={getMemberInfo(pair[1])?.avatar_url}
                      gender={getMemberInfo(pair[1])?.gender || 'male'}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <button
              onClick={handleStartInterview}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> : null}
              インタビュー開始（3分）
            </button>
          )}
        </>
      )}

      {phase === 'interview' && (
        <>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 text-center"
          >
            <p className="text-slate-400 text-sm mb-2">残り時間</p>
            <p className={`text-5xl font-bold ${timeLeft <= 30 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </p>
          </motion.div>

          {myPartner && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-3">あなたのパートナー</p>
              <div className="flex items-center justify-center gap-3">
                <UserAvatar
                  displayName={getMemberInfo(myPartner)?.display_name || ''}
                  avatarUrl={getMemberInfo(myPartner)?.avatar_url}
                  gender={getMemberInfo(myPartner)?.gender || 'male'}
                  size="lg"
                />
                <span className="text-xl text-white font-bold">
                  {getMemberInfo(myPartner)?.display_name}
                </span>
              </div>
            </div>
          )}

          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">聞いてみよう</p>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• 仕事や趣味について</li>
              <li>• 最近ハマっていること</li>
              <li>• 意外な一面や特技</li>
              <li>• 他の人に伝えたいこと</li>
            </ul>
          </div>

          {isHost && timeLeft === 0 && (
            <button
              onClick={handleStartPresentation}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> : null}
              発表スタート！
            </button>
          )}
        </>
      )}

      {phase === 'presentation' && (
        <>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 text-center">
            <Mic className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-2">発表中</p>
            <div className="text-xl text-white font-bold">
              {getMemberInfo(pairs[currentPairIndex]?.[0])?.display_name}
              <span className="text-slate-400 mx-2">&</span>
              {getMemberInfo(pairs[currentPairIndex]?.[1])?.display_name}
            </div>
          </div>

          <div className="text-center text-slate-400">
            パートナーのことを紹介してください！
          </div>

          {isHost && (
            <button
              onClick={handleNextPair}
              disabled={currentPairIndex + 1 >= pairs.length || isLoading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> : null}
              {currentPairIndex + 1 >= pairs.length ? '全員発表完了！' : isLoading ? '読み込み中...' : '次のペアへ'}
            </button>
          )}
        </>
      )}

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
