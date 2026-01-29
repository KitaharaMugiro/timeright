'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IcebreakerSession, IcebreakerPlayer, PlayerData } from './types';

interface UseIcebreakerRealtimeProps {
  matchId: string;
  userId: string;
}

interface UseIcebreakerRealtimeReturn {
  session: IcebreakerSession | null;
  players: IcebreakerPlayer[];
  isLoading: boolean;
  error: string | null;
  createSession: (gameType: string) => Promise<IcebreakerSession | null>;
  joinSession: (sessionId: string) => Promise<void>;
  updateSession: (updates: Partial<IcebreakerSession>) => Promise<void>;
  updatePlayerData: (data: Partial<PlayerData>) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getClient();

  // Fetch current session and players
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
            setSession(payload.new as IcebreakerSession);
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

  // Initial fetch for active session
  useEffect(() => {
    const fetchActiveSession = async () => {
      setIsLoading(true);
      try {
        // Check for existing active session
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
          await fetchData(activeSession.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'セッションの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveSession();
  }, [matchId, fetchData, supabase]);

  // Create a new game session
  const createSession = useCallback(
    async (gameType: string): Promise<IcebreakerSession | null> => {
      try {
        const { data, error: createError } = await supabase
          .from('icebreaker_sessions')
          .insert({
            match_id: matchId,
            game_type: gameType,
            host_user_id: userId,
            status: 'waiting',
            current_round: 0,
            game_data: {},
          })
          .select()
          .single();

        if (createError) throw createError;

        const newSession = data as IcebreakerSession;
        setSession(newSession);

        // Auto-join as player
        await supabase.from('icebreaker_players').insert({
          session_id: newSession.id,
          user_id: userId,
          is_ready: true,
          player_data: {},
        });

        await fetchData(newSession.id);
        return newSession;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'セッション作成に失敗しました');
        return null;
      }
    },
    [matchId, userId, supabase, fetchData]
  );

  // Join an existing session
  const joinSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        // Check if already joined
        const { data: existing } = await supabase
          .from('icebreaker_players')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .single();

        if (!existing) {
          const { error: joinError } = await supabase
            .from('icebreaker_players')
            .insert({
              session_id: sessionId,
              user_id: userId,
              is_ready: false,
              player_data: {},
            });

          if (joinError) throw joinError;
        }

        await fetchData(sessionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : '参加に失敗しました');
      }
    },
    [userId, supabase, fetchData]
  );

  // Update session data (host only)
  const updateSession = useCallback(
    async (updates: Partial<IcebreakerSession>): Promise<void> => {
      if (!session) return;

      try {
        const { error: updateError } = await supabase
          .from('icebreaker_sessions')
          .update(updates)
          .eq('id', session.id);

        if (updateError) throw updateError;
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      }
    },
    [session, supabase]
  );

  // Update player data
  const updatePlayerData = useCallback(
    async (data: Partial<PlayerData>): Promise<void> => {
      if (!session) return;

      try {
        const { data: player } = await supabase
          .from('icebreaker_players')
          .select('id, player_data')
          .eq('session_id', session.id)
          .eq('user_id', userId)
          .single();

        if (!player) return;

        const newData = { ...(player.player_data as PlayerData), ...data };

        const { error: updateError } = await supabase
          .from('icebreaker_players')
          .update({ player_data: newData })
          .eq('id', player.id);

        if (updateError) throw updateError;
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      }
    },
    [session, userId, supabase]
  );

  // Set ready status
  const setReady = useCallback(
    async (ready: boolean): Promise<void> => {
      if (!session) return;

      try {
        const { error: updateError } = await supabase
          .from('icebreaker_players')
          .update({ is_ready: ready })
          .eq('session_id', session.id)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      }
    },
    [session, userId, supabase]
  );

  return {
    session,
    players,
    isLoading,
    error,
    createSession,
    joinSession,
    updateSession,
    updatePlayerData,
    setReady,
  };
}
