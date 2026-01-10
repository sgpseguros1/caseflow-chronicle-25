import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Perito {
  id: string;
  nome: string;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function usePeritos() {
  return useQuery({
    queryKey: ['peritos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('peritos').select('*').order('nome');
      if (error) throw error;
      return data as Perito[];
    },
  });
}

export function usePerito(id: string | undefined) {
  return useQuery({
    queryKey: ['peritos', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('peritos').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Perito;
    },
    enabled: !!id,
  });
}

export function useCreatePerito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (perito: Omit<Perito, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('peritos').insert(perito).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peritos'] });
      toast({ title: 'Perito cadastrado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdatePerito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...perito }: Partial<Perito> & { id: string }) => {
      const { data, error } = await supabase.from('peritos').update(perito).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peritos'] });
      queryClient.invalidateQueries({ queryKey: ['peritos', variables.id] });
      toast({ title: 'Perito atualizado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeletePerito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('peritos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peritos'] });
      toast({ title: 'Perito excluído com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }),
  });
}
