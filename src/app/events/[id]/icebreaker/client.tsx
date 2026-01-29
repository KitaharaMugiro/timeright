'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIcebreakerRealtime } from '@/lib/icebreaker/realtime';
import { GAME_DEFINITIONS } from '@/lib/icebreaker/games';
import type { User } from '@/types/database';
import type { IcebreakerGameType } from '@/lib/icebreaker/types';
import { GameSelector } from '@/components/icebreaker/GameSelector';
import { GameLobby } from '@/components/icebreaker/GameLobby';
import { QuestionsGame } from '@/components/icebreaker/games/QuestionsGame';
import { WouldYouRatherGame } from '@/components/icebreaker/games/WouldYouRatherGame';
import { TwoTruthsGame } from '@/components/icebreaker/games/TwoTruthsGame';
import { WordWolfGame } from '@/components/icebreaker/games/WordWolfGame';
import { CommonThingsGame } from '@/components/icebreaker/games/CommonThingsGame';
import { WhodunitGame } from '@/components/icebreaker/games/WhodunitGame';
import { GuessFavoriteGame } from '@/components/icebreaker/games/GuessFavoriteGame';
import { PeerIntroGame } from '@/components/icebreaker/games/PeerIntroGame';

interface IcebreakerClientProps {
  matchId: string;
  userId: string;
  members: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender'>[];
  eventDate: string;
}

type ViewMode = 'select' | 'lobby' | 'playing';

export function IcebreakerClient({
  matchId,
  userId,
  members,
  eventDate,
}: IcebreakerClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('select');

  const {
    session,
    players,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    updateSession,
    updatePlayerData,
    setReady,
    endSession,
  } = useIcebreakerRealtime({ matchId, userId });

  // Calculate remaining time
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    const updateRemainingTime = () => {
      const eventStart = new Date(eventDate);
      const endTime = new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);
      const now = new Date();
      const diffMs = endTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setRemainingTime('終了');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setRemainingTime(`残り ${hours}時間${minutes}分`);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000);
    return () => clearInterval(interval);
  }, [eventDate]);

  // Check if current user is a player in the session
  const isPlayerInSession = players.some((p) => p.user_id === userId);

  // Sync view mode with session status (only if user is a player)
  useEffect(() => {
    if (session) {
      if (session.status === 'finished') {
        setViewMode('select');
      } else if (isPlayerInSession) {
        // Only change to lobby/playing if user has joined
        if (session.status === 'playing') {
          setViewMode('playing');
        } else if (session.status === 'waiting') {
          setViewMode('lobby');
        }
      }
      // If not a player, stay on 'select' to show join prompt
    } else if (viewMode !== 'select') {
      // Session ended or was deleted, return to game selection
      setViewMode('select');
    }
  }, [session, isPlayerInSession, viewMode]);

  const handleSelectGame = async (gameType: IcebreakerGameType) => {
    const newSession = await createSession(gameType);
    if (newSession) {
      setViewMode('lobby');
    }
  };

  const handleJoinSession = async () => {
    if (session) {
      await joinSession(session.id);
      setViewMode('lobby');
    }
  };

  const handleStartGame = async () => {
    if (session) {
      await updateSession({ status: 'playing' });
    }
  };

  const handleEndGame = async () => {
    await endSession();
    setViewMode('select');
  };

  const handleLeaveSession = async () => {
    await leaveSession();
    setViewMode('select');
  };

  const handleBack = () => {
    if (viewMode === 'lobby') {
      setViewMode('select');
    } else if (viewMode === 'playing') {
      setViewMode('lobby');
    } else {
      router.push('/dashboard');
    }
  };

  const isHost = session?.host_user_id === userId;
  const allPlayersReady = players.length > 0 && players.every((p) => p.is_ready);

  const renderGameComponent = () => {
    if (!session) return null;

    const gameProps = {
      session,
      players,
      members,
      userId,
      isHost,
      onUpdateSession: updateSession,
      onUpdatePlayerData: updatePlayerData,
      onEndGame: handleEndGame,
    };

    switch (session.game_type) {
      case 'questions':
        return <QuestionsGame {...gameProps} />;
      case 'would_you_rather':
        return <WouldYouRatherGame {...gameProps} />;
      case 'two_truths':
        return <TwoTruthsGame {...gameProps} />;
      case 'word_wolf':
        return <WordWolfGame {...gameProps} />;
      case 'common_things':
        return <CommonThingsGame {...gameProps} />;
      case 'whodunit':
        return <WhodunitGame {...gameProps} />;
      case 'guess_favorite':
        return <GuessFavoriteGame {...gameProps} />;
      case 'peer_intro':
        return <PeerIntroGame {...gameProps} />;
      default:
        return <div>Unknown game type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">Ice Breaker</h1>
          <span className="text-sm text-amber-400">{remainingTime}</span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {viewMode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GameSelector
                games={GAME_DEFINITIONS}
                onSelect={handleSelectGame}
                activeSession={session}
                onJoinSession={handleJoinSession}
              />
            </motion.div>
          )}

          {viewMode === 'lobby' && session && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GameLobby
                session={session}
                players={players}
                members={members}
                userId={userId}
                isHost={isHost}
                onSetReady={setReady}
                onStartGame={handleStartGame}
                onLeaveSession={handleLeaveSession}
                allPlayersReady={allPlayersReady}
              />
            </motion.div>
          )}

          {viewMode === 'playing' && session && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderGameComponent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
