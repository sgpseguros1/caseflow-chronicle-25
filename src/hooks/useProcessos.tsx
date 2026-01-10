import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Processo {
  id: string;
  numero: string | null;
  tipo: string;
  titulo: string | null;
  cliente_id: string | null;
  advogado_id: string | null;
  seguradora_id: string | null;
  responsavel_id: string | null;
  status: string;
  valor_estimado: number | null;
  valor_final: number | null;
  honorarios: number | null;
  data_abertura: string | null;
  data_conclusao: string | null;
  observacoes: string | null;
  etiquetas: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useProcessos() {
  return useQuery({
    queryKey: ['processos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('processos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Processo[];
    },
  });
}

export function useProcesso(id: string | undefined) {
  return useQuery({
    queryKey: ['processos', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('processos').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Processo;
    },
    enabled: !!id,
  });
}

export function useCreateProcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (processo: Omit<Processo, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('processos').insert(processo).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      toast({ title: 'Processo criado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao criar processo', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateProcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...processo }: Partial<Processo> & { id: string }) => {
      const { data, error } = await supabase.from('processos').update(processo).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      queryClient.invalidateQueries({ queryKey: ['processos', variables.id] });
      toast({ title: 'Processo atualizado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeleteProcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('processos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      toast({ title: 'Processo excluído com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }),
  });
}
