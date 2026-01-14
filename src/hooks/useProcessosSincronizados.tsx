import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProcessoSincronizado {
  id: string;
  oab_id: string | null;
  numero_processo: string;
  classe_processual: string | null;
  assunto: string | null;
  tribunal: string | null;
  orgao_julgador: string | null;
  data_ajuizamento: string | null;
  ultimo_movimento: string | null;
  data_ultimo_movimento: string | null;
  situacao: string | null;
  nivel_sigilo: string;
  link_externo: string | null;
  dados_completos: any;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoProcesso {
  id: string;
  processo_id: string | null;
  data_movimento: string;
  codigo_movimento: number | null;
  descricao: string;
  complemento: string | null;
  decisao_teor: string | null;
  prazo_dias: number | null;
  prazo_fatal: string | null;
  urgente: boolean;
  lido: boolean;
  lido_por: string | null;
  lido_em: string | null;
  created_at: string;
}

export function useProcessosSincronizados(oabId?: string) {
  return useQuery({
    queryKey: ['processos-sincronizados', oabId],
    queryFn: async () => {
      let query = supabase
        .from('processos_sincronizados')
        .select('*')
        .order('data_ultimo_movimento', { ascending: false, nullsFirst: false });
      
      if (oabId) {
        query = query.eq('oab_id', oabId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProcessoSincronizado[];
    },
  });
}

export function useMovimentacoesProcesso(processoId?: string) {
  return useQuery({
    queryKey: ['movimentacoes-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('movimentacoes_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('data_movimento', { ascending: false });
      if (error) throw error;
      return data as MovimentacaoProcesso[];
    },
    enabled: !!processoId,
  });
}

export function useMovimentacoesPendentes() {
  return useQuery({
    queryKey: ['movimentacoes-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_processo')
        .select(`
          *,
          processos_sincronizados (
            numero_processo,
            tribunal
          )
        `)
        .eq('lido', false)
        .order('urgente', { ascending: false })
        .order('data_movimento', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarcarMovimentacaoLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('movimentacoes_processo')
        .update({ lido: true, lido_por: user?.id, lido_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-processo'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-pendentes'] });
    },
  });
}
