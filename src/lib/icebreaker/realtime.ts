'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IcebreakerSession, IcebreakerPlayer, IcebreakerScore, PlayerData } from './types';

interface UseIcebreakerRealtimeProps {
  matchId: string;
  userId: string;
}

interface UseIcebreakerRealtimeReturn {
  session: IcebreakerSession | null;
  players: IcebreakerPlayer[];
  scores: IcebreakerScore[];
  isLoading: boolean;
  error: string | null;
  createSession: (gameType: string) => Promise<IcebreakerSession | null>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  updateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  updatePlayerData: (data: Partial<PlayerData>) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  endSession: () => Promise<void>;
  awardPoints: (awards: { user_id: string; points: number }[]) => Promise<void>;
}

// Helper to get untyped supabase client for new tables
function getClient(): SupabaseClient<never, 'public', never> {
  return createClient() as SupabaseClient<never, 'public', never>;
}

export function useIcebreakerRealtime({
  matchId,
  userId,
}: UseIcebreakerRealtimeProps): UseIcebreakerRealtimeReturn {
  const [session, setSession] = useState<IcebreakerSession | null>(null);
  const [players, setPlayers] = useState<IcebreakerPlayer[]>([]);
  const [scores, setScores] = useState<IcebreakerScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getClient();

  // Fetch current session and players (SELECT is allowed by RLS)
  const fetchData = useCallback(async (sessionId: string) => {
    try {
      const [sessionResult, playersResult] = await Promise.all([
        supabase
          .from('icebreaker_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('icebreaker_players')
          .select('*')
          .eq('session_id', sessionId),
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (playersResult.error) throw playersResult.error;

      setSession(sessionResult.data as IcebreakerSession);
      setPlayers(playersResult.data as IcebreakerPlayer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    }
  }, [supabase]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!session?.id) return;

    const newChannel = supabase
      .channel(`icebreaker:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'icebreaker_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as IcebreakerSession;
            // If session is finished, clear it so users can start a new game
            if (updated.status === 'finished') {
              setSession(null);
              setPlayers([]);
            } else {
              setSession(updated);
            }
          } else if (payload.eventType === 'DELETE') {
            setSession(null);
            setPlayers([]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'icebreaker_players',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as IcebreakerPlayer]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as IcebreakerPlayer) : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [session?.id, supabase]);

  // Subscribe to scores realtime changes (match-level, stable for entire component lifetime)
  useEffect(() => {
    // Fetch initial scores
    const fetchScores = async () => {
      const { data } = await supabase
        .from('icebreaker_scores')
        .select('*')
        .eq('match_id', matchId);
      if (data) {
        setScores(data as IcebreakerScore[]);
      }
    };
    fetchScores();

    const scoresChannel = supabase
      .channel(`icebreaker-scores:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'icebreaker_scores',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setScores((prev) => [...prev, payload.new as IcebreakerScore]);
          } else if (payload.eventType === 'UPDATE') {
            setScores((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as IcebreakerScore) : s
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scoresChannel);
    };
  }, [matchId, supabase]);

  // Initial fetch for active session and auto-join (SELECT is allowed by RLS)
  useEffect(() => {
    const fetchActiveSession = async () => {
      setIsLoading(true);
      try {
        const { data: sessions, error: sessionsError } = await supabase
          .from('icebreaker_sessions')
          .select('*')
          .eq('match_id', matchId)
          .in('status', ['waiting', 'playing'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionsError) throw sessionsError;

        if (sessions && sessions.length > 0) {
          const activeSession = sessions[0] as IcebreakerSession;
          setSession(activeSession);

          // Check if user is already a player (joined previously)
          const { data: existingPlayer } = await supabase
            .from('icebreaker_players')
            .select('id')
            .eq('session_id', activeSession.id)
            .eq('user_id', userId)
            .single();

          // Only fetch player data if already joined (no auto-join)
          if (existingPlayer) {
            await fetchData(activeSession.id);
          }
          // If not joined, just show the session info so user can choose to join
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'セッションの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveSession();
  }, [matchId, userId, fetchData, supabase]);

  // Create a new game session (via API)
  const createSession = useCallback(
    async (gameType: string): Promise<IcebreakerSession | null> => {
      try {
        const res = await fetch('/api/icebreaker/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_id: matchId, game_type: gameType }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'セッション作成に失敗しました');
        }

        const { session: newSession } = await res.json();
        setSession(newSession);
        await fetchData(newSession.id);
        return newSession;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'セッション作成に失敗しました');
        return null;
      }
    },
    [matchId, fetchData]
  );

  // Join an existing session (via API)
  const joinSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        const res = await fetch('/api/icebreaker/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '参加に失敗しました');
        }

        await fetchData(sessionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : '参加に失敗しました');
      }
    },
    [fetchData]
  );

  // Leave current session (via API)
  const leaveSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      const res = await fetch(`/api/icebreaker/player?session_id=${session.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '退出に失敗しました');
      }

      // Clear local state - user is no longer in the session
      setPlayers((prev) => prev.filter((p) => p.user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '退出に失敗しました');
    }
  }, [session, userId]);

  // Update session data (via API)
  const updateSession = useCallback(
    async (updates: Partial<IcebreakerSession>): Promise<void> => {
      if (!session) return;

      try {
        const res = await fetch('/api/icebreaker/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: session.id, updates }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '更新に失敗しました');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      }
    },
    [session]
  );

  // Update player data (via API)
  const updatePlayerData = useCallback(
    async (data: Partial<PlayerData>): Promise<void> => {
      if (!session) return;

      try {
        const res = await fetch('/api/icebreaker/player', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            updates: { player_data: data },
          }),
        });

        if (!res.ok) {
          const resData = await res.json();
          throw new Error(resData.error || '更新に失敗しました');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      }
    },
    [session]
  );

  // Set ready status (via API)
  const setReady = useCallback(
    async (ready: boolean): Promise<void> => {
      if (!session) return;

      try {
        const res = await fetch('/api/icebreaker/player', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            updates: { is_ready: ready },
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '更新に失敗しました');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      }
    },
    [session]
  );

  // End session (via API)
  const endSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      const res = await fetch(`/api/icebreaker/session?session_id=${session.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '終了に失敗しました');
      }

      setSession(null);
      setPlayers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '終了に失敗しました');
    }
  }, [session]);

  // Award points (via API)
  const awardPoints = useCallback(
    async (awards: { user_id: string; points: number }[]): Promise<void> => {
      if (awards.length === 0) return;

      try {
        const res = await fetch('/api/icebreaker/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_id: matchId, awards }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'ポイント付与に失敗しました');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ポイント付与に失敗しました');
      }
    },
    [matchId]
  );

  return {
    session,
    players,
    scores,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    updateSession,
    updatePlayerData,
    setReady,
    endSession,
    awardPoints,
  };
}
