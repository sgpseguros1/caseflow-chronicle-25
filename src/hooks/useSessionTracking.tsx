import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutos em milissegundos
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Verificar a cada 1 minuto

export interface UserSession {
  id: string;
  user_id: string;
  login_at: string;
  logout_at: string | null;
  last_activity_at: string;
  duration_seconds: number | null;
  logout_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined data
  profile?: {
    name: string;
    email: string;
  };
}

// Hook para registrar sessão e auto-logout
export function useSessionTracking() {
  const { user, signOut } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Criar sessão ao fazer login
  const createSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('user_sessions')
        .insert({
          user_id: user.id,
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (error) throw error;
      sessionIdRef.current = data.id;
      lastActivityRef.current = Date.now();
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    }
  }, [user]);

  // Atualizar última atividade
  const updateActivity = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await (supabase as any)
        .from('user_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionIdRef.current);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
    }
  }, []);

  // Finalizar sessão
  const endSession = useCallback(async (reason: 'manual' | 'inactivity' | 'session_expired') => {
    if (!sessionIdRef.current) return;

    try {
      const { data: session } = await (supabase as any)
        .from('user_sessions')
        .select('login_at')
        .eq('id', sessionIdRef.current)
        .single();

      if (session) {
        const loginAt = new Date(session.login_at);
        const logoutAt = new Date();
        const durationSeconds = Math.floor((logoutAt.getTime() - loginAt.getTime()) / 1000);

        await (supabase as any)
          .from('user_sessions')
          .update({
            logout_at: logoutAt.toISOString(),
            duration_seconds: durationSeconds,
            logout_reason: reason,
          })
          .eq('id', sessionIdRef.current);
      }

      sessionIdRef.current = null;
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
    }
  }, []);

  // Verificar inatividade e fazer logout automático
  const checkInactivity = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      await endSession('inactivity');
      signOut();
      window.location.href = '/login?reason=inactivity';
    } else {
      updateActivity();
    }
  }, [endSession, signOut, updateActivity]);

  // Resetar timer de atividade
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Listeners de atividade do usuário
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetActivityTimer, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [user, resetActivityTimer]);

  // Criar sessão e iniciar verificação de inatividade
  useEffect(() => {
    if (!user) {
      // Limpar interval se o usuário sair
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
      return;
    }

    // Criar sessão apenas se não existir
    if (!sessionIdRef.current) {
      createSession();
    }

    // Verificar inatividade periodicamente
    activityIntervalRef.current = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL);

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [user, createSession, checkInactivity]);

  // Finalizar sessão ao sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Usar sendBeacon para garantir que a requisição seja enviada
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?id=eq.${sessionIdRef.current}`,
          JSON.stringify({
            logout_at: new Date().toISOString(),
            logout_reason: 'session_expired'
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    endSession,
    resetActivityTimer,
    timeUntilLogout: INACTIVITY_TIMEOUT - (Date.now() - lastActivityRef.current),
  };
}

// Hook para buscar todas as sessões (apenas admin)
export function useAllUserSessions(dateFilter?: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['user-sessions', dateFilter?.start?.toISOString(), dateFilter?.end?.toISOString()],
    queryFn: async () => {
      let query = (supabase as any)
        .from('user_sessions')
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .order('login_at', { ascending: false });

      if (dateFilter) {
        query = query
          .gte('login_at', dateFilter.start.toISOString())
          .lte('login_at', dateFilter.end.toISOString());
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return data as (UserSession & { profile: { name: string; email: string } | null })[];
    },
    refetchInterval: 30000,
  });
}

// Hook para estatísticas de sessão por usuário
export function useUserSessionStats() {
  return useQuery({
    queryKey: ['user-session-stats'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const { data: sessions, error } = await (supabase as any)
        .from('user_sessions')
        .select(`
          user_id,
          login_at,
          logout_at,
          duration_seconds,
          logout_reason,
          profile:profiles(name, email)
        `)
        .gte('login_at', inicioMes.toISOString())
        .order('login_at', { ascending: false });

      if (error) throw error;

      // Agrupar por usuário
      const userStats = new Map<string, {
        user_id: string;
        nome: string;
        email: string;
        total_logins: number;
        total_seconds: number;
        avg_session_minutes: number;
        last_login: string;
        logout_by_inactivity: number;
      }>();

      (sessions || []).forEach((session: any) => {
        const userId = session.user_id;
        const profile = session.profile;
        
        const existing = userStats.get(userId) || {
          user_id: userId,
          nome: profile?.name || 'Usuário',
          email: profile?.email || '',
          total_logins: 0,
          total_seconds: 0,
          avg_session_minutes: 0,
          last_login: '',
          logout_by_inactivity: 0,
        };

        existing.total_logins++;
        existing.total_seconds += session.duration_seconds || 0;
        
        if (!existing.last_login || session.login_at > existing.last_login) {
          existing.last_login = session.login_at;
        }

        if (session.logout_reason === 'inactivity') {
          existing.logout_by_inactivity++;
        }

        existing.avg_session_minutes = Math.round((existing.total_seconds / existing.total_logins) / 60);

        userStats.set(userId, existing);
      });

      return Array.from(userStats.values()).sort((a, b) => b.total_seconds - a.total_seconds);
    },
    refetchInterval: 60000,
  });
}
