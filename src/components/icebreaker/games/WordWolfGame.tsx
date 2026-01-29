'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XCircle, Eye, Timer, Vote, RefreshCw, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { selectWolf } from '@/lib/icebreaker/games';
import type { IcebreakerSession, IcebreakerPlayer, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User, IcebreakerWordWolf } from '@/types/database';

interface WordWolfGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

type Phase = 'setup' | 'discussion' | 'voting' | 'result';

export function WordWolfGame({
  session,
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onUpdatePlayerData,
  onEndGame,
}: WordWolfGameProps) {
  const gameData = session.game_data as GameData;

  const [phase, setPhase] = useState<Phase>('setup');
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [showWord, setShowWord] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const fetchTopic = useCallback(async (): Promise<IcebreakerWordWolf | null> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/icebreaker/content/word-wolf?limit=1&random=true');
      if (response.ok) {
        const { data } = await response.json();
        if (data.length > 0) {
          return data[0];
        }
      }
    } catch (error) {
      console.error('Failed to fetch topic:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const handleStartGame = async () => {
    const topic = await fetchTopic();
    if (!topic) {
      alert('お題の取得に失敗しました');
      return;
    }

    const playerIds = players.map((p) => p.user_id);
    const wolfId = selectWolf(playerIds);

    // Calculate discussion time based on player count (3 mins base + 30s per player)
    const discussionMinutes = 3 + Math.floor(players.length * 0.5);
    const discussionEndTime = new Date(Date.now() + discussionMinutes * 60 * 1000).toISOString();

    const newGameData: GameData = {
      majorityWord: topic.majority_word,
      minorityWord: topic.minority_word,
      wolfId,
      discussionEndTime,
      votingPhase: false,
    };

    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
      current_round: session.current_round + 1,
    });

    setPhase('discussion');
  };

  const handleStartVoting = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newGameData: GameData = {
        ...gameData,
        votingPhase: true,
      };
      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
      setPhase('voting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (targetId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      setSelectedVote(targetId);
      await onUpdatePlayerData({ vote: targetId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealResult = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      setPhase('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRound = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      setPhase('setup');
      setSelectedVote(null);
      setShowWord(false);
      await onUpdateSession({
        game_data: {} as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Timer for discussion phase
  useEffect(() => {
    if (phase !== 'discussion' || !gameData.discussionEndTime) return;

    const updateTimer = () => {
      const endTime = new Date(gameData.discussionEndTime!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && isHost) {
        handleStartVoting();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [phase, gameData.discussionEndTime, isHost]);

  // Sync phase with game data
  useEffect(() => {
    if (gameData.wolfId) {
      if (gameData.votingPhase) {
        setPhase('voting');
      } else if (gameData.discussionEndTime) {
        setPhase('discussion');
      }
    }
  }, [gameData.wolfId, gameData.votingPhase, gameData.discussionEndTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Count votes
  const voteCount: Record<string, number> = {};
  players.forEach((p) => {
    const data = p.player_data as PlayerData;
    if (data?.vote) {
      voteCount[data.vote] = (voteCount[data.vote] || 0) + 1;
    }
  });

  const allVoted = players.every((p) => (p.player_data as PlayerData)?.vote);
  const wolfMember = gameData.wolfId ? getMemberInfo(gameData.wolfId) : null;
  const mostVotedId = Object.entries(voteCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const wolfCaught = mostVotedId === gameData.wolfId;

  // Determine my word based on whether I'm the wolf
  const myWord = gameData.wolfId === userId ? gameData.minorityWord : gameData.majorityWord;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">ワードウルフ</h2>
        <p className="text-slate-400 text-sm mt-1">少数派（ウルフ）を探せ！</p>
      </div>

      {/* Phase: Setup */}
      {phase === 'setup' && (
        <>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🐺</div>
            <h3 className="text-lg font-bold text-white mb-2">ゲームルール</h3>
            <ul className="text-sm text-slate-400 text-left space-y-2">
              <li>• 全員に「お題」が配られます</li>
              <li>• 1人だけ違うお題（ウルフ）が配られます</li>
              <li>• お題について話し合い、ウルフを見つけましょう</li>
              <li>• ただし、自分のお題は言ってはいけません！</li>
            </ul>
          </div>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? '読み込み中...' : 'ゲーム開始！'}
            </button>
          )}
        </>
      )}

      {/* Phase: Discussion */}
      {phase === 'discussion' && (
        <>
          {/* Timer */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`rounded-2xl p-6 text-center ${
              timeLeft <= 30
                ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
            }`}
          >
            <Timer className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm mb-1">残り時間</p>
            <p className={`text-4xl font-bold ${timeLeft <= 30 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </p>
          </motion.div>

          {/* My word */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-2">あなたのお題</p>
            {showWord ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold text-white"
              >
                {myWord}
              </motion.p>
            ) : (
              <button
                onClick={() => setShowWord(true)}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Eye className="w-5 h-5 inline mr-2" />
                タップして確認
              </button>
            )}
          </div>

          <p className="text-center text-slate-400 text-sm">
            お題について話し合いましょう！
            <br />
            ただし、お題そのものは言わないでください。
          </p>

          {isHost && (
            <button
              onClick={handleStartVoting}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> : null}
              {isLoading ? '読み込み中...' : '投票を開始'}
            </button>
          )}
        </>
      )}

      {/* Phase: Voting */}
      {phase === 'voting' && (
        <>
          <div className="text-center py-2">
            <Vote className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">投票タイム</p>
            <p className="text-slate-400 text-sm">ウルフだと思う人に投票！</p>
          </div>

          <div className="space-y-2">
            {players.map((player) => {
              const member = getMemberInfo(player.user_id);
              const isSelected = selectedVote === player.user_id;
              const votes = voteCount[player.user_id] || 0;

              return (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.user_id)}
                  disabled={player.user_id === userId || !!selectedVote || isLoading}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : player.user_id === userId || isLoading
                      ? 'bg-slate-800/30 opacity-50'
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700'
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
                    {player.user_id === userId && (
                      <span className="text-xs text-slate-500">(あなた)</span>
                    )}
                  </div>
                  {allVoted && (
                    <span className="text-amber-400 font-bold">{votes}票</span>
                  )}
                </button>
              );
            })}
          </div>

          {isHost && allVoted && (
            <button
              onClick={handleRevealResult}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> : null}
              {isLoading ? '読み込み中...' : '結果発表！'}
            </button>
          )}
        </>
      )}

      {/* Phase: Result */}
      {phase === 'result' && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl p-6 text-center ${
              wolfCaught
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                : 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30'
            }`}
          >
            <div className="text-5xl mb-3">{wolfCaught ? '🎉' : '🐺'}</div>
            <p className="text-2xl font-bold text-white mb-2">
              {wolfCaught ? 'ウルフを発見！' : 'ウルフの勝利！'}
            </p>
          </motion.div>

          {/* Wolf reveal */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-2">ウルフは...</p>
            <div className="flex items-center justify-center gap-3">
              <UserAvatar
                displayName={wolfMember?.display_name || ''}
                avatarUrl={wolfMember?.avatar_url}
                gender={wolfMember?.gender || 'male'}
                size="lg"
              />
              <span className="text-xl text-white font-bold">
                {wolfMember?.display_name}
              </span>
            </div>
          </div>

          {/* Words reveal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-1">多数派のお題</p>
              <p className="text-lg font-bold text-white">{gameData.majorityWord}</p>
            </div>
            <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-1">ウルフのお題</p>
              <p className="text-lg font-bold text-red-400">{gameData.minorityWord}</p>
            </div>
          </div>

          {isHost && (
            <button
              onClick={handleNewRound}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? '読み込み中...' : 'もう一回！'}
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
