import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  processo_id: string | null;
  funcionario_id: string | null;
  usuario_alvo_id: string | null;
  prioridade: string;
  status: string;
  lido_em: string | null;
  resolvido_em: string | null;
  created_at: string;
  processos?: {
    numero: string | null;
    titulo: string | null;
  } | null;
}

export function useAlertas() {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertas')
        .select('*, processos(numero, titulo)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Alerta[];
    },
  });
}

export function useAlertasPendentes() {
  return useQuery({
    queryKey: ['alertas', 'pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertas')
        .select('*, processos(numero, titulo)')
        .eq('status', 'pendente')
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Alerta[];
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}

export function useMarcarAlertaLido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alertas')
        .update({ status: 'lido', lido_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}

export function useResolverAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alertas')
        .update({ status: 'resolvido', resolvido_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      toast({ title: 'Alerta resolvido' });
    },
  });
}

export function useCriarAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alerta: Omit<Alerta, 'id' | 'created_at' | 'lido_em' | 'resolvido_em' | 'processos'>) => {
      const { data, error } = await supabase
        .from('alertas')
        .insert(alerta)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}
