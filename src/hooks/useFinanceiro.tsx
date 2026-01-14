import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface LancamentoFinanceiro {
  id: string;
  cliente_id: string;
  protocolo_id: string | null;
  tipo_receita: string;
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
  // Campos adicionais
  seguradora_id?: string | null;
  processo_id?: string | null;
  percentual_honorarios?: number | null;
  despesas_externas?: number | null;
  valor_honorarios?: number | null;
  valor_liquido?: number | null;
  cliente?: { id: string; name: string; code: number };
  protocolo?: { id: string; codigo: number; tipo: string } | null;
  seguradora?: { id: string; nome: string } | null;
  processo?: { id: string; numero: string } | null;
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
  contasEmAtraso: LancamentoFinanceiro[];
  lancamentosPorStatus: { status: string; quantidade: number }[];
}

export const TIPO_RECEITA_LABELS: Record<string, string> = {
  seguro_vida: 'Seguro de Vida',
  auxilio_acidente: 'Auxílio-Acidente',
  inss: 'INSS',
  judicial: 'Judicial',
  dpvat: 'Diferença DPVAT',
  trabalhista: 'Ação Trabalhista',
  auxilio_doenca: 'Auxílio-Doença',
  previdenciario: 'Previdenciário',
  danos: 'Danos',
  outros: 'Outros'
};

export const TIPO_RECEITA_OPTIONS = [
  { value: 'seguro_vida', label: 'Seguro de Vida' },
  { value: 'auxilio_acidente', label: 'Auxílio-Acidente' },
  { value: 'inss', label: 'INSS' },
  { value: 'judicial', label: 'Judicial' },
  { value: 'dpvat', label: 'Diferença DPVAT' },
  { value: 'trabalhista', label: 'Ação Trabalhista' },
  { value: 'auxilio_doenca', label: 'Auxílio-Doença' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'danos', label: 'Danos' },
  { value: 'outros', label: 'Outros' }
];

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
    mutationFn: async (lancamento: Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'protocolo' | 'seguradora' | 'processo'>) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Calcular valor pendente
      const valorPendente = (lancamento.valor_bruto || 0) - (lancamento.valor_pago || 0);
      
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .insert({ 
          ...lancamento, 
          valor_pendente: valorPendente,
          created_by: user.user?.id 
        })
        .select()
        .single();
      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_financeira').insert({
        lancamento_id: data.id,
        acao: 'criacao',
        usuario_id: user.user?.id,
        valor_novo: lancamento.valor_bruto,
        descricao: `Lançamento criado: ${TIPO_RECEITA_LABELS[lancamento.tipo_receita] || lancamento.tipo_receita}`,
        dados_novos: lancamento as any
      });

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
      const { data: user } = await supabase.auth.getUser();
      
      // Buscar dados anteriores
      const { data: anterior } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('id', id)
        .single();
      
      // Calcular valor pendente se necessário
      if (updates.valor_bruto !== undefined || updates.valor_pago !== undefined) {
        const valorBruto = updates.valor_bruto ?? anterior?.valor_bruto ?? 0;
        const valorPago = updates.valor_pago ?? anterior?.valor_pago ?? 0;
        updates.valor_pendente = valorBruto - valorPago;
      }
      
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_financeira').insert({
        lancamento_id: id,
        acao: 'edicao',
        usuario_id: user.user?.id,
        valor_anterior: anterior?.valor_bruto,
        valor_novo: updates.valor_bruto ?? anterior?.valor_bruto,
        descricao: `Lançamento atualizado`,
        dados_anteriores: anterior as any,
        dados_novos: updates as any
      });

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
    mutationFn: async ({ id, isRafael }: { id: string; isRafael: boolean }) => {
      if (!isRafael) {
        throw new Error('Apenas o usuário RAFAEL pode excluir lançamentos financeiros.');
      }

      const { data: user } = await supabase.auth.getUser();
      
      // Buscar dados antes de excluir
      const { data: anterior } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_financeira').insert({
        lancamento_id: id,
        acao: 'exclusao',
        usuario_id: user.user?.id,
        valor_anterior: anterior?.valor_bruto,
        descricao: `Lançamento excluído: ${TIPO_RECEITA_LABELS[anterior?.tipo_receita] || anterior?.tipo_receita}`,
        dados_anteriores: anterior as any
      });
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

