import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Seguradora {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSeguradoras() {
  return useQuery({
    queryKey: ['seguradoras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('seguradoras').select('*').order('razao_social');
      if (error) throw error;
      return data as Seguradora[];
    },
  });
}

export function useSeguradora(id: string | undefined) {
  return useQuery({
    queryKey: ['seguradoras', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('seguradoras').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Seguradora;
    },
    enabled: !!id,
  });
}

export function useCreateSeguradora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (seguradora: Omit<Seguradora, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('seguradoras').insert(seguradora).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguradoras'] });
      toast({ title: 'Seguradora cadastrada com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateSeguradora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...seguradora }: Partial<Seguradora> & { id: string }) => {
      const { data, error } = await supabase.from('seguradoras').update(seguradora).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seguradoras'] });
      queryClient.invalidateQueries({ queryKey: ['seguradoras', variables.id] });
      toast({ title: 'Seguradora atualizada com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeleteSeguradora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seguradoras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguradoras'] });
      toast({ title: 'Seguradora excluída com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }),
  });
}
