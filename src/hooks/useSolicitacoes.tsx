import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Solicitacao {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  remetente_id: string;
  destinatario_id: string;
  cliente_id: string | null;
  processo_id: string | null;
  protocolo_id: string | null;
  prazo: string | null;
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  remetente?: { name: string; email: string };
  destinatario?: { name: string; email: string };
  cliente?: { name: string };
}

export function useSolicitacoesRecebidas(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['solicitacoes-recebidas', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let queryBuilder = supabase
        .from('solicitacoes')
        .select('*')
        .eq('destinatario_id', user.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'todas') {
        queryBuilder = queryBuilder.eq('status', status);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      // Buscar dados relacionados
      const solicitacoesCompletas = await Promise.all(
        (data || []).map(async (sol) => {
          let remetente = null;
          let destinatario = null;
          let cliente = null;

          if (sol.remetente_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', sol.remetente_id)
              .single();
            remetente = profileData;
          }

          if (sol.destinatario_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', sol.destinatario_id)
              .single();
            destinatario = profileData;
          }

          if (sol.cliente_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('name')
              .eq('id', sol.cliente_id)
              .single();
            cliente = clientData;
          }

          return { ...sol, remetente, destinatario, cliente } as Solicitacao;
        })
      );

      return solicitacoesCompletas;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('solicitacoes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitacoes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['solicitacoes-recebidas'] });
          queryClient.invalidateQueries({ queryKey: ['solicitacoes-enviadas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useSolicitacoesEnviadas(status?: string) {
  return useQuery({
    queryKey: ['solicitacoes-enviadas', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let queryBuilder = supabase
        .from('solicitacoes')
        .select('*')
        .eq('remetente_id', user.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'todas') {
        queryBuilder = queryBuilder.eq('status', status);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      // Buscar dados relacionados
      const solicitacoesCompletas = await Promise.all(
        (data || []).map(async (sol) => {
          let remetente = null;
          let destinatario = null;
          let cliente = null;

          if (sol.remetente_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', sol.remetente_id)
              .single();
            remetente = profileData;
          }

          if (sol.destinatario_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', sol.destinatario_id)
              .single();
            destinatario = profileData;
          }

          if (sol.cliente_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('name')
              .eq('id', sol.cliente_id)
              .single();
            cliente = clientData;
          }

          return { ...sol, remetente, destinatario, cliente } as Solicitacao;
        })
      );

      return solicitacoesCompletas;
    },
  });
}

export function useCreateSolicitacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string;
      prioridade?: string;
      destinatario_id: string;
      cliente_id?: string;
      processo_id?: string;
      protocolo_id?: string;
      prazo?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: result, error } = await supabase
        .from('solicitacoes')
        .insert({
          ...data,
          remetente_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-enviadas'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-recebidas'] });
      toast({ title: 'Solicitação enviada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar solicitação', description: error.message, variant: 'destructive' });
    },
  });
}

export function useResponderSolicitacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, resposta, status }: { id: string; resposta: string; status: string }) => {
      const { error } = await supabase
        .from('solicitacoes')
        .update({
          resposta,
          status,
          respondido_em: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-recebidas'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-enviadas'] });
      toast({ title: 'Resposta enviada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao responder', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSolicitacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Solicitacao> & { id: string }) => {
      const { error } = await supabase
        .from('solicitacoes')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-recebidas'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-enviadas'] });
      toast({ title: 'Solicitação atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUsuariosDisponiveis() {
  return useQuery({
    queryKey: ['usuarios-disponiveis'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_active', true)
        .is('deleted_at', null)
        .neq('id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}
