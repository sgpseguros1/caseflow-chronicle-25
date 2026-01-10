import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LancamentoFinanceiro {
  id: string;
  cliente_id: string;
  protocolo_id: string | null;
  tipo_receita: 'seguro_vida' | 'judicial' | 'danos' | 'dpvat' | 'previdenciario' | 'outros';
  tipo_receita_justificativa: string | null;
  valor_bruto: number;
  valor_pago: number;
  valor_pendente: number;
  forma_pagamento: string | null;
  data_recebimento: string | null;
  data_vencimento: string | null;
  status: 'recebido' | 'parcial' | 'em_aberto' | 'em_atraso' | 'negociado' | 'cancelado';
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cliente?: { id: string; name: string; code: number };
  protocolo?: { id: string; codigo: number; tipo: string } | null;
}

export interface FechamentoMensal {
  id: string;
  ano: number;
  mes: number;
  total_recebido: number;
  total_a_receber: number;
  total_em_atraso: number;
  numero_lancamentos: number;
  resumo_por_tipo: Record<string, number> | null;
  fechado_por: string | null;
  fechado_em: string;
  observacoes: string | null;
}

export interface AuditoriaFinanceira {
  id: string;
  lancamento_id: string | null;
  acao: 'criacao' | 'edicao' | 'exclusao' | 'fechamento_mes';
  usuario_id: string | null;
  valor_anterior: number | null;
  valor_novo: number | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  descricao: string | null;
  created_at: string;
}

export interface FinanceiroStats {
  totalRecebido: number;
  totalAReceber: number;
  totalEmAtraso: number;
  receitaMedia: number;
  numeroLancamentos: number;
  crescimentoPercentual: number;
  porTipo: { tipo: string; valor: number; percentual: number }[];
  porDia: { data: string; valor: number }[];
  porCliente: { clienteId: string; clienteNome: string; valor: number }[];
  contasAReceber: LancamentoFinanceiro[];
}

const TIPO_RECEITA_LABELS: Record<string, string> = {
  seguro_vida: 'Seguro de Vida',
  judicial: 'Judicial',
  danos: 'Danos',
  dpvat: 'DPVAT',
  previdenciario: 'Previdenciário',
  outros: 'Outros'
};

