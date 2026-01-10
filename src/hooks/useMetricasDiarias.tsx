import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MetricaDiaria {
  id: string;
  funcionario_id: string;
  data: string;
  clientes_atendidos: number | null;
  processos_movidos: number | null;
  pastas_liberadas: number | null;
  pendencias: string | null;
  descricao: string | null;
  created_at: string;
}

export interface MetricaDiariaWithFuncionario extends MetricaDiaria {
  funcionarios: {
    nome: string;
  } | null;
}

export function useMetricasDiarias() {
  return useQuery({
    queryKey: ['metricas_diarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metricas_diarias')
        .select('*, funcionarios(nome)')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as MetricaDiariaWithFuncionario[];
    },
  });
}

export function useMetricasDiariasByFuncionario(funcionarioId: string | undefined) {
  return useQuery({
    queryKey: ['metricas_diarias', 'funcionario', funcionarioId],
    queryFn: async () => {
      if (!funcionarioId) return [];
      const { data, error } = await supabase
        .from('metricas_diarias')
        .select('*')
        .eq('funcionario_id', funcionarioId)
        .order('data', { ascending: false });
      if (error) throw error;
      return data as MetricaDiaria[];
    },
    enabled: !!funcionarioId,
  });
}

export function useCreateMetricaDiaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (metrica: Omit<MetricaDiaria, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('metricas_diarias')
        .insert(metrica)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricas_diarias'] });
      toast({ title: 'Métrica registrada com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao registrar métrica', description: error.message, variant: 'destructive' }),
  });
}

export function useUpdateMetricaDiaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...metrica }: Partial<MetricaDiaria> & { id: string }) => {
      const { data, error } = await supabase
        .from('metricas_diarias')
        .update(metrica)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricas_diarias'] });
      toast({ title: 'Métrica atualizada com sucesso' });
    },
    onError: (error) => toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }),
  });
}
