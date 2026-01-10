import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Gestor {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useGestores() {
  return useQuery({
    queryKey: ['gestores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Gestor[];
    },
  });
}

export function useGestor(id: string | undefined) {
  return useQuery({
    queryKey: ['gestores', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('gestores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Gestor;
    },
    enabled: !!id,
  });
}

export function useCreateGestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gestor: Omit<Gestor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('gestores')
        .insert(gestor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestores'] });
      toast({
        title: 'Gestor cadastrado',
        description: 'O gestor foi cadastrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...gestor }: Partial<Gestor> & { id: string }) => {
      const { data, error } = await supabase
        .from('gestores')
        .update(gestor)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gestores'] });
      queryClient.invalidateQueries({ queryKey: ['gestores', variables.id] });
      toast({
        title: 'Gestor atualizado',
        description: 'O gestor foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gestores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestores'] });
      toast({
        title: 'Gestor excluído',
        description: 'O gestor foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
