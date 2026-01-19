import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AtribuicaoLog {
  id: string;
  protocolo_id: string;
  responsavel_anterior_id: string | null;
  responsavel_novo_id: string | null;
  motivo: string;
  usuario_ultima_interacao: string | null;
  alerta_id: string | null;
  created_at: string;
  protocolo?: {
    codigo: number;
    tipo: string;
  };
  responsavel_novo?: {
    nome: string;
  };
}

export interface AlertaCritico {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  status: string;
  protocolo_id: string | null;
  funcionario_id: string | null;
  usuario_alvo_id: string | null;
  atribuicao_automatica: boolean | null;
  responsavel_atribuido_id: string | null;
  created_at: string;
  lido_em: string | null;
  resolvido_em: string | null;
  protocolo?: {
    codigo: number;
    tipo: string;
    cliente: {
      name: string;
    };
  };
  funcionario?: {
    nome: string;
  };
}

// Hook para executar atribuição automática
export function useExecutarAtribuicaoAutomatica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { enviar_alerta?: boolean; dias_critico?: number }) => {
      const { data, error } = await supabase.functions.invoke('auto-assign-responsavel', {
        body: params || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['protocolos'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['atribuicao-logs'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-criticos-responsavel'] });
      
      toast({ 
        title: 'Atribuição Automática Concluída',
        description: `${data.atribuicoes_realizadas} responsáveis atribuídos, ${data.alertas_criados} alertas criados`,
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro na Atribuição Automática', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Hook para buscar logs de atribuição automática
export function useAtribuicaoLogs(limit = 50) {
  return useQuery({
    queryKey: ['atribuicao-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atribuicao_automatica_log')
        .select(`
          *,
          protocolo:protocolos(codigo, tipo),
          responsavel_novo:funcionarios!atribuicao_automatica_log_responsavel_novo_id_fkey(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AtribuicaoLog[];
    },
  });
}

// Hook para buscar alertas críticos relacionados a responsáveis
export function useAlertasCriticosResponsavel(funcionarioId?: string) {
  return useQuery({
    queryKey: ['alertas-criticos-responsavel', funcionarioId],
    queryFn: async () => {
      let query = supabase
        .from('alertas')
        .select(`
          *,
          protocolo:protocolos(
            codigo, 
            tipo,
            cliente:clients(name)
          ),
          funcionario:funcionarios!alertas_funcionario_id_fkey(nome)
        `)
        .in('tipo', ['atribuicao_automatica', 'sem_responsavel'])
        .eq('status', 'pendente')
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (funcionarioId) {
        query = query.eq('funcionario_id', funcionarioId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AlertaCritico[];
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}

// Hook para buscar alertas do usuário logado
export function useMeusAlertasCriticos() {
  return useQuery({
    queryKey: ['meus-alertas-criticos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('alertas')
        .select(`
          *,
          protocolo:protocolos(
            codigo, 
            tipo,
            cliente:clients(name)
          )
        `)
        .or(`usuario_alvo_id.eq.${user.id},atribuicao_automatica.eq.true`)
        .eq('status', 'pendente')
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AlertaCritico[];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}

// Hook para marcar alerta como lido
export function useMarcarAlertaLido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertaId: string) => {
      const { error } = await supabase
        .from('alertas')
        .update({ 
          status: 'lido',
          lido_em: new Date().toISOString() 
        })
        .eq('id', alertaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-criticos-responsavel'] });
      queryClient.invalidateQueries({ queryKey: ['meus-alertas-criticos'] });
    },
  });
}

// Hook para resolver alerta
export function useResolverAlertaCritico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertaId, observacao }: { alertaId: string; observacao?: string }) => {
      const { error } = await supabase
        .from('alertas')
        .update({ 
          status: 'resolvido',
          resolvido_em: new Date().toISOString(),
          descricao: observacao 
            ? `${(await supabase.from('alertas').select('descricao').eq('id', alertaId).single()).data?.descricao || ''}\n\n[RESOLVIDO] ${observacao}`
            : undefined
        })
        .eq('id', alertaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-criticos-responsavel'] });
      queryClient.invalidateQueries({ queryKey: ['meus-alertas-criticos'] });
      toast({ title: 'Alerta resolvido' });
    },
  });
}

// Hook para contar alertas pendentes do usuário
export function useContadorAlertasPendentes() {
  return useQuery({
    queryKey: ['contador-alertas-pendentes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .or(`usuario_alvo_id.eq.${user.id}`)
        .eq('status', 'pendente');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
}
