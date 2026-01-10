import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Advogado {
  id: string;
  nome: string;
  oab: string;
  uf: string;
  cidade: string | null;
  situacao_oab: string | null;
  especialidades: string[] | null;
  telefone: string | null;
  email: string | null;
  status: string;
  verificado_em: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdvogados() {
  return useQuery({
    queryKey: ['advogados'],
    queryFn: async () => {
      const { data, error } = await supabase.from('advogados').select('*').order('nome');
      if (error) throw error;
      return data as Advogado[];
    },
  });
}

export function useAdvogado(id: string | undefined) {
  return useQuery({
    queryKey: ['advogados', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('advogados').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Advogado;
    },
    enabled: !!id,
  });
}

export function useCreateAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (advogado: Omit<Advogado, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('advogados').insert(advogado).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advogados'] });
      toast({ title: 'Advogado cadastrado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...advogado }: Partial<Advogado> & { id: string }) => {
      const { data, error } = await supabase.from('advogados').update(advogado).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advogados'] });
      queryClient.invalidateQueries({ queryKey: ['advogados', variables.id] });
      toast({ title: 'Advogado atualizado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeleteAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('advogados').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advogados'] });
      toast({ title: 'Advogado excluído com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }),
  });
}
