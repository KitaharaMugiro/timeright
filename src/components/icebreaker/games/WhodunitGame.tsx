'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XCircle, Send, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { shuffleArray } from '@/lib/icebreaker/games';
import type { IcebreakerSession, IcebreakerPlayer, GameData, PlayerData } from '@/lib/icebreaker/types';
import type { User } from '@/types/database';

interface WhodunitGameProps {
  session: IcebreakerSession;
  players: IcebreakerPlayer[];
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  userId: string;
  isHost: boolean;
  onUpdateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  onUpdatePlayerData: (data: Record<string, unknown>) => Promise<void>;
  onEndGame: () => Promise<void>;
}

type Phase = 'write' | 'guess' | 'reveal';

export function WhodunitGame({
  session,
  players,
  members,
  userId,
  isHost,
  onUpdateSession,
  onUpdatePlayerData,
  onEndGame,
}: WhodunitGameProps) {
  const gameData = session.game_data as GameData;
  const currentPlayer = players.find((p) => p.user_id === userId);
  const myPlayerData = currentPlayer?.player_data as PlayerData;

  const [phase, setPhase] = useState<Phase>('write');
  const [myStory, setMyStory] = useState('');
  const [revealed, setRevealed] = useState(false);

  const getMemberInfo = (memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const handleSubmitStory = async () => {
    if (!myStory.trim()) return;
    await onUpdatePlayerData({ myStory: myStory.trim() });
  };

  const handleStartGuessing = async () => {
    // Collect all stories and shuffle
    const stories = players
      .map((p) => {
        const data = p.player_data as PlayerData;
        return data?.myStory ? { text: data.myStory, authorId: p.user_id } : null;
      })
      .filter((s): s is { text: string; authorId: string } => s !== null);

    const shuffledStories = shuffleArray(stories);

    const newGameData: GameData = {
      ...gameData,
      stories: shuffledStories,
      currentStoryIndex: 0,
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
    setPhase('guess');
  };

  const handleNextStory = async () => {
    const currentIndex = gameData.currentStoryIndex || 0;
    const stories = gameData.stories || [];

    if (currentIndex + 1 >= stories.length) {
      return;
    }

    setRevealed(false);
    const newGameData: GameData = {
      ...gameData,
      currentStoryIndex: currentIndex + 1,
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
  };

  const handlePrevStory = async () => {
    const currentIndex = gameData.currentStoryIndex || 0;

    if (currentIndex <= 0) return;

    setRevealed(false);
    const newGameData: GameData = {
      ...gameData,
      currentStoryIndex: currentIndex - 1,
    };
    await onUpdateSession({
      game_data: newGameData as unknown as IcebreakerSession['game_data'],
    });
  };

  // Sync phase with game data
  useEffect(() => {
    if (gameData.stories && gameData.stories.length > 0) {
      setPhase('guess');
    }
  }, [gameData.stories]);

  const hasSubmitted = !!myPlayerData?.myStory;
  const allSubmitted = players.every((p) => {
    const data = p.player_data as PlayerData;
    return !!data?.myStory;
  });

  const stories = gameData.stories || [];
  const currentStoryIndex = gameData.currentStoryIndex || 0;
  const currentStory = stories[currentStoryIndex];
  const authorMember = currentStory ? getMemberInfo(currentStory.authorId) : null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">犯人探し</h2>
        <p className="text-slate-400 text-sm mt-1">誰の経験か当てよう！</p>
      </div>

      {/* Phase: Write */}
      {phase === 'write' && (
        <>
          {!hasSubmitted ? (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm text-center">
                あなたの面白い経験や意外な事実を書いてください
              </p>
              <textarea
                value={myStory}
                onChange={(e) => setMyStory(e.target.value)}
                placeholder="例：実は学生時代にバンドを組んでいた..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 h-32 resize-none"
              />
              <button
                onClick={handleSubmitStory}
                disabled={!myStory.trim()}
                className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
              >
                <Send className="w-5 h-5 inline mr-2" />
                送信
              </button>
            </div>
          ) : (
            <div className="text-center text-green-400 py-4">
              送信済み！他の人を待っています...
            </div>
          )}

          {/* Submission status */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">
              提出状況 ({players.filter((p) => (p.player_data as PlayerData)?.myStory).length}/{players.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const member = getMemberInfo(player.user_id);
                const submitted = !!(player.player_data as PlayerData)?.myStory;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      submitted ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'
                    }`}
                  >
                    <span className="text-sm">{member?.display_name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {isHost && allSubmitted && (
            <button
              onClick={handleStartGuessing}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors"
            >
              推理スタート！
            </button>
          )}
        </>
      )}

      {/* Phase: Guess */}
      {phase === 'guess' && currentStory && (
        <>
          {/* Progress */}
          <div className="flex justify-between text-sm text-slate-400">
            <span>エピソード</span>
            <span>{currentStoryIndex + 1} / {stories.length}</span>
          </div>

          {/* Story card */}
          <motion.div
            key={currentStoryIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6"
          >
            <p className="text-xl text-white leading-relaxed">
              「{currentStory.text}」
            </p>
          </motion.div>

          <p className="text-center text-slate-400">
            これは誰のエピソード？話し合ってみましょう！
          </p>

          {/* Reveal button */}
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors"
            >
              <Eye className="w-5 h-5 inline mr-2" />
              答えを見る
            </button>
          )}

          {/* Revealed answer */}
          {revealed && authorMember && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-amber-500/50 rounded-xl p-4 text-center"
            >
              <p className="text-slate-400 text-sm mb-2">答え</p>
              <div className="flex items-center justify-center gap-3">
                <UserAvatar
                  displayName={authorMember.display_name}
                  avatarUrl={authorMember.avatar_url}
                  gender={authorMember.gender}
                  size="md"
                />
                <span className="text-xl text-white font-bold">
                  {authorMember.display_name}
                </span>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevStory}
              disabled={currentStoryIndex === 0}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              前へ
            </button>
            <button
              onClick={handleNextStory}
              disabled={currentStoryIndex + 1 >= stories.length}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              次へ
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
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
