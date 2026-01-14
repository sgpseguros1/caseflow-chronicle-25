import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OABMonitorada {
  id: string;
  numero_oab: string;
  uf: string;
  nome_advogado: string | null;
  ativo: boolean;
  ultima_sincronizacao: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
}

export function useOABMonitoradas() {
  return useQuery({
    queryKey: ['oab-monitoradas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oab_monitoradas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OABMonitorada[];
    },
  });
}

export function useCreateOABMonitorada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (oab: { numero_oab: string; uf: string; nome_advogado?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('oab_monitoradas')
        .insert({ ...oab, criado_por: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oab-monitoradas'] });
      toast({ title: 'OAB adicionada para monitoramento' });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: 'Esta OAB já está sendo monitorada', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao adicionar OAB', description: error.message, variant: 'destructive' });
      }
    },
  });
}

export function useUpdateOABMonitorada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OABMonitorada> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('oab_monitoradas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oab-monitoradas'] });
      toast({ title: 'OAB atualizada' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}

export function useDeleteOABMonitorada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('oab_monitoradas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oab-monitoradas'] });
      toast({ title: 'OAB removida do monitoramento' });
    },
    onError: (error) => toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' }),
  });
}