export function useLancamentosFinanceiros(periodo?: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['lancamentos-financeiros', periodo],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          cliente:clients(id, name, code),
          protocolo:protocolos(id, codigo, tipo)
        `)
        .order('created_at', { ascending: false });

      if (periodo) {
        query = query
          .gte('created_at', periodo.inicio)
          .lte('created_at', periodo.fim);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LancamentoFinanceiro[];
    }
  });
}

export function useLancamentoFinanceiro(id: string | undefined) {
  return useQuery({
    queryKey: ['lancamento-financeiro', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          cliente:clients(id, name, code),
          protocolo:protocolos(id, codigo, tipo)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as LancamentoFinanceiro;
    },
    enabled: !!id
  });
}

export function useCreateLancamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (lancamento: Omit<LancamentoFinanceiro, 'id' | 'valor_pendente' | 'created_at' | 'updated_at' | 'cliente' | 'protocolo'>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .insert({ ...lancamento, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast({ title: 'Lançamento criado!', description: 'O lançamento foi registrado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar lançamento', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdateLancamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LancamentoFinanceiro> & { id: string }) => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast({ title: 'Lançamento atualizado!', description: 'As alterações foram salvas.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    }
  });
}

export function useDeleteLancamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast({ title: 'Lançamento excluído', description: 'O registro foi removido.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  });
}

export function useFinanceiroStats(periodo: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['financeiro-stats', periodo],
    queryFn: async () => {
      // Dados do período atual
      const { data: lancamentos, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          cliente:clients(id, name, code)
        `)
        .gte('created_at', periodo.inicio)
        .lte('created_at', periodo.fim);

      if (error) throw error;

      // Dados do período anterior para comparação
      const inicioAnterior = new Date(periodo.inicio);
      const fimAnterior = new Date(periodo.fim);
      const diff = fimAnterior.getTime() - inicioAnterior.getTime();
      inicioAnterior.setTime(inicioAnterior.getTime() - diff);
      fimAnterior.setTime(fimAnterior.getTime() - diff);

      const { data: lancamentosAnteriores } = await supabase
        .from('lancamentos_financeiros')
        .select('valor_pago')
        .gte('created_at', inicioAnterior.toISOString())
        .lte('created_at', fimAnterior.toISOString());

      // Cálculos
      const totalRecebido = lancamentos?.reduce((sum, l) => sum + Number(l.valor_pago || 0), 0) || 0;
      const totalAReceber = lancamentos?.reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;
      const totalEmAtraso = lancamentos?.filter(l => l.status === 'em_atraso').reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;

      const totalAnterior = lancamentosAnteriores?.reduce((sum, l) => sum + Number(l.valor_pago || 0), 0) || 0;
      const crescimentoPercentual = totalAnterior > 0 ? ((totalRecebido - totalAnterior) / totalAnterior) * 100 : 0;

      // Por tipo
      const porTipoMap: Record<string, number> = {};
      lancamentos?.forEach(l => {
        const tipo = l.tipo_receita;
        porTipoMap[tipo] = (porTipoMap[tipo] || 0) + Number(l.valor_pago || 0);
      });
      const porTipo = Object.entries(porTipoMap).map(([tipo, valor]) => ({
        tipo: TIPO_RECEITA_LABELS[tipo] || tipo,
        valor,
        percentual: totalRecebido > 0 ? (valor / totalRecebido) * 100 : 0
      })).sort((a, b) => b.valor - a.valor);

      // Por dia
      const porDiaMap: Record<string, number> = {};
      lancamentos?.forEach(l => {
        if (l.data_recebimento) {
          porDiaMap[l.data_recebimento] = (porDiaMap[l.data_recebimento] || 0) + Number(l.valor_pago || 0);
        }
      });
      const porDia = Object.entries(porDiaMap)
        .map(([data, valor]) => ({ data, valor }))
        .sort((a, b) => a.data.localeCompare(b.data));

      // Por cliente
      const porClienteMap: Record<string, { nome: string; valor: number }> = {};
      lancamentos?.forEach(l => {
        if (l.cliente) {
          const key = l.cliente.id;
          if (!porClienteMap[key]) {
            porClienteMap[key] = { nome: l.cliente.name, valor: 0 };
          }
          porClienteMap[key].valor += Number(l.valor_pago || 0);
        }
      });
      const porCliente = Object.entries(porClienteMap)
        .map(([clienteId, data]) => ({ clienteId, clienteNome: data.nome, valor: data.valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      // Contas a receber
      const contasAReceber = lancamentos?.filter(l => 
        l.status === 'em_aberto' || l.status === 'em_atraso' || l.status === 'parcial'
      ) || [];

      const numMeses = Math.max(1, Math.ceil(diff / (30 * 24 * 60 * 60 * 1000)));

      return {
        totalRecebido,
        totalAReceber,
        totalEmAtraso,
        receitaMedia: totalRecebido / numMeses,
        numeroLancamentos: lancamentos?.length || 0,
        crescimentoPercentual,
        porTipo,
        porDia,
        porCliente,
        contasAReceber: contasAReceber as LancamentoFinanceiro[]
      } as FinanceiroStats;
    },
    refetchInterval: 30000
  });
}

export function useFechamentosMensais() {
  return useQuery({
    queryKey: ['fechamentos-mensais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      if (error) throw error;
      return data as FechamentoMensal[];
    }
  });
}

export function useFecharMes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ano, mes, observacoes }: { ano: number; mes: number; observacoes?: string }) => {
      // Calcular totais do mês
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

      const { data: lancamentos, error: fetchError } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .gte('created_at', inicioMes)
        .lte('created_at', `${fimMes}T23:59:59`);

      if (fetchError) throw fetchError;

      const totalRecebido = lancamentos?.reduce((sum, l) => sum + Number(l.valor_pago || 0), 0) || 0;
      const totalAReceber = lancamentos?.reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;
      const totalEmAtraso = lancamentos?.filter(l => l.status === 'em_atraso').reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;

      const resumoPorTipo: Record<string, number> = {};
      lancamentos?.forEach(l => {
        resumoPorTipo[l.tipo_receita] = (resumoPorTipo[l.tipo_receita] || 0) + Number(l.valor_pago || 0);
      });

      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .insert({
          ano,
          mes,
          total_recebido: totalRecebido,
          total_a_receber: totalAReceber,
          total_em_atraso: totalEmAtraso,
          numero_lancamentos: lancamentos?.length || 0,
          resumo_por_tipo: resumoPorTipo,
          fechado_por: user.user?.id,
          observacoes
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_financeira').insert({
        acao: 'fechamento_mes',
        usuario_id: user.user?.id,
        descricao: `Fechamento do mês ${mes}/${ano}`,
        dados_novos: { ano, mes, total_recebido: totalRecebido }
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fechamentos-mensais'] });
      toast({ 
        title: 'Mês fechado!', 
        description: `O fechamento de ${variables.mes}/${variables.ano} foi realizado.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao fechar mês', description: error.message, variant: 'destructive' });
    }
  });
}

export function useAuditoriaFinanceira() {
  return useQuery({
    queryKey: ['auditoria-financeira'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditoria_financeira')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AuditoriaFinanceira[];
    }
  });
}
