import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  prioridade: string | null;
  status: string;
  responsavel_id: string | null;
  cliente_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('leads').insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead criado com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao criar lead', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...lead }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase.from('leads').update(lead).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead excluído com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }),
  });
}
