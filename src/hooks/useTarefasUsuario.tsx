import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface TarefaUsuario {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  tipo_solicitacao: 'cliente' | 'conversa_interna';
  enviado_por: string;
  responsavel_id: string | null;
  cliente_id: string | null;
  processo_id: string | null;
  protocolo_id: string | null;
  prazo: string | null;
  resposta: string | null;
  respondido_em: string | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  tempo_resolucao_segundos: number | null;
  atrasada: boolean;
  feedback_exibido: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: { name: string; email: string };
  responsavel?: { name: string; email: string };
  clients?: { name: string };
}

export interface TarefaMensagem {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  conteudo: string;
  created_at: string;
  profiles?: { name: string };
}

export interface MetricasUsuario {
  id: string;
  usuario_id: string;
  ano: number;
  mes: number;
  total_recebidas: number;
  total_concluidas: number;
  total_pendentes: number;
  total_urgentes: number;
  tempo_medio_resolucao_segundos: number;
  percentual_em_5_minutos: number;
  feedback_gerado: string | null;
}

export interface TarefaHistorico {
  id: string;
  tarefa_id: string;
  usuario_id: string | null;
  acao: string;
  descricao: string | null;
  created_at: string;
  profiles?: { name: string };
}

// Hook para buscar tarefas do usuário atual
export function useTarefasUsuario(status?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('tarefas-usuario-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas_rafael' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tarefas-usuario'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['tarefas-usuario', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('tarefas_rafael')
        .select('*')
        .or(`enviado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (status && status !== 'todas') {
        query = query.eq('status', status);
      }

      const { data: tarefas, error } = await query;
      if (error) throw error;

      // Buscar dados relacionados
      const tarefasCompletas = await Promise.all(
        (tarefas || []).map(async (tarefa) => {
          let profiles = null;
          let responsavel = null;
          let clients = null;

          if (tarefa.enviado_por) {
            const { data } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', tarefa.enviado_por)
              .single();
            profiles = data;
          }

          if (tarefa.responsavel_id) {
            const { data } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', tarefa.responsavel_id)
              .single();
            responsavel = data;
          }

          if (tarefa.cliente_id) {
            const { data } = await supabase
              .from('clients')
              .select('name')
              .eq('id', tarefa.cliente_id)
              .single();
            clients = data;
          }

          return { ...tarefa, profiles, responsavel, clients } as TarefaUsuario;
        })
      );

      return tarefasCompletas;
    },
  });
}

// Hook para buscar todas as tarefas (admin/gestor)
export function useTodasTarefas(status?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('todas-tarefas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas_rafael' }, () => {
        queryClient.invalidateQueries({ queryKey: ['todas-tarefas'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['todas-tarefas', status],
    queryFn: async () => {
      let query = supabase
        .from('tarefas_rafael')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'todas') {
        query = query.eq('status', status);
      }

      const { data: tarefas, error } = await query;
      if (error) throw error;

      const tarefasCompletas = await Promise.all(
        (tarefas || []).map(async (tarefa) => {
          let profiles = null;
          let responsavel = null;
          let clients = null;

          if (tarefa.enviado_por) {
            const { data } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', tarefa.enviado_por)
              .single();
            profiles = data;
          }

          if (tarefa.responsavel_id) {
            const { data } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', tarefa.responsavel_id)
              .single();
            responsavel = data;
          }

          if (tarefa.cliente_id) {
            const { data } = await supabase
              .from('clients')
              .select('name')
              .eq('id', tarefa.cliente_id)
              .single();
            clients = data;
          }

          return { ...tarefa, profiles, responsavel, clients } as TarefaUsuario;
        })
      );

      return tarefasCompletas;
    },
  });
}

// Hook para criar tarefa
export function useCreateTarefaUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tarefa: {
      titulo: string;
      descricao?: string;
      prioridade?: string;
      tipo_solicitacao: 'cliente' | 'conversa_interna';
      cliente_id?: string;
      responsavel_id?: string;
      prazo?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('tarefas_rafael')
        .insert({ 
          ...tarefa, 
          enviado_por: user.id,
          status: 'pendente'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['todas-tarefas'] });
      toast({ title: 'Tarefa criada com sucesso!' });
    },
    onError: (error) => toast({ title: 'Erro ao criar tarefa', description: error.message, variant: 'destructive' }),
  });
}

// Hook para atualizar tarefa
export function useUpdateTarefaUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TarefaUsuario> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('tarefas_rafael')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['todas-tarefas'] });
      toast({ title: 'Tarefa atualizada!' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

// Hook para iniciar tarefa (muda para em_andamento)
export function useIniciarTarefa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarefas_rafael')
        .update({ 
          status: 'em_andamento',
          iniciado_em: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['todas-tarefas'] });
      toast({ title: 'Tarefa iniciada!' });
    },
    onError: (error) => toast({ title: 'Erro ao iniciar tarefa', description: error.message, variant: 'destructive' }),
  });
}

// Hook para concluir tarefa
export function useConcluirTarefa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resposta }: { id: string; resposta?: string }) => {
      const { error } = await supabase
        .from('tarefas_rafael')
        .update({ 
          status: 'concluida',
          resposta,
          respondido_em: new Date().toISOString(),
          concluido_em: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['todas-tarefas'] });
      toast({ title: 'Tarefa concluída!' });
    },
    onError: (error) => toast({ title: 'Erro ao concluir tarefa', description: error.message, variant: 'destructive' }),
  });
}

// Hook para buscar mensagens de uma tarefa
export function useTarefaMensagens(tarefaId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tarefaId) return;
    
    const channel = supabase
      .channel(`tarefa-mensagens-${tarefaId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tarefa_mensagens',
        filter: `tarefa_id=eq.${tarefaId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tarefa-mensagens', tarefaId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tarefaId, queryClient]);

  return useQuery({
    queryKey: ['tarefa-mensagens', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];
      
      const { data, error } = await supabase
        .from('tarefa_mensagens')
        .select('*')
        .eq('tarefa_id', tarefaId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Buscar nomes dos usuários
      const mensagensCompletas = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', msg.usuario_id)
            .single();
          return { ...msg, profiles: profile } as TarefaMensagem;
        })
      );

      return mensagensCompletas;
    },
    enabled: !!tarefaId,
  });
}

// Hook para enviar mensagem na tarefa
export function useEnviarMensagemTarefa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tarefa_id, conteudo }: { tarefa_id: string; conteudo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('tarefa_mensagens')
        .insert({ tarefa_id, usuario_id: user.id, conteudo })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefa-mensagens', variables.tarefa_id] });
    },
    onError: (error) => toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' }),
  });
}

// Hook para buscar métricas do usuário
export function useMetricasUsuario(userId?: string) {
  return useQuery({
    queryKey: ['metricas-usuario', userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return null;

      const now = new Date();
      const { data, error } = await supabase
        .from('tarefas_metricas_usuario')
        .select('*')
        .eq('usuario_id', targetUserId)
        .eq('ano', now.getFullYear())
        .eq('mes', now.getMonth() + 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MetricasUsuario | null;
    },
    enabled: true,
  });
}

// Hook para calcular métricas em tempo real
export function useMetricasTempoReal(userId?: string) {
  return useQuery({
    queryKey: ['metricas-tempo-real', userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Buscar tarefas do usuário no mês
      const { data: tarefas, error } = await supabase
        .from('tarefas_rafael')
        .select('*')
        .eq('responsavel_id', targetUserId)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (error) throw error;

      const total = tarefas?.length || 0;
      const concluidas = tarefas?.filter(t => t.status === 'concluida') || [];
      const pendentes = tarefas?.filter(t => t.status === 'pendente').length || 0;
      const urgentes = tarefas?.filter(t => t.prioridade === 'urgente' && t.status !== 'concluida').length || 0;

      const temposResolucao = concluidas
        .filter(t => t.tempo_resolucao_segundos)
        .map(t => t.tempo_resolucao_segundos as number);
      
      const tempoMedio = temposResolucao.length > 0 
        ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length 
        : 0;

      const em5Min = concluidas.filter(t => t.tempo_resolucao_segundos && t.tempo_resolucao_segundos <= 300).length;
      const percentual5Min = concluidas.length > 0 ? (em5Min / concluidas.length) * 100 : 0;

      // Gerar feedback automático
      let feedback = '';
      if (total === 0) {
        feedback = 'Nenhuma tarefa atribuída este mês.';
      } else if (percentual5Min >= 80) {
        feedback = 'Excelente! Seu ritmo está ótimo. Continue assim!';
      } else if (percentual5Min >= 60) {
        feedback = 'Bom ritmo. Você pode melhorar ainda mais!';
      } else if (percentual5Min >= 40) {
        feedback = 'Seu tempo médio está alto. Você pode melhorar sua agilidade.';
      } else {
        feedback = 'Você está abaixo do seu potencial este mês. Foque em resolver tarefas mais rapidamente.';
      }

      return {
        total_recebidas: total,
        total_concluidas: concluidas.length,
        total_pendentes: pendentes,
        total_urgentes: urgentes,
        tempo_medio_resolucao_segundos: Math.round(tempoMedio),
        percentual_em_5_minutos: Math.round(percentual5Min * 100) / 100,
        feedback_gerado: feedback
      };
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

// Hook para buscar histórico de uma tarefa
export function useTarefaHistorico(tarefaId: string | undefined) {
  return useQuery({
    queryKey: ['tarefa-historico', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];
      
      const { data, error } = await supabase
        .from('tarefas_historico')
        .select('*')
        .eq('tarefa_id', tarefaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const historicoCompleto = await Promise.all(
        (data || []).map(async (item) => {
          let profiles = null;
          if (item.usuario_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', item.usuario_id)
              .single();
            profiles = profile;
          }
          return { ...item, profiles } as TarefaHistorico;
        })
      );

      return historicoCompleto;
    },
    enabled: !!tarefaId,
  });
}

// Hook para buscar usuários disponíveis
export function useUsuariosDisponiveis() {
  return useQuery({
    queryKey: ['usuarios-disponiveis'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_active', true)
        .is('deleted_at', null)
        .neq('id', user?.id || '');
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Hook para métricas de todos os usuários (admin/gestor)
export function useMetricasTodosUsuarios() {
  return useQuery({
    queryKey: ['metricas-todos-usuarios'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Buscar todas as tarefas do mês
      const { data: tarefas, error } = await supabase
        .from('tarefas_rafael')
        .select('*')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (error) throw error;

      // Buscar todos os usuários
      const { data: usuarios, error: userError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .is('deleted_at', null);

      if (userError) throw userError;

      // Calcular métricas por usuário
      const metricasPorUsuario = (usuarios || []).map(user => {
        const tarefasUsuario = tarefas?.filter(t => t.responsavel_id === user.id) || [];
        const concluidas = tarefasUsuario.filter(t => t.status === 'concluida');
        const pendentes = tarefasUsuario.filter(t => t.status === 'pendente').length;
        const urgentes = tarefasUsuario.filter(t => t.prioridade === 'urgente' && t.status !== 'concluida').length;

        const temposResolucao = concluidas
          .filter(t => t.tempo_resolucao_segundos)
          .map(t => t.tempo_resolucao_segundos as number);
        
        const tempoMedio = temposResolucao.length > 0 
          ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length 
          : 0;

        const em5Min = concluidas.filter(t => t.tempo_resolucao_segundos && t.tempo_resolucao_segundos <= 300).length;
        const percentual5Min = concluidas.length > 0 ? (em5Min / concluidas.length) * 100 : 0;

        return {
          usuario_id: user.id,
          nome: user.name,
          total_recebidas: tarefasUsuario.length,
          total_concluidas: concluidas.length,
          total_pendentes: pendentes,
          total_urgentes: urgentes,
          tempo_medio_resolucao_segundos: Math.round(tempoMedio),
          percentual_em_5_minutos: Math.round(percentual5Min * 100) / 100
        };
      }).filter(m => m.total_recebidas > 0);

      return metricasPorUsuario;
    },
  });
}
