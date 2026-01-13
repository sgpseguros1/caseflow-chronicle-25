import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Funcionario {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cargo: string;
  departamento: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export function useFuncionarios(includeDeleted = false) {
  return useQuery({
    queryKey: ['funcionarios', includeDeleted],
    queryFn: async () => {
      let query = supabase.from('funcionarios').select('*').order('nome');
      
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Funcionario[];
    },
  });
}

export function useFuncionario(id: string | undefined) {
  return useQuery({
    queryKey: ['funcionarios', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('funcionarios').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Funcionario;
    },
    enabled: !!id,
  });
}

export function useCreateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (funcionario: Omit<Funcionario, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by'>) => {
      const { data, error } = await supabase.from('funcionarios').insert(funcionario).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({ title: 'Funcionário cadastrado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...funcionario }: Partial<Funcionario> & { id: string }) => {
      const { data, error } = await supabase.from('funcionarios').update(funcionario).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios', variables.id] });
      toast({ title: 'Funcionário atualizado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeleteFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
      const { error } = await supabase
        .from('funcionarios')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          status: 'inativo'
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({ title: 'Funcionário excluído com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }),
  });
}

export function useRestoreFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios')
        .update({ 
          deleted_at: null,
          deleted_by: null,
          status: 'ativo'
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({ title: 'Funcionário restaurado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao restaurar', description: error.message, variant: 'destructive' }),
  });
}
