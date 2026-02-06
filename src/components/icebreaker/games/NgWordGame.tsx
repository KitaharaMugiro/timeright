'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Eye, EyeOff, AlertTriangle, RefreshCw, Loader2, MessageCircle } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { shuffleArray } from '@/lib/icebreaker/games';
import type { IcebreakerSession, IcebreakerPlayer, GameData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface NgWordGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

type Phase = 'setup' | 'playing' | 'result';

interface NgWordAssignment {
  userId: string;
  ngWord: string;
}

const FALLBACK_TOPICS = [
  '最近ハマっていること',
  '週末の過ごし方',
  '好きな食べ物・料理',
  '行ってみたい場所',
  '趣味について',
];

export function NgWordGame({
  session,
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onEndGame,
}: NgWordGameProps) {
  const gameData = session.game_data as GameData;

  const [showOthersWords, setShowOthersWords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const ngWordAssignments = (gameData.ngWordAssignments || []) as NgWordAssignment[];
  const eliminatedPlayers = (gameData.eliminatedPlayers || []) as string[];
  const discussionTopic = gameData.discussionTopic || '';
  const activePlayers = players.filter((p) => !eliminatedPlayers.includes(p.user_id));
  const phase: Phase = ngWordAssignments.length === 0
    ? 'setup'
    : gameData.resultRevealed || activePlayers.length <= 1
    ? 'result'
    : 'playing';

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const getOthersNgWords = () => {
    return ngWordAssignments.filter((a) => a.userId !== userId);
  };

  const isEliminated = (playerId: string) => {
    return eliminatedPlayers.includes(playerId);
  };

  const fetchNgWords = useCallback(async (count: number): Promise<string[]> => {
    try {
      const response = await fetch(`/api/icebreaker/content/ng-word?limit=${count}&random=true`);
      if (response.ok) {
        const { data } = await response.json();
        return data.map((item: { word: string }) => item.word);
      }
    } catch (error) {
      console.error('Failed to fetch NG words:', error);
    }
    // Fallback words
    return shuffleArray([
      'りんご', 'バナナ', '電車', '携帯', 'コーヒー',
      'パソコン', '音楽', '映画', 'ラーメン', 'カレー',
    ]).slice(0, count);
  }, []);

  const fetchDiscussionTopic = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/icebreaker/content/ng-word-topics?limit=1&random=true');
      if (response.ok) {
        const { data } = await response.json();
        if (data.length > 0) {
          return data[0].topic;
        }
      }
    } catch (error) {
      console.error('Failed to fetch discussion topic:', error);
    }
    return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
  }, []);

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      const playerIds = players.map((p) => p.user_id);
      const words = await fetchNgWords(playerIds.length);
      const shuffledWords = shuffleArray(words);

      const assignments: NgWordAssignment[] = playerIds.map((id, index) => ({
        userId: id,
        ngWord: shuffledWords[index] || `NGワード${index + 1}`,
      }));

      const topic = await fetchDiscussionTopic();

      const newGameData: GameData = {
        ngWordAssignments: assignments,
        eliminatedPlayers: [],
        discussionTopic: topic,
      };

      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
        current_round: session.current_round + 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminate = async (targetUserId: string) => {
    if (isLoading || isEliminated(targetUserId)) return;
    setIsLoading(true);
    try {
      const newEliminated = [...eliminatedPlayers, targetUserId];
      const activePlayersAfterUpdate = players.filter(
        (player) => !newEliminated.includes(player.user_id)
      ).length;
      const newGameData: GameData = {
        ...gameData,
        eliminatedPlayers: newEliminated,
        resultRevealed: activePlayersAfterUpdate <= 1 ? true : gameData.resultRevealed,
      };

      await onUpdateSession({
        game_data: newGameData as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowResult = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onUpdateSession({
        game_data: {
          ...gameData,
          resultRevealed: true,
        } as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRound = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      setShowOthersWords(false);
      await onUpdateSession({
        game_data: {} as unknown as IcebreakerSession['game_data'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (phase === 'setup') {
      setShowOthersWords(false);
    }
  }, [phase, session.current_round]);

  const winner = players.find((p) => !eliminatedPlayers.includes(p.user_id));
  const winnerMember = winner ? getMemberInfo(winner.user_id) : null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">NGワードゲーム</h2>
        <p className="text-slate-400 text-sm mt-1">自分のNGワードを言わずに会話しよう！</p>
      </div>

      {/* Phase: Setup */}
      {phase === 'setup' && (
        <>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🚫</div>
            <h3 className="text-lg font-bold text-white mb-2">ゲームルール</h3>
            <ul className="text-sm text-slate-400 text-left space-y-2">
              <li>• 全員に「NGワード」が配られます</li>
              <li>• 自分のNGワードは<span className="text-red-400 font-bold">見えません</span></li>
              <li>• 他の人のNGワードは見えます</li>
              <li>• 会話中にNGワードを言ったらアウト！</li>
              <li>• 他の人にNGワードを言わせよう</li>
            </ul>
          </div>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  読み込み中...
                </>
              ) : (
                'ゲーム開始！'
              )}
            </button>
          )}
        </>
      )}

      {/* Phase: Playing */}
      {phase === 'playing' && (
        <>
          {/* Discussion topic */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 text-center">
            <MessageCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm mb-1">話題</p>
            <p className="text-xl font-bold text-white">{discussionTopic}</p>
          </div>

          {/* My NG word (hidden) */}
          <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-2">あなたのNGワード</p>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-400">
              <EyeOff className="w-6 h-6" />
              <span>???</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              自分のNGワードは見えません
            </p>
          </div>

          {/* Others' NG words */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm">他の人のNGワード</p>
              <button
                onClick={() => setShowOthersWords(!showOthersWords)}
                className="text-xs text-amber-400 flex items-center gap-1"
              >
                {showOthersWords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showOthersWords ? '隠す' : '表示'}
              </button>
            </div>

            <AnimatePresence>
              {showOthersWords && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {getOthersNgWords().map((assignment) => {
                    const member = getMemberInfo(assignment.userId);
                    const eliminated = isEliminated(assignment.userId);

                    return (
                      <div
                        key={assignment.userId}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          eliminated
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            displayName={member?.display_name || ''}
                            avatarUrl={member?.avatar_url}
                            gender={member?.gender || 'male'}
                            size="sm"
                          />
                          <span className={`text-sm ${eliminated ? 'text-red-400 line-through' : 'text-white'}`}>
                            {member?.display_name}
                          </span>
                        </div>
                        <span className={`font-bold ${eliminated ? 'text-red-400' : 'text-amber-400'}`}>
                          {assignment.ngWord}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player status & elimination */}
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">プレイヤー（タップでアウト判定）</p>
            {players.map((player) => {
              const member = getMemberInfo(player.user_id);
              const eliminated = isEliminated(player.user_id);
              const isMe = player.user_id === userId;

              return (
                <button
                  key={player.id}
                  onClick={() => !isMe && handleEliminate(player.user_id)}
                  disabled={eliminated || isMe || isLoading}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    eliminated
                      ? 'bg-red-500/10 border border-red-500/30'
                      : isMe
                      ? 'bg-slate-800/30 border border-slate-700 cursor-default'
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-red-500/10 hover:border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      displayName={member?.display_name || ''}
                      avatarUrl={member?.avatar_url}
                      gender={member?.gender || 'male'}
                      size="sm"
                    />
                    <span className={`${eliminated ? 'text-red-400 line-through' : 'text-white'}`}>
                      {member?.display_name}
                      {isMe && <span className="text-xs text-slate-500 ml-1">(あなた)</span>}
                    </span>
                  </div>
                  {eliminated ? (
                    <span className="text-red-400 text-sm font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      アウト！
                    </span>
                  ) : !isMe ? (
                    <span className="text-xs text-slate-500">NGワードを言った？</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Show result button (host only) */}
          {isHost && (
            <button
              onClick={handleShowResult}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              結果を見る
            </button>
          )}
        </>
      )}

      {/* Phase: Result */}
      {phase === 'result' && (
        <>
          {/* Winner or no winner */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 text-center"
          >
            <div className="text-5xl mb-3">🏆</div>
            {winnerMember ? (
              <>
                <p className="text-2xl font-bold text-white mb-3">
                  {winnerMember.display_name} の勝利！
                </p>
                <UserAvatar
                  displayName={winnerMember.display_name || ''}
                  avatarUrl={winnerMember.avatar_url}
                  gender={winnerMember.gender || 'male'}
                  size="lg"
                />
              </>
            ) : (
              <p className="text-2xl font-bold text-white">ゲーム終了！</p>
            )}
          </motion.div>

          {/* Reveal all NG words */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-3 text-center">全員のNGワード</p>
            <div className="space-y-2">
              {ngWordAssignments.map((assignment) => {
                const member = getMemberInfo(assignment.userId);
                const eliminated = isEliminated(assignment.userId);
                const isMe = assignment.userId === userId;

                return (
                  <div
                    key={assignment.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      eliminated
                        ? 'bg-red-500/10 border border-red-500/30'
                        : isMe
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        displayName={member?.display_name || ''}
                        avatarUrl={member?.avatar_url}
                        gender={member?.gender || 'male'}
                        size="sm"
                      />
                      <span className={`text-sm ${eliminated ? 'text-red-400' : 'text-white'}`}>
                        {member?.display_name}
                        {isMe && <span className="text-xs text-amber-400 ml-1">(あなた)</span>}
                      </span>
                    </div>
                    <span className={`font-bold ${isMe ? 'text-amber-400' : eliminated ? 'text-red-400' : 'text-white'}`}>
                      {assignment.ngWord}
                    </span>
                  </div>
                );
              })}
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
