import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface MensagemChat {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
  // Joined
  remetente?: { name: string; email: string };
  destinatario?: { name: string; email: string };
}

export interface Conversa {
  usuarioId: string;
  nome: string;
  email: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  naoLidas: number;
}

export function useConversas() {
  return useQuery({
    queryKey: ['conversas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar todas as mensagens onde sou remetente ou destinatário
      const { data: mensagens, error } = await supabase
        .from('mensagens_chat')
        .select('*')
        .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar profiles para cada usuário único
      const usuariosIds = new Set<string>();
      for (const msg of mensagens || []) {
        usuariosIds.add(msg.remetente_id);
        usuariosIds.add(msg.destinatario_id);
      }
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', Array.from(usuariosIds));
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Agrupar por usuário (outro participante da conversa)
      const conversasMap = new Map<string, Conversa>();
      
      for (const msg of mensagens || []) {
        const outroId = msg.remetente_id === user.id ? msg.destinatario_id : msg.remetente_id;
        const outroProfile = profilesMap.get(outroId);

        if (!conversasMap.has(outroId)) {
          conversasMap.set(outroId, {
            usuarioId: outroId,
            nome: outroProfile?.name || 'Usuário',
            email: outroProfile?.email || '',
            ultimaMensagem: msg.conteudo,
            dataUltimaMensagem: msg.created_at,
            naoLidas: 0,
          });
        }

        // Contar não lidas (onde sou destinatário e não li)
        if (msg.destinatario_id === user.id && !msg.lida) {
          const conversa = conversasMap.get(outroId)!;
          conversa.naoLidas++;
        }
      }

      return Array.from(conversasMap.values());
    },
  });
}

export function useMensagensConversa(outroUsuarioId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mensagens-conversa', outroUsuarioId],
    queryFn: async () => {
      if (!outroUsuarioId) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('mensagens_chat')
        .select('*')
        .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${outroUsuarioId}),and(remetente_id.eq.${outroUsuarioId},destinatario_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Buscar dados dos usuários
      const mensagensCompletas = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: remetente } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', msg.remetente_id)
            .single();
          
          const { data: destinatario } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', msg.destinatario_id)
            .single();
          
          return { ...msg, remetente, destinatario } as MensagemChat;
        })
      );
      
      return mensagensCompletas;
    },
    enabled: !!outroUsuarioId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!outroUsuarioId) return;

    const channel = supabase
      .channel(`chat-${outroUsuarioId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mensagens-conversa', outroUsuarioId] });
          queryClient.invalidateQueries({ queryKey: ['conversas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [outroUsuarioId, queryClient]);

  return query;
}

export function useEnviarMensagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ destinatario_id, conteudo }: { destinatario_id: string; conteudo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('mensagens_chat')
        .insert({ remetente_id: user.id, destinatario_id, conteudo })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-conversa', variables.destinatario_id] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
    onError: (error) => toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' }),
  });
}

export function useMarcarMensagensLidas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (remetenteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('mensagens_chat')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq('remetente_id', remetenteId)
        .eq('destinatario_id', user.id)
        .eq('lida', false);
      if (error) throw error;
    },
    onSuccess: (_, remetenteId) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-conversa', remetenteId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
}

export function useUsuariosParaChat() {
  return useQuery({
    queryKey: ['usuarios-chat'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar profiles e funcionários
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .neq('id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true);

      if (error) throw error;
      return profiles || [];
    },
  });
}
