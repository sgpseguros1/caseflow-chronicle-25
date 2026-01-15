import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IAAnaliseProcesso {
  resumo_processo: string;
  fase_atual: string;
  o_que_falta_para_avancar: string;
  entendimento_ia: string;
  acao_necessaria_agora: string;
  proxima_acao_sugerida: string;
  risco_processual: 'baixo' | 'medio' | 'alto';
  impacto_financeiro: 'sem_impacto' | 'medio' | 'alto';
  depende_bau: boolean;
  depende_cliente: boolean;
  depende_pericia: boolean;
  alertas: string[];
  pontos_atencao: string[];
}

export interface IAAnaliseAndamento {
  gera_prazo: boolean;
  quem_deve_agir: string;
  acao_exigida: string;
  tipo_peca_provavel: string;
  categoria_andamento: string;
  prazo_dias_uteis: number | null;
  urgencia: string;
  explicacao_simples: string;
  acao_recomendada: string;
}

export function useAnalisarProcessoIA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ processoId }: { processoId: string }) => {
      // Buscar dados do processo
      const { data: processo, error: processoError } = await supabase
        .from('processos_judiciais')
        .select('*')
        .eq('id', processoId)
        .single();

      if (processoError) throw processoError;

      // Buscar andamentos
      const { data: andamentos } = await supabase
        .from('andamentos_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('data_andamento', { ascending: false })
        .limit(20);

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('ai-analise-andamento', {
        body: { 
          tipo: 'processo',
          processo,
          andamentos: andamentos || []
        }
      });

      if (error) throw error;
      return data.resultado as IAAnaliseProcesso;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processo-judicial', variables.processoId] });
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
      toast.success('Análise de IA concluída!');
    },
    onError: (error: Error) => {
      if (error.message.includes('429')) {
        toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (error.message.includes('402')) {
        toast.error('Créditos de IA esgotados. Entre em contato com o suporte.');
      } else {
        toast.error(`Erro na análise: ${error.message}`);
      }
    }
  });
}

export function useAnalisarAndamentoIA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ andamento }: { andamento: any }) => {
      const { data, error } = await supabase.functions.invoke('ai-analise-andamento', {
        body: { 
          tipo: 'andamento',
          andamento
        }
      });

      if (error) throw error;
      return data.resultado as IAAnaliseAndamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['andamentos-processo'] });
      queryClient.invalidateQueries({ queryKey: ['processos-judiciais'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na análise: ${error.message}`);
    }
  });
}

export function useProcessoIAHistorico(processoId: string | undefined) {
  return useQuery({
    queryKey: ['processo-ia-historico', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('processo_ia_historico')
        .select('*')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });
}

export function useAndamentosIAAnalise(processoId: string | undefined) {
  return useQuery({
    queryKey: ['andamentos-ia-analise', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('andamentos_ia_analise')
        .select('*')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });
}
