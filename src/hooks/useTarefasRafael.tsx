import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TarefaRafael {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  enviado_por: string;
  cliente_id: string | null;
  processo_id: string | null;
  protocolo_id: string | null;
  prazo: string | null;
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: { name: string; email: string };
  clients?: { name: string };
}

export function useTarefasRafael(status?: string) {
  return useQuery({
    queryKey: ['tarefas-rafael', status],
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
      
      // Buscar dados relacionados
      const tarefasCompletas = await Promise.all(
        (tarefas || []).map(async (tarefa) => {
          let profiles = null;
          let clients = null;
          
          if (tarefa.enviado_por) {
            const { data } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', tarefa.enviado_por)
              .single();
            profiles = data;
          }
          
          if (tarefa.cliente_id) {
            const { data } = await supabase
              .from('clients')
              .select('name')
              .eq('id', tarefa.cliente_id)
              .single();
            clients = data;
          }
          
          return { ...tarefa, profiles, clients } as TarefaRafael;
        })
      );
      
      return tarefasCompletas;
    },
  });
}

export function useCreateTarefaRafael() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tarefa: {
      titulo: string;
      descricao?: string;
      prioridade?: string;
      cliente_id?: string;
      processo_id?: string;
      protocolo_id?: string;
      prazo?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('tarefas_rafael')
        .insert({ ...tarefa, enviado_por: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-rafael'] });
      toast({ title: 'Tarefa enviada para Rafael' });
    },
    onError: (error) => toast({ title: 'Erro ao enviar tarefa', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateTarefaRafael() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TarefaRafael> & { id: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['tarefas-rafael'] });
      toast({ title: 'Tarefa atualizada' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useResponderTarefa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resposta, status }: { id: string; resposta: string; status: string }) => {
      const { error } = await supabase
        .from('tarefas_rafael')
        .update({ 
          resposta, 
          status, 
          respondido_em: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-rafael'] });
      toast({ title: 'Resposta enviada' });
    },
    onError: (error) => toast({ title: 'Erro ao responder', description: error.message, variant: 'destructive' }),
  });
}