export function useMarcarRecebido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, dataRecebimento }: { id: string; dataRecebimento: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Buscar dados do lançamento
      const { data: lancamento } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('id', id)
        .single();

      if (!lancamento) throw new Error('Lançamento não encontrado');

      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .update({
          status: 'recebido',
          valor_pago: lancamento.valor_bruto,
          valor_pendente: 0,
          data_recebimento: dataRecebimento
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar na auditoria
      await supabase.from('auditoria_financeira').insert({
        lancamento_id: id,
        acao: 'edicao',
        usuario_id: user.user?.id,
        valor_anterior: lancamento.valor_pago,
        valor_novo: lancamento.valor_bruto,
        descricao: `Lançamento marcado como recebido`,
        dados_anteriores: { status: lancamento.status } as any,
        dados_novos: { status: 'recebido', data_recebimento: dataRecebimento } as any
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast({ title: 'Recebimento confirmado!', description: 'O valor foi registrado como recebido.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });
}

export function useFinanceiroStats(periodo: { inicio: string; fim: string }) {
  const queryClient = useQueryClient();

  // Configurar realtime
  useEffect(() => {
    const channel = supabase
      .channel('lancamentos-financeiros-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lancamentos_financeiros' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
          queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['financeiro-stats', periodo],
    queryFn: async () => {
      const hoje = new Date();
      
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

      // Buscar receita média dos últimos 3 meses fechados
      const { data: fechamentos } = await supabase
        .from('fechamentos_mensais')
        .select('total_recebido')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(3);

      const receitaMedia = fechamentos && fechamentos.length > 0
        ? fechamentos.reduce((sum, f) => sum + Number(f.total_recebido || 0), 0) / fechamentos.length
        : 0;

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
      const totalRecebido = lancamentos?.filter(l => l.status === 'recebido').reduce((sum, l) => sum + Number(l.valor_pago || 0), 0) || 0;
      const totalAReceber = lancamentos?.filter(l => l.status === 'em_aberto' || l.status === 'parcial').reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;
      
      // Em atraso: valores com data_vencimento passada e não recebidos
      const totalEmAtraso = lancamentos?.filter(l => {
        if (l.status === 'recebido') return false;
        if (l.status === 'em_atraso') return true;
        if (l.data_vencimento) {
          return new Date(l.data_vencimento) < hoje;
        }
        return false;
      }).reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;

      const totalAnterior = lancamentosAnteriores?.reduce((sum, l) => sum + Number(l.valor_pago || 0), 0) || 0;
      const crescimentoPercentual = totalAnterior > 0 ? ((totalRecebido - totalAnterior) / totalAnterior) * 100 : 0;

      // Por tipo
      const porTipoMap: Record<string, number> = {};
      lancamentos?.filter(l => l.status === 'recebido').forEach(l => {
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
      lancamentos?.filter(l => l.status === 'recebido').forEach(l => {
        if (l.data_recebimento) {
          porDiaMap[l.data_recebimento] = (porDiaMap[l.data_recebimento] || 0) + Number(l.valor_pago || 0);
        }
      });
      const porDia = Object.entries(porDiaMap)
        .map(([data, valor]) => ({ data, valor }))
        .sort((a, b) => a.data.localeCompare(b.data));

      // Por cliente
      const porClienteMap: Record<string, { nome: string; valor: number }> = {};
      lancamentos?.filter(l => l.status === 'recebido').forEach(l => {
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
        l.status === 'em_aberto' || l.status === 'parcial'
      ) || [];

      // Contas em atraso
      const contasEmAtraso = lancamentos?.filter(l => {
        if (l.status === 'recebido') return false;
        if (l.status === 'em_atraso') return true;
        if (l.data_vencimento) {
          return new Date(l.data_vencimento) < hoje;
        }
        return false;
      }) || [];

      // Lançamentos por status
      const statusCount: Record<string, number> = {};
      lancamentos?.forEach(l => {
        statusCount[l.status] = (statusCount[l.status] || 0) + 1;
      });
      const lancamentosPorStatus = Object.entries(statusCount).map(([status, quantidade]) => ({
        status,
        quantidade
      }));

      return {
        totalRecebido,
        totalAReceber,
        totalEmAtraso,
        receitaMedia,
        numeroLancamentos: lancamentos?.length || 0,
        crescimentoPercentual,
        porTipo,
        porDia,
        porCliente,
        contasAReceber: contasAReceber as LancamentoFinanceiro[],
        contasEmAtraso: contasEmAtraso as LancamentoFinanceiro[],
        lancamentosPorStatus
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
      const hoje = new Date();
      const ultimoDiaMes = new Date(ano, mes, 0).getDate();
      
      // Verificar se é o último dia do mês
      if (hoje.getDate() !== ultimoDiaMes || hoje.getMonth() + 1 !== mes || hoje.getFullYear() !== ano) {
        throw new Error('O fechamento só pode ser realizado no último dia do mês.');
      }

      // Calcular totais do mês
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

      const { data: lancamentos, error: fetchError } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .gte('created_at', inicioMes)
        .lte('created_at', `${fimMes}T23:59:59`);

      if (fetchError) throw fetchError;

      const totalRecebido = lancamentos?.filter(l => l.status === 'recebido').reduce((sum, l) => sum + Number(l.valor_pago || 0), 0) || 0;
      const totalAReceber = lancamentos?.filter(l => l.status === 'em_aberto' || l.status === 'parcial').reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;
      const totalEmAtraso = lancamentos?.filter(l => l.status === 'em_atraso').reduce((sum, l) => sum + Number(l.valor_pendente || 0), 0) || 0;

      const resumoPorTipo: Record<string, number> = {};
      lancamentos?.filter(l => l.status === 'recebido').forEach(l => {
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

export function useVerificarDuplicidade() {
  return useMutation({
    mutationFn: async ({ clienteId, tipoReceita, dataRecebimento }: { 
      clienteId: string; 
      tipoReceita: string; 
      dataRecebimento?: string 
    }) => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('id, status')
        .eq('cliente_id', clienteId)
        .eq('tipo_receita', tipoReceita);

      if (error) throw error;

      if (data && data.length > 0) {
        const temDuplicado = data.some(l => l.status === 'recebido' || l.status === 'em_aberto' || l.status === 'parcial');
        if (temDuplicado) {
          return { duplicado: true, mensagem: 'Já existe um lançamento para este cliente com este tipo de indenização.' };
        }
      }

      return { duplicado: false };
    }
  });
}
